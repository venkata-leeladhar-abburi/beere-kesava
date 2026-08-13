// Payment History tab of the supplier profile.

import React from "react";
import { DateFilterBar, DateFilterState } from "../../../../../shared/ui/DateFilterBar";
import { T, F } from "../../theme";
import { SupplierPayment } from "../../../contexts/SupplierContext";
import { formatMoney, rupees } from "@/lib/domain/money";
import { DataTable, type ColumnDef } from "../../../../../shared/ui/data";

const paymentColumns: ColumnDef<SupplierPayment>[] = [
  {
    id: "id", header: "Payment Ref", accessor: p => p.id, priority: 1,
    cell: (_v, p) => <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.royalBurgundy }}>{p.id}</span>,
  },
  {
    id: "date", header: "Date", accessor: p => p.date,
    cell: (_v, p) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{p.date}</span>,
  },
  {
    id: "purchaseId", header: "Against Purchase", accessor: p => p.purchaseId, priority: 3,
    cell: (_v, p) => <span style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown }}>{p.purchaseId || "—"}</span>,
  },
  {
    id: "mode", header: "Mode", accessor: p => p.mode,
    cell: (_v, p) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{p.mode}</span>,
  },
  {
    id: "reference", header: "Reference", accessor: p => p.reference, priority: 3,
    cell: (_v, p) => <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{p.reference}</span>,
  },
  {
    id: "amount", header: "Amount", accessor: p => p.amount,
    cell: (_v, p) => <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.green }}>{formatMoney(rupees(p.amount))}</span>,
  },
];

export function PaymentsTab({
  card, filteredPaidSum, totalPaid, outstanding, payFilter, setPayFilter, filteredPayments,
}: {
  card: React.CSSProperties;
  filteredPaidSum: number;
  totalPaid: number;
  outstanding: number;
  payFilter: DateFilterState;
  setPayFilter: (f: DateFilterState) => void;
  filteredPayments: SupplierPayment[];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 16 }}>
        {[
          { label: "Paid in Range",  value: formatMoney(rupees(filteredPaidSum)),      color: T.green },
          { label: "Paid All Time",  value: formatMoney(rupees(totalPaid)),      color: T.luxuryBrown },
          { label: "Outstanding",    value: formatMoney(rupees(outstanding)),    color: outstanding > 0 ? T.crimson : T.green },
        ].map(s => (
          <div key={s.label} style={{ ...card, padding: "20px 22px" }}>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={card}>
        <div style={{ padding: "18px 22px", borderBottom: `1px solid ${T.borderDef}` }}>
          <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, color: T.luxuryBrown, marginBottom: 12 }}>Payments Made</div>
          <DateFilterBar filter={payFilter} onChange={setPayFilter} />
        </div>
        {filteredPayments.length === 0 ? (
          <div style={{ padding: "40px 24px", textAlign: "center", fontFamily: F.ui, fontSize: 13, color: T.taupe }}>No payments in this period.</div>
        ) : (
          <DataTable
            responsive
            columns={paymentColumns}
            data={filteredPayments}
            getRowId={p => p.id}
          />
        )}
      </div>
    </div>
  );
}
