import React, { useState } from "react";
import { Eye, LayoutGrid, List } from "lucide-react";
import { BulkOrder } from "@/features/bulk-orders";
import { DateFilterBar, DateFilterState, matchesDateFilter } from "../../../../../shared/ui/DateFilterBar";
import { OrderMoney } from "@/features/bulk-orders";
import { T, F } from "../../theme";
import { Button } from "../../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../../shared/ui/data";
import { rupees, formatMoney } from "@/lib/domain/money";

const PAY_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  paid: { label: "Paid", color: T.green, bg: T.greenBg },
  partial: { label: "Partial", color: "#8B6018", bg: "rgba(200,155,71,0.14)" },
  pending: { label: "Pending", color: T.crimson, bg: T.crimsonBg },
};
const inr = (n: number) => formatMoney(rupees(n));

export interface OrderHistoryTabProps {
  custOrders: BulkOrder[];
  custOrderMoney: Map<string, OrderMoney>;
  wholesaleOrderDateFilter: DateFilterState;
  setWholesaleOrderDateFilter: (f: DateFilterState) => void;
  onViewBulkOrder: (order: BulkOrder, tab: "overview" | "sarees" | "payments" | "quotations") => void;
}

export function OrderHistoryTab({
  custOrders, custOrderMoney, wholesaleOrderDateFilter, setWholesaleOrderDateFilter, onViewBulkOrder,
}: OrderHistoryTabProps) {
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  const rows = custOrders.filter(o => matchesDateFilter(o.due, wholesaleOrderDateFilter));
  const rowsOrdered = rows.reduce((a, o) => a + o.total, 0);
  const rowsDone = rows.reduce((a, o) => a + o.done, 0);
  const rowsValue = rows.reduce((a, o) => a + (custOrderMoney.get(o.ref)?.amountDue ?? 0), 0);
  const rowsDue = rows.reduce((a, o) => a + (custOrderMoney.get(o.ref)?.balance ?? 0), 0);

  const columns: ColumnDef<BulkOrder>[] = [
    {
      id: "ref", header: "Order Ref", accessor: o => o.ref, priority: 1,
      cell: (_v, o) => (
        <>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: T.royalBurgundy, fontWeight: 700 }}>{o.ref}</span>
          {o.tallied && <div style={{ fontFamily: F.ui, fontSize: 12, color: T.green, marginTop: 3 }}>✓ Tallied</div>}
        </>
      ),
    },
    {
      id: "deadline", header: "Deadline", accessor: o => o.due, priority: 3,
      cell: (_v, o) => <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{o.due}</span>,
    },
    {
      id: "sareeType", header: "Saree Type / Design", accessor: o => o.sareeType, priority: 3,
      cell: (_v, o) => (
        <>
          <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>{o.sareeType}</span>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe, marginTop: 2 }}>{o.design}</div>
        </>
      ),
    },
    {
      id: "progress", header: "Sarees (Done/Total)", accessor: o => `${o.done}/${o.total}`, priority: 3,
      cell: (_v, o) => <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>{o.done}/{o.total}</span>,
    },
    {
      id: "value", header: "Order Value", accessor: o => custOrderMoney.get(o.ref)?.amountDue ?? 0, priority: 1,
      cell: (_v, o) => {
        const m = custOrderMoney.get(o.ref);
        return <span style={{ fontFamily: F.display, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>{m?.amountDue ? inr(m.amountDue) : "—"}</span>;
      },
    },
    {
      id: "payment", header: "Payment", accessor: o => o.paymentStatus, priority: 1,
      cell: (_v, o) => {
        const pay = PAY_STATUS_META[o.paymentStatus ?? "pending"];
        return <span style={{ padding: "3px 9px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: pay.bg, color: pay.color }}>{pay.label}</span>;
      },
    },
    {
      id: "actions", header: "", accessor: o => o.ref, priority: 1,
      cell: (_v, o) => (
        <Button onClick={() => onViewBulkOrder(o, "overview")} variant="tertiary" size="sm" iconLeft={Eye}>
          View Order
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col min-w-0 max-w-full w-full">
      {/* Mobile Capsule View Mode Switcher */}
      <div className="flex sm:hidden mb-3">
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

      {/* DateFilterBar and Stats Strip on the SAME line */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex-1 min-w-[280px]">
          <DateFilterBar filter={wholesaleOrderDateFilter} onChange={setWholesaleOrderDateFilter} />
        </div>

        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
          {[
            { label: "ORDERS", value: String(rows.length) },
            { label: "SAREES", value: `${rowsDone}/${rowsOrdered}` },
            { label: "ORDER VALUE", value: inr(rowsValue) },
            { label: "OUTSTANDING", value: inr(rowsDue) },
          ].map(k => (
            <div key={k.label}>
              <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", color: T.taupe }}>{k.label}</div>
              <div style={{ fontFamily: F.display, fontSize: 17, fontWeight: 700, color: T.luxuryBrown }}>{k.value}</div>
            </div>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "40px 20px", textAlign: "center", fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
          {custOrders.length === 0
            ? "No bulk orders have been created for this customer yet."
            : "No bulk orders fall in this period. Widen the timeline to see more."}
        </div>
      ) : (
        <>
          {/* Mobile Display Mode */}
          <div className="sm:hidden min-w-0 max-w-full w-full">
            {viewMode === "card" ? (
              <div className="grid grid-cols-1 gap-3.5">
                {rows.map(o => {
                  const money = custOrderMoney.get(o.ref);
                  const pay = PAY_STATUS_META[o.paymentStatus ?? "pending"];
                  return (
                    <div
                      key={o.ref}
                      onClick={() => onViewBulkOrder(o, "overview")} role="button" tabIndex={0}
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
                          <span className="font-medium text-[var(--text-primary)] text-right">{o.total}× {o.sareeType} · {o.design}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--text-tertiary)]">Order Value</span>
                          <span className="font-serif font-bold text-sm text-[var(--text-primary)]">{money?.amountDue ? inr(money.amountDue) : "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--text-tertiary)]">Deadline</span>
                          <span className="font-medium text-[var(--text-secondary)]">{o.due}</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[var(--text-tertiary)]">Progress: <strong>{o.done}/{o.total} sarees</strong></span>
                        <span className="text-[#6E0F2D] font-bold flex items-center gap-1">
                          <Eye size={13} /> View Order
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
                  <DataTable responsive={false} columns={columns} data={rows} getRowId={o => o.ref} pageSize={5} pagination={true} />
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
              <DataTable responsive={false} columns={columns} data={rows} getRowId={o => o.ref} pageSize={5} pagination={true} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
