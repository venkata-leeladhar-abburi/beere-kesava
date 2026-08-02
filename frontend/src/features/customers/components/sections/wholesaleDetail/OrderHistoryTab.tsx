import { Eye, ShoppingBag } from "lucide-react";
import { BulkOrder } from "../../../../bulk-orders/contexts/BulkOrderContext";
import { DateFilterBar, DateFilterState, matchesDateFilter } from "../../../../../shared/ui/DateFilterBar";
import { OrderMoney } from "../../../../bulk-orders/utils/BulkOrderLinking";
import { T, F } from "../../theme";

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
  const rows = custOrders.filter(o => matchesDateFilter(o.due, wholesaleOrderDateFilter));
  const rowsOrdered = rows.reduce((a, o) => a + o.total, 0);
  const rowsDone = rows.reduce((a, o) => a + o.done, 0);
  const rowsValue = rows.reduce((a, o) => a + (custOrderMoney.get(o.ref)?.amountDue ?? 0), 0);
  const rowsDue = rows.reduce((a, o) => a + (custOrderMoney.get(o.ref)?.balance ?? 0), 0);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <h3 style={{ fontFamily: F.display, fontSize: 18, color: T.luxuryBrown, margin: 0 }}>Bulk Order History</h3>
        <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
          {[
            { label: "ORDERS", value: String(rows.length) },
            { label: "SAREES", value: `${rowsDone}/${rowsOrdered}` },
            { label: "ORDER VALUE", value: inr(rowsValue) },
            { label: "OUTSTANDING", value: inr(rowsDue) },
          ].map(k => (
            <div key={k.label}>
              <div style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 600, letterSpacing: "1px", color: T.taupe }}>{k.label}</div>
              <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: T.luxuryBrown }}>{k.value}</div>
            </div>
          ))}
        </div>
      </div>
      <DateFilterBar filter={wholesaleOrderDateFilter} onChange={setWholesaleOrderDateFilter} />
      {rows.length === 0 ? (
        <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "40px 20px", textAlign: "center", fontFamily: F.ui, fontSize: 13.5, color: T.taupe }}>
          {custOrders.length === 0
            ? "No bulk orders have been created for this customer yet."
            : "No bulk orders fall in this period. Widen the timeline to see more."}
        </div>
      ) : (
        <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: T.warmCream, borderBottom: `1px solid ${T.borderDef}` }}>
                {["Order Ref", "Deadline", "Saree Type / Design", "Progress", "Order Value", "Outstanding", "Status", "Payment", ""].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.taupe }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(o => {
                const m = custOrderMoney.get(o.ref)!;
                const pct = o.total ? Math.round((o.done / o.total) * 100) : 0;
                const meta = ORDER_STATUS_META[o.status] ?? ORDER_STATUS_META["on-track"];
                const pay = PAY_STATUS_META[o.paymentStatus ?? "pending"];
                return (
                  <tr key={o.ref} style={{ borderBottom: `1px solid ${T.borderDef}` }}>
                    <td style={{ padding: "14px 16px", fontFamily: F.mono, fontSize: 13, color: T.royalBurgundy, fontWeight: 700 }}>
                      {o.ref}
                      {o.tallied && <div style={{ fontFamily: F.ui, fontSize: 10.5, color: T.green, marginTop: 3 }}>✓ Tallied</div>}
                    </td>
                    <td style={{ padding: "14px 16px", fontFamily: F.ui, fontSize: 13.5, color: T.taupe }}>{o.due}</td>
                    <td style={{ padding: "14px 16px", fontFamily: F.ui, fontSize: 13.5, color: T.luxuryBrown }}>
                      {o.sareeType}
                      <div style={{ fontFamily: F.mono, fontSize: 11.5, color: T.taupe, marginTop: 2 }}>{o.design}</div>
                    </td>
                    <td style={{ padding: "14px 16px", minWidth: 130 }}>
                      <div style={{ fontFamily: F.mono, fontSize: 12.5, color: T.luxuryBrown, marginBottom: 5 }}>{o.done}/{o.total} · {pct}%</div>
                      <div style={{ height: 6, background: T.silkCream, borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: meta.color, borderRadius: 4 }} />
                      </div>
                      {(o.shortage ?? 0) > 0 && (
                        <div style={{ fontFamily: F.ui, fontSize: 10.5, color: T.crimson, marginTop: 4 }}>Shortage {o.shortage}</div>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px", fontFamily: F.display, fontSize: 14, fontWeight: 600, color: T.antiqueGold }}>{m.amountDue ? inr(m.amountDue) : "—"}</td>
                    <td style={{ padding: "14px 16px", fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: m.balance > 0 ? T.crimson : T.taupe }}>{m.balance > 0 ? inr(m.balance) : "—"}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ background: meta.bg, color: meta.color, padding: "3px 9px", borderRadius: 6, fontSize: 11.5, fontWeight: 700, whiteSpace: "nowrap" as const }}>{meta.label}</span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ background: pay.bg, color: pay.color, padding: "3px 9px", borderRadius: 6, fontSize: 11.5, fontWeight: 700 }}>{pay.label}</span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: 8, whiteSpace: "nowrap" as const }}>
                        <button onClick={() => onViewBulkOrder(o, "overview")}
                          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", background: "rgba(110,15,45,0.05)", border: `1px solid rgba(110,15,45,0.18)`, borderRadius: 8, fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.royalBurgundy, cursor: "pointer" }}>
                          <Eye size={13} /> View Order
                        </button>
                        <button onClick={() => onViewBulkOrder(o, "sarees")}
                          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", background: "transparent", border: `1px solid ${T.borderDef}`, borderRadius: 8, fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.taupe, cursor: "pointer" }}>
                          <ShoppingBag size={13} /> Sarees
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
