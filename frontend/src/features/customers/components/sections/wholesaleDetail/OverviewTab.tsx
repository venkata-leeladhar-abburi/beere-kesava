import React from "react";
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
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
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
        <div style={{ background: T.darkBurgundy, padding: 28, borderRadius: 16, color: "#FFF" }}>
          <div style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 18, fontWeight: 500 }}>
            Active Orders in Production ({custActiveOrders.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {custActiveOrders.map(o => {
              const pct = o.total ? Math.round((o.done / o.total) * 100) : 0;
              const meta = ORDER_STATUS_META[o.status] ?? ORDER_STATUS_META["on-track"];
              return (
                <div key={o.ref} style={{ cursor: "pointer" }} onClick={() => onViewBulkOrder(o, "overview")} role="button" tabIndex={0} aria-label={`View details for order ${o.ref}`} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (() => onViewBulkOrder(o, "overview"))?.(); } }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, color: T.goldLight, fontWeight: 700 }}>{o.ref}</span>
                      <span style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,255,255,0.65)" }}>{o.done} of {o.total} sarees · {o.sareeType}</span>
                      <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, background: meta.bg, color: meta.color, padding: "2px 9px", borderRadius: 20 }}>{meta.label}</span>
                    </div>
                    <span style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>Due {o.due}</span>
                  </div>
                  <div style={{ width: "100%", height: 6, background: "rgba(255,255,255,0.2)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: T.antiqueGold, borderRadius: 99 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <h3 style={{ fontFamily: F.display, fontSize: 18, color: T.luxuryBrown, margin: 0 }}>Bulk Orders &amp; Invoices</h3>
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
          <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, overflow: "hidden" }}>
            <DataTable
              responsive
              columns={orderColumns}
              data={custOrders.slice(0, 4)}
              getRowId={o => o.ref}
              onRowClick={o => onViewBulkOrder(o, "payments")}
            />
          </div>
        )}
      </div>
    </div>
  );
}
