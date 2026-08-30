import React, { useState } from "react";
import { Eye, LayoutGrid, List } from "lucide-react";
import { BulkOrder } from "@/features/bulk-orders";
import { OrderMoney } from "@/features/bulk-orders";
import { T, F } from "../../theme";
import { WholesaleCustomer, WholesaleTab } from "../../types";
import { Button } from "../../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../../shared/ui/data";
import { rupees, formatMoney } from "@/lib/domain/money";

const ORDER_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  "on-track": { label: "On Track", color: T.green, bg: T.greenBg },
  "at-risk": { label: "At Risk", color: "#8B6018", bg: "rgba(200,155,71,0.14)" },
  "overdue": { label: "Overdue", color: T.crimson, bg: T.crimsonBg },
};
const PAY_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  paid: { label: "Paid", color: T.green, bg: T.greenBg },
  partial: { label: "Partial", color: "#8B6018", bg: "rgba(200,155,71,0.14)" },
  pending: { label: "Pending", color: T.crimson, bg: T.crimsonBg },
};
const inr = (n: number) => formatMoney(rupees(n));

export function OverviewTab({
  customer, custOrders, custOrderMoney, custOutstanding, custSareesOrdered, custSareesDone,
  custActiveOrders, setWholesaleTab, onViewBulkOrder,
}: {
  customer: WholesaleCustomer;
  custOrders: BulkOrder[];
  custOrderMoney: Map<string, OrderMoney>;
  custOutstanding: number;
  custSareesOrdered: number;
  custSareesDone: number;
  custActiveOrders: BulkOrder[];
  setWholesaleTab: (t: WholesaleTab) => void;
  onViewBulkOrder: (order: BulkOrder, tab: "overview" | "sarees" | "payments" | "quotations") => void;
}) {
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  const orderColumns: ColumnDef<BulkOrder>[] = [
    {
      id: "ref", header: "Order Ref", accessor: o => o.ref, priority: 1,
      cell: (_v, o) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: T.royalBurgundy, fontWeight: 700 }}>{o.ref}</span>,
    },
    {
      id: "invoice", header: "Invoice No", accessor: o => o.invoiceId, priority: 3,
      cell: (_v, o) => {
        const m = custOrderMoney.get(o.ref)!;
        return <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe }}>{o.invoiceId || m.invoiceId || "—"}</span>;
      },
    },
    {
      id: "deadline", header: "Deadline", accessor: o => o.due, priority: 3,
      cell: (_v, o) => <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{o.due}</span>,
    },
    {
      id: "description", header: "Description", accessor: o => o.design,
      cell: (_v, o) => <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>{o.total}× {o.sareeType} · {o.design}</span>,
    },
    {
      id: "value", header: "Order Value", accessor: o => custOrderMoney.get(o.ref)!.amountDue,
      cell: (_v, o) => {
        const m = custOrderMoney.get(o.ref)!;
        return <span style={{ fontFamily: F.display, fontSize: 14, color: T.luxuryBrown, fontWeight: 600 }}>{m.amountDue ? inr(m.amountDue) : "—"}</span>;
      },
    },
    {
      id: "payment", header: "Payment", accessor: o => o.paymentStatus,
      cell: (_v, o) => {
        const pay = PAY_STATUS_META[o.paymentStatus ?? "pending"];
        return <span style={{ padding: "2px 8px", borderRadius: 5, fontSize: 12, fontWeight: 700, background: pay.bg, color: pay.color }}>{pay.label}</span>;
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6 sm:gap-8 min-w-0 max-w-full w-full">
      <div className="grid grid-cols-1 md:grid-cols-4" style={{ gap: 16 }}>
        {[
          { label: "Bulk Orders Placed", value: String(custOrders.length), color: T.luxuryBrown },
          { label: "Sarees Ordered", value: `${custSareesDone}/${custSareesOrdered}`, color: T.antiqueGold },
          { label: "Outstanding Balance", value: inr(custOutstanding), color: custOutstanding === 0 ? T.greenMid : T.crimson },
          { label: "Payment Terms", value: customer.terms, color: T.luxuryBrown, isMono: true },
        ].map((s) => (
          <div key={s.label} style={{ background: T.silkCream, padding: 24, borderRadius: 14 }}>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 6, fontWeight: 500 }}>{s.label}</div>
            <div style={{ fontFamily: s.isMono ? "var(--font-mono)" : F.display, fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Live production progress on every open bulk order */}
      {custActiveOrders.length > 0 && (
        <div className="p-4 sm:p-6 rounded-2xl border border-[var(--border-default)] bg-transparent min-w-0 max-w-full w-full">
          <div className="text-xs sm:text-sm font-bold text-[#4A061B] mb-4 flex items-center justify-between">
            <span>Active Orders in Production ({custActiveOrders.length})</span>
          </div>

          <div className="space-y-4">
            {custActiveOrders.map(o => {
              const pct = o.total ? Math.round((o.done / o.total) * 100) : 0;
              const meta = ORDER_STATUS_META[o.status] ?? ORDER_STATUS_META["on-track"];
              return (
                <div
                  key={o.ref}
                  onClick={() => onViewBulkOrder(o, "overview")}
                  role="button" tabIndex={0}
                  aria-label={`Open bulk order ${o.ref}`}
                  onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onViewBulkOrder(o, "overview"); } }}
                  className="bg-[#F7F2EA] hover:bg-[#F0E8DC] p-3.5 sm:p-4 rounded-xl border border-[var(--border-default)] transition-all cursor-pointer space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-sm text-[#6E0F2D]">{o.ref}</span>
                      <span className="text-xs text-[#524438] font-medium">
                        {o.done} of {o.total} sarees {o.design ? `· ${o.design}` : ""}
                      </span>
                    </div>
                    <span
                      className="inline-flex items-center self-start sm:self-auto px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0"
                      style={{ background: meta.bg, color: meta.color }}
                    >
                      {meta.label}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 w-full bg-[rgba(110,15,45,0.12)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#6E0F2D] rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#7A6859] pt-0.5">
                    <span>Due {o.due}</span>
                    <span className="font-mono font-bold text-[#6E0F2D]">{pct}% complete</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="min-w-0 max-w-full w-full">
        {/* Mobile Capsule View Mode Switcher */}
        <div className="flex sm:hidden mb-4">
          <div className="inline-flex items-center rounded-full border border-[#E8DCC4] bg-white p-0.5 shadow-xs overflow-hidden">
            <button
              onClick={() => setViewMode("card")}
              className={`px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                viewMode === "card"
                  ? "bg-[#6E0F2D] text-[#FFFDF9] shadow-xs"
                  : "bg-transparent text-[#3B2314] hover:bg-slate-50"
              }`}
            >
              <LayoutGrid size={15} /> Card View
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-[#6E0F2D] text-[#FFFDF9] shadow-xs"
                  : "bg-transparent text-[#3B2314] hover:bg-slate-50"
              }`}
            >
              <List size={15} /> Table View
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mb-4">
          {custOrders.length > 0 && (
            <Button onClick={() => setWholesaleTab("Order History")} variant="link" size="sm">
              View Full Order History →
            </Button>
          )}
        </div>

        {custOrders.length === 0 ? (
          <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "36px 20px", textAlign: "center", fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
            No bulk orders have been created for this customer yet.
          </div>
        ) : (
          <>
            {/* Mobile Display Mode */}
            <div className="sm:hidden min-w-0 max-w-full w-full">
              {viewMode === "card" ? (
                <div className="grid grid-cols-1 gap-3.5">
                  {custOrders.slice(0, 4).map(o => {
                    const money = custOrderMoney.get(o.ref);
                    const pay = PAY_STATUS_META[o.paymentStatus ?? "pending"];
                    return (
                      <div
                        key={o.ref}
                        onClick={() => onViewBulkOrder(o, "overview")}
                        role="button" tabIndex={0}
                        aria-label={`Open bulk order ${o.ref}`}
                        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onViewBulkOrder(o, "overview"); } }}
                        className="bg-white rounded-2xl border border-[var(--border-default)] p-4 hover:border-[#6E0F2D] transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="font-mono font-bold text-sm text-[#6E0F2D]">{o.ref}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${pay.bg} ${pay.color}`}>
                            {pay.label}
                          </span>
                        </div>

                        <div className="space-y-2 text-xs mb-4">
                          <div className="flex justify-between">
                            <span className="text-[var(--text-tertiary)]">Description</span>
                            <span className="font-medium text-[var(--text-primary)] text-right">{o.total}× {o.sareeType}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[var(--text-tertiary)]">Order Value</span>
                            <span className="font-serif font-bold text-sm text-[var(--text-primary)]">{money?.amountDue ? inr(money.amountDue) : "—"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[var(--text-tertiary)]">Payment Status</span>
                            <span className={`font-bold ${pay.color}`}>{pay.label}</span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-[var(--text-tertiary)]">Progress: <strong>{o.done}/{o.total} sarees</strong></span>
                          <span className="text-[#6E0F2D] font-bold flex items-center gap-1">
                            <Eye size={13} /> View Details
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  className="w-full max-w-full min-w-0 overflow-x-auto touch-pan-x border border-[var(--border-default)] rounded-2xl bg-white shadow-xs"
                  style={{ WebkitOverflowScrolling: "touch" }}
                >
                  <div className="min-w-[650px]">
                    <DataTable
                      responsive={false}
                      columns={orderColumns}
                      data={custOrders.slice(0, 4)}
                      getRowId={o => o.ref}
                      onRowClick={o => onViewBulkOrder(o, "payments")}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Display Mode (Always Table) */}
            <div
              className="hidden sm:block w-full max-w-full min-w-0 overflow-x-auto touch-pan-x border border-[var(--border-default)] rounded-2xl bg-white shadow-xs"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <div className="min-w-[650px]">
                <DataTable
                  responsive={false}
                  columns={orderColumns}
                  data={custOrders}
                  getRowId={o => o.ref}
                  pageSize={5}
                  pagination={true}
                  onRowClick={o => onViewBulkOrder(o, "payments")}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
