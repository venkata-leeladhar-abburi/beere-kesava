import React from "react";
import { useQuery } from "@tanstack/react-query";
import { DateFilterBar, DateFilterState, matchesDateFilter } from "../../../../../shared/ui/DateFilterBar";
import { T, F } from "../../theme";
import { DataTable, type ColumnDef } from "../../../../../shared/ui/data";
import { Money } from "../../../../../shared/ui/domain/Money";
import { StatusPill } from "../../../../../shared/ui/domain";
import { rupees } from "../../../../../lib/domain/money";
import { invoicesApi } from "../../../../../shared/api/invoices";

interface PaymentRow {
  id: string;
  date: string;
  utr: string;
  amt: number;
  invoiceId: string;
}

const columns: ColumnDef<PaymentRow>[] = [
  {
    id: "invoice", header: "Invoice", accessor: p => p.invoiceId, priority: 3,
    cell: (_v, p) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: T.royalBurgundy }}>INV-{p.invoiceId.slice(0, 8).toUpperCase()}</span>,
  },
  {
    id: "date", header: "Payment Date", accessor: p => p.date,
    cell: (_v, p) => <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{new Date(p.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>,
  },
  {
    id: "utr", header: "UTR Number", accessor: p => p.utr, priority: 3,
    cell: (_v, p) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: T.taupe }}>{p.utr || "—"}</span>,
  },
  {
    id: "amt", header: "Amount Paid", accessor: p => p.amt,
    cell: (_v, p) => <span style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: T.green }}><Money value={rupees(p.amt)} /></span>,
  },
  {
    // Every row here is a real InvoicePayment record — money that has
    // actually been recorded as received — so "Settled" is never a guess;
    // a customer with no payments simply has no rows, not a fake "cleared".
    id: "status", header: "Status", accessor: () => "settled" as const, type: "status",
    cell: () => <StatusPill taxonomy="payment" status="settled" />,
  },
];

export function PaymentHistoryTab({
  customerId, wholesalePaymentDateFilter, setWholesalePaymentDateFilter,
}: {
  customerId: string;
  wholesalePaymentDateFilter: DateFilterState;
  setWholesalePaymentDateFilter: (f: DateFilterState) => void;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["invoices", "by-customer", customerId],
    queryFn: () => invoicesApi.list({ customerId, pageSize: 200 }),
    enabled: !!customerId,
  });

  const payments: PaymentRow[] = (data?.items ?? []).flatMap(inv =>
    inv.payments.map(p => ({ id: p.id, date: p.date, utr: p.utr ?? "", amt: Number(p.amount), invoiceId: inv.id }))
  ).sort((a, b) => (a.date > b.date ? -1 : 1));

  const filtered = payments.filter(p => matchesDateFilter(p.date, wholesalePaymentDateFilter));

  return (
    <div>
      <div className="mb-6">
        <DateFilterBar filter={wholesalePaymentDateFilter} onChange={setWholesalePaymentDateFilter} />
      </div>
      {isError && (
        <div style={{ background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.25)", borderRadius: 10, padding: "10px 14px", fontFamily: F.ui, fontSize: 12, color: "#C0392B", fontWeight: 600, marginBottom: 12 }}>
          Failed to load payment history. Please try again.
        </div>
      )}
      <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, overflow: "hidden" }}>
        <DataTable
          responsive
          columns={columns}
          data={filtered}
          getRowId={p => p.id}
          pageSize={5}
          pagination={true}
          emptyTitle={isLoading ? "Loading…" : "No payments received from this customer yet."}
        />
      </div>
    </div>
  );
}
