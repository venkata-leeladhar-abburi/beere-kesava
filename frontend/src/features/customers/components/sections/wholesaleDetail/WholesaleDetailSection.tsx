import React from "react";
import { MapPin } from "lucide-react";
import { useBulkOrders, BulkOrder } from "../../../../bulk-orders/contexts/BulkOrderContext";
import { DateFilterBar, DateFilterState, matchesDateFilter } from "../../../../../shared/ui/DateFilterBar";
import { resolveOrderMoney } from "../../../../bulk-orders/utils/BulkOrderLinking";
import { INVOICES } from "../../../../payments/data/invoices";
import { T, F } from "../../theme";
import { WholesaleCustomer, WholesaleTab } from "../../types";
import { OrderHistoryTab } from "./OrderHistoryTab";

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

export interface WholesaleDetailSectionProps {
  customer: WholesaleCustomer;
  wholesaleTab: WholesaleTab;
  setWholesaleTab: (t: WholesaleTab) => void;
  onBack: () => void;
  onSave: (updated: WholesaleCustomer) => void;
  onViewBulkOrder: (order: BulkOrder, tab: "overview" | "sarees" | "payments" | "quotations") => void;
  onViewCard: (url: string) => void;
  wholesaleOrderDateFilter: DateFilterState;
  setWholesaleOrderDateFilter: (f: DateFilterState) => void;
  wholesalePaymentDateFilter: DateFilterState;
  setWholesalePaymentDateFilter: (f: DateFilterState) => void;
}

export function WholesaleDetailSection({
  customer, wholesaleTab, setWholesaleTab, onBack, onSave, onViewBulkOrder, onViewCard,
  wholesaleOrderDateFilter, setWholesaleOrderDateFilter, wholesalePaymentDateFilter, setWholesalePaymentDateFilter,
}: WholesaleDetailSectionProps) {
  const { bulkOrders } = useBulkOrders();

  // ── Bulk orders belonging to the open wholesale customer ───────────────────
  // Matched on customerId where the order carries one, else on business name.
  const custOrders = React.useMemo(() => {
    return bulkOrders.filter(o =>
      (o.customerId && o.customerId === customer.id) ||
      o.customer.toLowerCase() === String(customer.name).toLowerCase()
    );
  }, [bulkOrders, customer]);

  const custOrderMoney = React.useMemo(
    () => new Map(custOrders.map(o => [o.ref, resolveOrderMoney(o, INVOICES)])),
    [custOrders]
  );
  const custBilled = custOrders.reduce((a, o) => a + (custOrderMoney.get(o.ref)?.amountDue ?? 0), 0);
  const custPaid = custOrders.reduce((a, o) => a + (custOrderMoney.get(o.ref)?.amountPaid ?? 0), 0);
  const custOutstanding = Math.max(0, custBilled - custPaid);
  const custSareesOrdered = custOrders.reduce((a, o) => a + o.total, 0);
  const custSareesDone = custOrders.reduce((a, o) => a + o.done, 0);
  const custActiveOrders = custOrders.filter(o => o.done < o.total);

  return (
    <div style={{ padding: "48px 56px" }}>
      {/* Header row with Back button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <button
          onClick={onBack}
          style={{ background: "transparent", border: `1px solid ${T.borderDef}`, padding: "10px 20px", borderRadius: 8, color: T.royalBurgundy, fontFamily: F.ui, fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
        >
          ← Back to Customers
        </button>
        <div style={{ display: "flex", gap: 12 }}>
          <span style={{ fontFamily: F.ui, fontSize: 13, background: customer.status === "clear" ? T.greenBg : T.crimsonBg, color: customer.status === "clear" ? T.greenMid : T.crimson, padding: "5px 12px", borderRadius: 6, fontWeight: 700 }}>
            {customer.status.toUpperCase()}
          </span>
          <span style={{ fontFamily: F.mono, fontSize: 13, background: T.silkCream, border: `1px solid ${T.borderDef}`, padding: "5px 12px", borderRadius: 6, color: T.luxuryBrown, fontWeight: 600 }}>
            {customer.id}
          </span>
        </div>
      </div>

      {/* Profile Header Card */}
      <div style={{ background: `linear-gradient(135deg, ${T.darkBurgundy}, #1A040B)`, borderRadius: 20, border: "1.5px solid rgba(200,155,71,0.25)", padding: 32, color: "#FFF", marginBottom: 32, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg, ${T.antiqueGold}, ${T.goldLight})`, color: T.darkBurgundy, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: 22, fontWeight: 700 }}>
              {customer.code}
            </div>
            <div>
              <h2 style={{ fontFamily: F.display, fontSize: 26, fontWeight: 700, margin: 0 }}>{customer.name}</h2>
              <div style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                <MapPin size={14} color={T.antiqueGold} /> {customer.city}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Total Spend</div>
            <div style={{ fontFamily: F.display, fontSize: 28, fontWeight: 700, color: T.goldLight, marginTop: 4 }}>₹{customer.spend}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Outstanding</div>
            <div style={{ fontFamily: F.display, fontSize: 28, fontWeight: 700, color: customer.out === "0" ? T.greenMid : T.crimson, marginTop: 4 }}>₹{customer.out}</div>
          </div>
        </div>
      </div>

      {/* Sub-tab strip */}
      <div style={{ display: "flex", borderBottom: `1px solid ${T.borderDef}`, marginBottom: 32, gap: 8 }}>
        {(["Overview", "Order History", "Payment History", "Contact Details", "Edit Profile"] as WholesaleTab[]).map(tabName => {
          const isActive = wholesaleTab === tabName;
          return (
            <button
              key={tabName}
              onClick={() => setWholesaleTab(tabName)}
              style={{
                padding: "12px 24px",
                fontFamily: F.ui,
                fontSize: 14,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? T.royalBurgundy : T.taupe,
                border: "none",
                background: "none",
                borderBottom: isActive ? `3px solid ${T.royalBurgundy}` : "3px solid transparent",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {tabName}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div style={{ background: "#FFFFFF", borderRadius: 20, border: `1px solid ${T.borderDef}`, padding: 32, boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
        {wholesaleTab === "Overview" && (
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
                  <div style={{ fontFamily: s.isMono ? F.mono : F.display, fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
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
                      <div key={o.ref} style={{ cursor: "pointer" }} onClick={() => onViewBulkOrder(o, "overview")}>
                        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                            <span style={{ fontFamily: F.mono, fontSize: 17, color: T.goldLight, fontWeight: 700 }}>{o.ref}</span>
                            <span style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,255,255,0.65)" }}>{o.done} of {o.total} sarees · {o.sareeType}</span>
                            <span style={{ fontFamily: F.ui, fontSize: 10.5, fontWeight: 700, background: meta.bg, color: meta.color, padding: "2px 9px", borderRadius: 20 }}>{meta.label}</span>
                          </div>
                          <span style={{ fontFamily: F.ui, fontSize: 12.5, color: "rgba(255,255,255,0.55)" }}>Due {o.due}</span>
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
                    style={{ background: "transparent", border: "none", color: T.antiqueGold, fontFamily: F.ui, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
                    View Full Order History →
                  </button>
                )}
              </div>
              {custOrders.length === 0 ? (
                <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "36px 20px", textAlign: "center", fontFamily: F.ui, fontSize: 13.5, color: T.taupe }}>
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
                            <td style={{ padding: "12px 14px", fontFamily: F.mono, fontSize: 12.5, color: T.taupe }}>{o.invoiceId || m.invoiceId || "—"}</td>
                            <td style={{ padding: "12px 14px", fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{o.due}</td>
                            <td style={{ padding: "12px 14px", fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>{o.total}× {o.sareeType} · {o.design}</td>
                            <td style={{ padding: "12px 14px", fontFamily: F.display, fontSize: 14, color: T.luxuryBrown, fontWeight: 600 }}>{m.amountDue ? inr(m.amountDue) : "—"}</td>
                            <td style={{ padding: "12px 14px" }}>
                              <span style={{ padding: "2px 8px", borderRadius: 5, fontSize: 11, fontWeight: 700, background: pay.bg, color: pay.color }}>{pay.label}</span>
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
        )}

        {wholesaleTab === "Order History" && (
          <OrderHistoryTab
            custOrders={custOrders}
            custOrderMoney={custOrderMoney}
            wholesaleOrderDateFilter={wholesaleOrderDateFilter}
            setWholesaleOrderDateFilter={setWholesaleOrderDateFilter}
            onViewBulkOrder={onViewBulkOrder}
          />
        )}

        {wholesaleTab === "Payment History" && (
          <div>
            <h3 style={{ fontFamily: F.display, fontSize: 18, color: T.luxuryBrown, marginBottom: 16 }}>Ledger Payments Received</h3>
            <DateFilterBar filter={wholesalePaymentDateFilter} onChange={setWholesalePaymentDateFilter} />
            <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: T.warmCream, borderBottom: `1px solid ${T.borderDef}` }}>
                    {["Receipt No", "Payment Date", "UTR Number", "Amount Paid", "Deductions", "Status"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.taupe }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { rec: "REC-90821", date: "02 May 2026", utr: "UTR9832104523", amt: "₹1,80,000", ded: "₹0", status: "Settled" },
                    { rec: "REC-90145", date: "15 Apr 2026", utr: "UTR8293108420", amt: "₹2,60,000", ded: "₹20,000", status: "Settled" },
                    { rec: "REC-89234", date: "18 Dec 2025", utr: "UTR7489312048", amt: "₹1,00,000", ded: "₹5,000", status: "Settled" },
                  ].filter(p => matchesDateFilter(p.date, wholesalePaymentDateFilter)).map(p => (
                    <tr key={p.rec} style={{ borderBottom: `1px solid ${T.borderDef}` }}>
                      <td style={{ padding: "14px 16px", fontFamily: F.mono, fontSize: 13, color: T.royalBurgundy }}>{p.rec}</td>
                      <td style={{ padding: "14px 16px", fontFamily: F.ui, fontSize: 13.5, color: T.taupe }}>{p.date}</td>
                      <td style={{ padding: "14px 16px", fontFamily: F.mono, fontSize: 13, color: T.taupe }}>{p.utr}</td>
                      <td style={{ padding: "14px 16px", fontFamily: F.display, fontSize: 14, fontWeight: 700, color: T.green }}>{p.amt}</td>
                      <td style={{ padding: "14px 16px", fontFamily: F.display, fontSize: 14, color: T.crimson }}>{p.ded}</td>
                      <td style={{ padding: "14px 16px" }}><span style={{ background: T.greenBg, color: T.green, padding: "3px 8px", borderRadius: 6, fontSize: 11.5, fontWeight: 700 }}>{p.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {wholesaleTab === "Contact Details" && (
          <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", gap: 20 }}>
              <h3 style={{ fontFamily: F.display, fontSize: 18, color: T.luxuryBrown, margin: 0 }}>Business Contact Info</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Owner / Main Contact</div>
                  <div style={{ fontFamily: F.ui, fontSize: 14.5, fontWeight: 600, color: T.luxuryBrown, marginTop: 4 }}>Ramesh Rao</div>
                </div>
                <div>
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>GSTIN Registration</div>
                  <div style={{ fontFamily: F.mono, fontSize: 13.5, fontWeight: 600, color: T.royalBurgundy, marginTop: 4 }}>{customer.gstNumber || "Unregistered"}</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Phone Number</div>
                  <div style={{ fontFamily: F.mono, fontSize: 14, color: T.luxuryBrown, marginTop: 4 }}>+91 98480 12345</div>
                </div>
                <div>
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>WhatsApp Contact</div>
                  <div style={{ fontFamily: F.mono, fontSize: 14, color: T.luxuryBrown, marginTop: 4 }}>+91 98480 12345</div>
                </div>
              </div>
              <div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Billing Address</div>
                <div style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, marginTop: 4, lineHeight: 1.5 }}>
                  Shop No. 4, Silk Bazar, Main Road, {customer.city}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Bank Wire Account</div>
                <div style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, marginTop: 4 }}>
                  HDFC Bank · Account No. 4872 1938 8901 · IFSC: HDFC0001842
                </div>
                <span style={{ fontSize: 11, fontFamily: F.mono, color: T.taupe, marginTop: 6, display: "block" }}>🔒 Superadmin access encryption active</span>
              </div>
            </div>

            <div style={{ flex: "0 0 280px", display: "flex", flexDirection: "column", gap: 14 }}>
              <h3 style={{ fontFamily: F.display, fontSize: 18, color: T.luxuryBrown, margin: 0 }}>Visiting Card</h3>
              {customer.visitingCard ? (
                <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, overflow: "hidden", position: "relative", cursor: "pointer" }} onClick={() => onViewCard(customer.visitingCard!)}>
                  <img src={customer.visitingCard} alt="Visiting Card" style={{ width: "100%", height: 180, objectFit: "cover" }} />
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.5)", color: "#fff", fontFamily: F.ui, fontSize: 12, padding: "8px 12px", textAlign: "center", fontWeight: 600 }}>Click to Zoom Card</div>
                </div>
              ) : (
                <div style={{ border: `1.5px dashed ${T.borderDef}`, borderRadius: 12, height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: T.taupe, fontFamily: F.ui, fontSize: 13, fontStyle: "italic", background: T.silkCream }}>
                  No visiting card uploaded.
                </div>
              )}
            </div>
          </div>
        )}

        {wholesaleTab === "Edit Profile" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <h3 style={{ fontFamily: F.display, fontSize: 18, color: T.luxuryBrown, margin: 0 }}>Edit Customer Profile</h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 6 }}>Business Name</label>
                  <input type="text" defaultValue={customer.name} id="edit-biz-name" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.borderDef}`, fontFamily: F.ui, fontSize: 14 }} />
                </div>
                <div>
                  <label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 6 }}>Owner Name</label>
                  <input type="text" defaultValue="Ramesh Rao" id="edit-owner-name" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.borderDef}`, fontFamily: F.ui, fontSize: 14 }} />
                </div>
                <div>
                  <label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 6 }}>GST Number</label>
                  <input type="text" defaultValue={customer.gstNumber || ""} id="edit-gst-number" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.borderDef}`, fontFamily: F.mono, fontSize: 14 }} />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 6 }}>City</label>
                  <input type="text" defaultValue={customer.city} id="edit-city" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.borderDef}`, fontFamily: F.ui, fontSize: 14 }} />
                </div>
                <div>
                  <label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 6 }}>Credit Terms</label>
                  <select defaultValue={customer.terms} id="edit-terms" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.borderDef}`, fontFamily: F.ui, fontSize: 14, backgroundColor: "#FFF" }}>
                    <option>30 days</option>
                    <option>45 days</option>
                    <option>60 days</option>
                    <option>90 days</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 6 }}>Outstanding Amount (₹)</label>
                  <input type="text" defaultValue={customer.out} id="edit-out" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.borderDef}`, fontFamily: F.mono, fontSize: 14 }} />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.borderDef}` }}>
              <button onClick={() => setWholesaleTab("Overview")} style={{ padding: "10px 24px", background: "transparent", color: T.taupe, borderRadius: 8, border: "none", fontFamily: F.ui, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button
                onClick={() => {
                  const name = (document.getElementById("edit-biz-name") as HTMLInputElement)?.value;
                  const city = (document.getElementById("edit-city") as HTMLInputElement)?.value;
                  const gst = (document.getElementById("edit-gst-number") as HTMLInputElement)?.value;
                  const terms = (document.getElementById("edit-terms") as HTMLSelectElement)?.value;
                  const out = (document.getElementById("edit-out") as HTMLInputElement)?.value;

                  const updated = {
                    ...customer,
                    name, city, gstNumber: gst, terms, out,
                    status: out === "0" ? "clear" : customer.status
                  };

                  onSave(updated);
                  setWholesaleTab("Overview");
                }}
                style={{ padding: "10px 32px", background: T.royalBurgundy, color: "#FFF", borderRadius: 8, border: "none", fontFamily: F.ui, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              >
                ✓ Save Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
