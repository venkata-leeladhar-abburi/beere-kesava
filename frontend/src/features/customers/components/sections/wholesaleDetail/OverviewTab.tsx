import React from "react";
import { BulkOrder } from "../../../../bulk-orders/contexts/BulkOrderContext";
import { OrderMoney } from "../../../../bulk-orders/utils/BulkOrderLinking";
import { T, F } from "../../theme";
import { WholesaleCustomer, WholesaleTab } from "../../types";

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
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

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
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {[
          { label: "Bulk Orders Placed", value: String(custOrders.length), color: T.luxuryBrown },
          { label: "Sarees Ordered", value: `${custSareesDone}/${custSareesOrdered}`, color: T.antiqueGold },
          { label: "Outstanding Balance", value: inr(custOutstanding), color: custOutstanding === 0 ? T.greenMid : T.crimson },
          { label: "Payment Terms", value: customer.terms, color: T.luxuryBrown, isMono: true },
        ].map((s, idx) => (
          <div key={idx} style={{ background: T.silkCream, padding: 24, borderRadius: 14 }}>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 6, fontWeight: 500 }}>{s.label}</div>
            <div style={{ fontFamily: s.isMono ? F.mono : F.display, fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
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
                <div key={o.ref} style={{ cursor: "pointer" }} onClick={() => onViewBulkOrder(o, "overview")} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (() => onViewBulkOrder(o, "overview"))?.(); } }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: F.mono, fontSize: 16, color: T.goldLight, fontWeight: 700 }}>{o.ref}</span>
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
            <button onClick={() => setWholesaleTab("Order History")}
              style={{ background: "transparent", border: "none", color: T.antiqueGold, fontFamily: F.ui, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              View Full Order History →
            </button>
          )}
        </div>
        {custOrders.length === 0 ? (
          <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "36px 20px", textAlign: "center", fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
            No bulk orders have been created for this customer yet.
          </div>
        ) : (
          <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: T.warmCream, borderBottom: `1px solid ${T.borderDef}`, textAlign: "left" }}>
                  {["Order Ref", "Invoice No", "Deadline", "Description", "Order Value", "Payment"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {custOrders.slice(0, 4).map(o => {
                  const m = custOrderMoney.get(o.ref)!;
                  const pay = PAY_STATUS_META[o.paymentStatus ?? "pending"];
                  return (
                    <tr key={o.ref} onClick={() => onViewBulkOrder(o, "payments")}
                      style={{ borderBottom: `1px solid ${T.borderDef}`, cursor: "pointer" }}>
                      <td style={{ padding: "12px 14px", fontFamily: F.mono, fontSize: 13, color: T.royalBurgundy, fontWeight: 700 }}>{o.ref}</td>
                      <td style={{ padding: "12px 14px", fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{o.invoiceId || m.invoiceId || "—"}</td>
                      <td style={{ padding: "12px 14px", fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{o.due}</td>
                      <td style={{ padding: "12px 14px", fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>{o.total}× {o.sareeType} · {o.design}</td>
                      <td style={{ padding: "12px 14px", fontFamily: F.display, fontSize: 14, color: T.luxuryBrown, fontWeight: 600 }}>{m.amountDue ? inr(m.amountDue) : "—"}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ padding: "2px 8px", borderRadius: 5, fontSize: 12, fontWeight: 700, background: pay.bg, color: pay.color }}>{pay.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
