import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Wallet, Receipt, ShoppingBag, Clock } from "lucide-react";
import { T, F } from "../theme";
import { FadeUp, SumCard, TabTitle, StatusPill } from "../common/primitives";
import { reportsApi, OutstandingPaymentItem } from "../../../../shared/api/reports";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";

const SOURCE_LABEL: Record<string, string> = { invoice: "Invoice", bulk_order: "Bulk Order" };

function statusTone(status: string): "bad" | "warn" {
  return status === "OVERDUE" ? "bad" : "warn";
}

export function OutstandingPaymentsReport() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["reports", "outstanding-payments"],
    queryFn: () => reportsApi.outstandingPayments(),
  });

  const items = data?.items ?? [];
  const invoiceCount = items.filter(i => i.source === "invoice").length;
  const bulkOrderCount = items.filter(i => i.source === "bulk_order").length;

  const columns: ColumnDef<OutstandingPaymentItem>[] = [
    {
      id: "source", header: "Source", accessor: r => r.source,
      cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", padding: "2px 8px", borderRadius: 5 }}>{SOURCE_LABEL[r.source] ?? r.source}</span>,
    },
    { id: "reference", header: "Reference", accessor: r => r.id, cell: (_v, r) => <span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy }}>{r.id}</span> },
    { id: "customer", header: "Customer", accessor: r => r.customerName, cell: (_v, r) => <span style={{ fontFamily: F.ui, fontWeight: 600 }}>{r.customerName}</span> },
    { id: "total", header: "Total", accessor: r => r.total, align: "end", cell: (_v, r) => <span style={{ fontFamily: F.mono, fontWeight: 700 }}>₹{r.total.toLocaleString("en-IN")}</span> },
    { id: "paid", header: "Paid", accessor: r => r.paid, align: "end", cell: (_v, r) => <span style={{ fontFamily: F.mono, color: T.green }}>₹{r.paid.toLocaleString("en-IN")}</span> },
    { id: "outstanding", header: "Outstanding", accessor: r => r.outstanding, align: "end", cell: (_v, r) => <span style={{ fontFamily: F.mono, fontWeight: 700, color: T.crimson }}>₹{r.outstanding.toLocaleString("en-IN")}</span> },
    {
      id: "dueDate", header: "Due Date", accessor: r => r.dueDate,
      cell: (_v, r) => r.dueDate ? (
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Clock size={12} color={T.taupe} />
          {new Date(r.dueDate).toLocaleDateString("en-IN")}
        </span>
      ) : "—",
    },
    {
      id: "status", header: "Status", accessor: r => r.status, type: "status", align: "center",
      cell: (_v, r) => <StatusPill label={r.status} type={statusTone(r.status)} />,
    },
  ];

  return (
    <div id="rep-outstanding-payments" style={{ padding: "32px 40px" }}>
      <TabTitle
        title="Outstanding Payments Report"
        sub="Every unpaid or partially-paid invoice and bulk order across all wholesale customers, pulled live from the backend."
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 32, alignItems: "stretch" }}>
        <SumCard icon={<Wallet size={22} color={T.crimson} />} label="Total Outstanding" value={`₹${(data?.totalOutstanding ?? 0).toLocaleString("en-IN")}`} sub={`${data?.count ?? 0} records`} crimsonHi />
        <SumCard icon={<Receipt size={22} color={T.royalBurgundy} />} label="Unpaid Invoices" value={`${invoiceCount}`} sub="From /invoices" />
        <SumCard icon={<ShoppingBag size={22} color={T.antiqueGold} />} label="Unpaid Bulk Orders" value={`${bulkOrderCount}`} sub="From /bulk-orders" hi />
      </div>

      <FadeUp>
        <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
          <div style={{ overflowX: "auto", minWidth: 900 }}>
            <DataTable
              columns={columns}
              data={items}
              getRowId={r => `${r.source}-${r.id}`}
              loading={isLoading}
              error={!!isError}
              emptyTitle="Nothing outstanding — every invoice and bulk order is fully paid."
            />
          </div>
        </div>
      </FadeUp>
    </div>
  );
}
