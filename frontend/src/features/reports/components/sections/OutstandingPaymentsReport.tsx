import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Wallet, Receipt, ShoppingBag, Clock, LayoutGrid, List } from "lucide-react";
import { T, F } from "../theme";
import { FadeUp, SumCard, SectionCard } from "../common/primitives";
import { reportsApi, OutstandingPaymentItem } from "../../../../shared/api/reports";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { Button } from "../../../../shared/ui/primitives";
import { rupees, formatMoney } from "@/lib/domain/money";
import { Money, StatusPill } from "@/shared/ui/domain";
import type { StatusValueOf } from "@/lib/domain/status";

const SOURCE_LABEL: Record<string, string> = { invoice: "Invoice", bulk_order: "Bulk Order" };

// Invoice/BulkOrder payment status ("PENDING" | "PARTIAL" | "OVERDUE" from
// the backend) normalized onto the shared payment taxonomy
// (lib/domain/status.ts) per design-system/06-DOMAIN.md Part D.
const PAYMENT_STATUS_KEY: Record<string, StatusValueOf<"payment">> = {
  PENDING: "unpaid",
  PARTIAL: "partial",
  OVERDUE: "overdue",
};

export function OutstandingPaymentsReport() {
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["reports", "outstanding-payments"],
    queryFn: () => reportsApi.outstandingPayments(),
  });

  const items = data?.items ?? [];
  const invoiceCount = items.filter(i => i.source === "invoice").length;
  const bulkOrderCount = items.filter(i => i.source === "bulk_order").length;

  const columns: ColumnDef<OutstandingPaymentItem>[] = [
    {
      id: "source", header: "Source", accessor: r => r.source, priority: 3,
      cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", padding: "2px 8px", borderRadius: 5 }}>{SOURCE_LABEL[r.source] ?? r.source}</span>,
    },
    { id: "reference", header: "Reference", accessor: r => r.id, priority: 3, cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.royalBurgundy }}>{r.id}</span> },
    { id: "customer", header: "Customer", accessor: r => r.customerName, priority: 1, cell: (_v, r) => <span style={{ fontFamily: F.ui, fontWeight: 600 }}>{r.customerName}</span> },
    { id: "total", header: "Total", accessor: r => r.total, align: "end", cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}><Money value={rupees(r.total)} /></span> },
    { id: "paid", header: "Paid", accessor: r => r.paid, align: "end", cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", color: T.green }}><Money value={rupees(r.paid)} /></span> },
    { id: "outstanding", header: "Outstanding", accessor: r => r.outstanding, align: "end", cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: T.crimson }}><Money value={rupees(r.outstanding)} /></span> },
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
      cell: (_v, r) => <StatusPill taxonomy="payment" status={PAYMENT_STATUS_KEY[r.status] ?? "unpaid"} />,
    },
  ];

  return (
    <div id="rep-outstanding-payments" className="px-4 md:px-7 xl:px-10" style={{ paddingTop: 32 }}>
      <SectionCard
        icon={Wallet}
        title="Outstanding Payments Report"
        subtitle="Every unpaid or partially-paid invoice and bulk order across all wholesale customers, pulled live from the backend."
      >
        <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 16, marginBottom: 32, alignItems: "stretch" }}>
          <SumCard icon={<Wallet size={22} color={T.crimson} />} label="Total Outstanding" value={formatMoney(rupees(data?.totalOutstanding ?? 0))} sub={`${data?.count ?? 0} records`} crimsonHi />
          <SumCard icon={<Receipt size={22} color={T.royalBurgundy} />} label="Unpaid Invoices" value={`${invoiceCount}`} sub="From /invoices" />
          <SumCard icon={<ShoppingBag size={22} color={T.antiqueGold} />} label="Unpaid Bulk Orders" value={`${bulkOrderCount}`} sub="From /bulk-orders" hi />
        </div>

        {/* Mobile View Toggle */}
        <div className="flex md:hidden justify-end mb-3">
          <div className="flex items-center border border-[#E8DCC4] rounded-xl overflow-hidden bg-white shrink-0">
            <Button
              onClick={() => setViewMode("card")}
              variant="ghost"
              className={`h-auto rounded-none gap-1.5 py-1.5 px-3 text-[12px] font-bold ${
                viewMode === "card"
                  ? "bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D] hover:text-[#FFFDF9] active:bg-[#580B23]"
                  : "bg-white text-[var(--text-tertiary)] hover:bg-[#F7F2EA] hover:text-[#6E0F2D] active:bg-[#EFE7D8]"
              }`}
            >
              <LayoutGrid size={14} /> Card View
            </Button>
            <Button
              onClick={() => setViewMode("table")}
              variant="ghost"
              className={`h-auto rounded-none gap-1.5 py-1.5 px-3 text-[12px] font-bold ${
                viewMode === "table"
                  ? "bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D] hover:text-[#FFFDF9] active:bg-[#580B23]"
                  : "bg-white text-[var(--text-tertiary)] hover:bg-[#F7F2EA] hover:text-[#6E0F2D] active:bg-[#EFE7D8]"
              }`}
            >
              <List size={14} /> Table View
            </Button>
          </div>
        </div>

        <FadeUp>
          {/* Mobile Card View */}
          <div className={`grid grid-cols-1 gap-3.5 ${viewMode === "card" ? "block md:hidden" : "hidden"}`}>
            {items.map(r => (
              <div key={`${r.source}-${r.id}`} style={{ background: "#FFFFFF", border: "1px solid rgba(110,15,45,0.12)", borderRadius: 16, padding: "16px", display: "flex", flexDirection: "column", gap: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>{r.customerName}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.royalBurgundy, background: "rgba(110,15,45,0.06)", padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>{r.id}</span>
                      <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", padding: "2px 8px", borderRadius: 5 }}>{SOURCE_LABEL[r.source] ?? r.source}</span>
                    </div>
                  </div>
                  <StatusPill taxonomy="payment" status={PAYMENT_STATUS_KEY[r.status] ?? "unpaid"} />
                </div>

                {r.dueDate && (
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, display: "flex", alignItems: "center", gap: 5 }}>
                    <Clock size={13} color={T.taupe} />
                    Due Date: {new Date(r.dueDate).toLocaleDateString("en-IN")}
                  </div>
                )}

                <div style={{ width: "100%", height: 1, background: "rgba(110,15,45,0.08)" }} />

                <div className="grid grid-cols-3 gap-2.5">
                  <div style={{ background: "#F6F4EF", borderRadius: 12, padding: "8px 10px", textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: T.taupe, letterSpacing: "0.7px", textTransform: "uppercase", marginBottom: 2 }}>TOTAL</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}><Money value={rupees(r.total)} /></div>
                  </div>
                  <div style={{ background: "rgba(30,102,64,0.08)", borderRadius: 12, padding: "8px 10px", textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: T.green, letterSpacing: "0.7px", textTransform: "uppercase", marginBottom: 2 }}>PAID</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: T.green }}><Money value={rupees(r.paid)} /></div>
                  </div>
                  <div style={{ background: "rgba(192,57,43,0.06)", borderRadius: 12, padding: "8px 10px", textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: T.crimson, letterSpacing: "0.7px", textTransform: "uppercase", marginBottom: 2 }}>OUTSTANDING</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: T.crimson }}><Money value={rupees(r.outstanding)} /></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View & Mobile Table Mode */}
          <div className={`w-full overflow-x-auto section-nav-scroll border border-[#E8DCC4] rounded-xl bg-white p-2 ${viewMode === "table" ? "block" : "hidden md:block"}`}>
            <div className="min-w-[900px]">
              <DataTable
                responsive={false}
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
      </SectionCard>
    </div>
  );
}
