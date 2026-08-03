import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin, Phone, Building2, FileText,
  IndianRupee, AlertTriangle, ArrowLeft, Package, Star,
} from "lucide-react";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";
import { T, F } from "./theme";
import { Vendor } from "./types";
import { PAYMENT_TERMS, STATES, PAY_MODE_FILL, BILL_STATUS_CFG, buildVendorLedger } from "./data";
import { StatusPill, StarRating } from "./SharedBits";
import { PurchaseOrderHistoryTable } from "./PurchaseOrderHistoryTable";
import { FadeUp } from "./FadeUp";

export function VendorProfile({ vendor, onBack, onUpdate }: { vendor: Vendor; onBack: () => void; onUpdate?: (v: Vendor) => void }) {
  const [tab, setTab] = useState<"overview" | "orders" | "payments" | "contact" | "edit">("overview");
  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "orders", label: "Order History" },
    { key: "payments", label: "Payment History" },
    { key: "contact", label: "Contact Details" },
    { key: "edit", label: "Edit Profile" },
  ] as const;
  const [orderDateFilter, setOrderDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [payFilter, setPayFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);

  const ledger = React.useMemo(() => buildVendorLedger(vendor), [vendor]);
  const filteredBills = React.useMemo(
    () => ledger.bills.filter(b => matchesDateFilter(b.date, payFilter)),
    [ledger.bills, payFilter]
  );
  const filteredTxns = React.useMemo(
    () => ledger.txns.filter(t => matchesDateFilter(t.date, payFilter)),
    [ledger.txns, payFilter]
  );
  const paidInRange = filteredTxns.reduce((a, t) => a + t.amount, 0);
  const overdueBills = ledger.bills.filter(b => b.status === "Overdue");
  const modeSplit = React.useMemo(() => {
    const m = new Map<string, number>();
    filteredTxns.forEach(t => m.set(t.mode, (m.get(t.mode) || 0) + t.amount));
    return [...m.entries()].map(([mode, amount]) => ({ mode, amount })).sort((a, b) => b.amount - a.amount);
  }, [filteredTxns]);
  const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

  const [form, setForm] = useState(vendor);
  const set = (k: keyof Vendor, v: string) => setForm(p => ({ ...p, [k]: v }));

  React.useEffect(() => { setForm(vendor); }, [vendor]);

  const inp: React.CSSProperties = {
    width: "100%", padding: "10px 12px", borderRadius: 6,
    border: `1px solid rgba(110,15,45,0.12)`, fontFamily: F.ui,
    fontSize: 14, color: T.luxuryBrown, background: "#FFF",
    outline: "none", boxSizing: "border-box" as const,
  };
  const lbl: React.CSSProperties = {
    fontFamily: F.ui, fontSize: 12, fontWeight: 600,
    color: T.luxuryBrown, display: "block", marginBottom: 6,
  };

  const mockOrders = ledger.orders;
  return (
    <div style={{ padding: "40px 56px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <motion.button onClick={onBack} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} style={{ background: "transparent", border: `1px solid ${T.borderDef}`, padding: "10px 20px", borderRadius: 8, color: T.royalBurgundy, fontFamily: F.ui, fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <ArrowLeft size={14} /> Back to Vendors
        </motion.button>
        <div style={{ display: "flex", gap: 10 }}>
          <StatusPill status={vendor.status} />
          <span style={{ fontFamily: F.mono, fontSize: 13, background: T.silkCream, border: `1px solid ${T.borderDef}`, padding: "5px 12px", borderRadius: 6, color: T.luxuryBrown, fontWeight: 600 }}>{vendor.id}</span>
        </div>
      </div>

      <FadeUp>
        <div style={{ background: `linear-gradient(135deg,${T.darkBurgundy},#1A040B)`, borderRadius: 20, border: "1.5px solid rgba(200,155,71,0.25)", padding: 32, color: "#FFF", marginBottom: 8, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: `linear-gradient(135deg,${T.antiqueGold},${T.goldLight})`, color: T.darkBurgundy, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: 22, fontWeight: 800, flexShrink: 0, boxShadow: "0 6px 20px rgba(200,155,71,0.35)" }}>{vendor.initials}</div>
            <div>
              <h2 style={{ fontFamily: F.display, fontSize: 28, fontWeight: 700, margin: "0 0 6px" }}>{vendor.name}</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,255,255,0.65)", display: "flex", alignItems: "center", gap: 6 }}><MapPin size={13} color={T.antiqueGold} />{vendor.city}, {vendor.state}</span>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,255,255,0.65)", display: "flex", alignItems: "center", gap: 6 }}><Package size={13} color={T.antiqueGold} />{vendor.type}</span>
                <StarRating rating={vendor.rating} />
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 48, alignItems: "center" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: F.ui, fontSize: 11, color: "rgba(255,255,255,0.55)", marginBottom: 4 }}>TOTAL SPEND</div>
              <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: T.goldLight }}>₹{vendor.totalSpend}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: F.ui, fontSize: 11, color: "rgba(255,255,255,0.55)", marginBottom: 4 }}>OUTSTANDING</div>
              <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: vendor.outstanding !== "0" ? "#F87171" : T.goldLight }}>{vendor.outstanding === "0" ? "₹0" : `₹${vendor.outstanding}`}</div>
            </div>
          </div>
        </div>
      </FadeUp>

      <div style={{ display: "flex", gap: 0, borderBottom: `2px solid ${T.borderDef}`, marginBottom: 28 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding: "14px 22px", fontFamily: F.ui, fontSize: 14, fontWeight: tab === t.key ? 700 : 400, color: tab === t.key ? T.royalBurgundy : T.taupe, background: "transparent", border: "none", borderBottom: tab === t.key ? `2px solid ${T.royalBurgundy}` : "2px solid transparent", marginBottom: -2, cursor: "pointer", transition: "all 0.2s" }}>
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
          {tab === "overview" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
                {[
                  { label: "Total Orders Ever", value: String(vendor.totalOrders), mono: false },
                  { label: "Total Spend", value: `₹${vendor.totalSpend}`, color: T.royalBurgundy },
                  { label: "Outstanding Balance", value: vendor.outstanding === "0" ? "₹0" : `₹${vendor.outstanding}`, color: vendor.outstanding !== "0" ? T.crimson : T.green },
                  { label: "Payment Terms", value: vendor.terms, mono: true },
                ].map(s => (
                  <div key={s.label} style={{ background: "#FFF", borderRadius: 14, border: `1.5px solid ${T.borderDef}`, padding: "20px 22px" }}>
                    <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginBottom: 8 }}>{s.label}</div>
                    <div style={{ fontFamily: s.mono ? F.mono : F.display, fontSize: s.mono ? 20 : 26, fontWeight: 700, color: (s as any).color || T.luxuryBrown }}>{s.value}</div>
                  </div>
                ))}
              </div>
              {vendor.notes && (
                <div style={{ background: "#FFF", borderRadius: 14, border: `1.5px solid ${T.borderDef}`, padding: "22px 26px", marginBottom: 16 }}>
                  <div style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", color: T.taupe, marginBottom: 10 }}>NOTES</div>
                  <p style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, lineHeight: 1.65, margin: 0 }}>{vendor.notes}</p>
                </div>
              )}
              <div style={{ background: "#FFF", borderRadius: 14, border: `1.5px solid ${T.borderDef}`, overflow: "hidden" }}>
                <div style={{ padding: "18px 22px", borderBottom: `1px solid ${T.borderDef}` }}>
                  <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, color: T.luxuryBrown }}>Recent Purchase Orders</div>
                </div>
                <PurchaseOrderHistoryTable orders={mockOrders.slice(0, 2)} />
              </div>
            </div>
          )}
          {tab === "orders" && (
            <div style={{ background: "#FFF", borderRadius: 14, border: `1.5px solid ${T.borderDef}`, overflow: "hidden" }}>
              <div style={{ padding: "18px 22px", borderBottom: `1px solid ${T.borderDef}` }}>
                <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, color: T.luxuryBrown, marginBottom: 12 }}>Full Purchase Order History</div>
                <DateFilterBar filter={orderDateFilter} onChange={setOrderDateFilter} />
              </div>
              <PurchaseOrderHistoryTable orders={mockOrders.filter(o => matchesDateFilter(o.date, orderDateFilter))} />
            </div>
          )}
          {tab === "payments" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Money summary */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
                {[
                  { label: "Paid in Range", value: inr(paidInRange), color: T.greenMid, sub: `${filteredTxns.length} transaction${filteredTxns.length === 1 ? "" : "s"}` },
                  { label: "Paid All Time", value: inr(ledger.totalPaid), color: T.luxuryBrown, sub: `of ${inr(ledger.totalBilled)} billed` },
                  { label: "Outstanding", value: inr(ledger.outstanding), color: ledger.outstanding > 0 ? T.crimson : T.green, sub: ledger.outstanding > 0 ? "Awaiting settlement" : "Fully settled" },
                  { label: "Overdue Bills", value: String(overdueBills.length), color: overdueBills.length ? T.crimson : T.green, sub: `Terms ${vendor.terms}` },
                ].map(s => (
                  <div key={s.label} style={{ background: "#FFF", borderRadius: 14, border: `1.5px solid ${T.borderDef}`, padding: "18px 20px" }}>
                    <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginBottom: 8 }}>{s.label}</div>
                    <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 6 }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Settlement progress */}
              <div style={{ background: "#FFF", borderRadius: 14, border: `1.5px solid ${T.borderDef}`, padding: "20px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontFamily: F.display, fontSize: 15, fontWeight: 600, color: T.luxuryBrown }}>Settlement Progress</div>
                  <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>
                    {ledger.totalBilled ? Math.round((ledger.totalPaid / ledger.totalBilled) * 100) : 0}% cleared
                  </div>
                </div>
                <div style={{ height: 10, borderRadius: 5, background: T.silkCream, overflow: "hidden", border: `1px solid ${T.borderDef}` }}>
                  <div style={{ width: `${ledger.totalBilled ? (ledger.totalPaid / ledger.totalBilled) * 100 : 0}%`, height: "100%", background: `linear-gradient(90deg,${T.deepWine},${T.royalBurgundy})` }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: F.ui, fontSize: 11.5, color: T.taupe, marginTop: 8 }}>
                  <span>Paid {inr(ledger.totalPaid)}</span>
                  <span>Billed {inr(ledger.totalBilled)}</span>
                </div>
                {modeSplit.length > 0 && (
                  <div style={{ display: "flex", gap: 8, marginTop: 16, borderTop: `1px solid ${T.borderDef}`, paddingTop: 14, flexWrap: "wrap" as const }}>
                    {modeSplit.map(m => (
                      <div key={m.mode} style={{ display: "flex", alignItems: "center", gap: 8, background: T.silkCream, border: `1px solid ${T.borderDef}`, borderRadius: 20, padding: "6px 14px" }}>
                        <div style={{ width: 9, height: 9, borderRadius: 3, background: PAY_MODE_FILL[m.mode] ?? T.taupe }} />
                        <span style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe }}>{m.mode}</span>
                        <span style={{ fontFamily: F.mono, fontSize: 11.5, fontWeight: 700, color: T.luxuryBrown }}>{inr(m.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Date scope for both tables below */}
              <div style={{ background: "#FFF", borderRadius: 14, border: `1.5px solid ${T.borderDef}`, padding: "16px 22px 2px" }}>
                <DateFilterBar filter={payFilter} onChange={setPayFilter} />
              </div>

              {/* Bill-wise settlement */}
              <div style={{ background: "#FFF", borderRadius: 14, border: `1.5px solid ${T.borderDef}`, overflow: "hidden" }}>
                <div style={{ padding: "18px 22px", borderBottom: `1px solid ${T.borderDef}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, color: T.luxuryBrown }}>Invoice-wise Settlement</div>
                  <span style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe }}>Due dates from payment terms · {vendor.terms}</span>
                </div>
                {filteredBills.length === 0 ? (
                  <div style={{ padding: "40px 24px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13.5, color: T.taupe }}>No bills raised in this period.</div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: T.silkCream }}>
                        {["PO / Invoice", "Bill Date", "Due Date", "Invoice Amount", "Paid", "Balance", "Status"].map(h => (
                          <th key={h} style={{ padding: "12px 16px", fontFamily: F.mono, fontSize: 10, fontWeight: 700, color: T.taupe, textAlign: "left", letterSpacing: "0.8px" }}>{h.toUpperCase()}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBills.map((b, i) => {
                        const cfg = BILL_STATUS_CFG[b.status];
                        return (
                          <tr key={b.id} style={{ borderTop: `1px solid ${T.borderDef}`, background: i % 2 === 0 ? "#FFF" : "rgba(247,242,234,0.4)" }}>
                            <td style={{ padding: "13px 16px" }}>
                              <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{b.id}</div>
                              <div style={{ fontFamily: F.mono, fontSize: 10.5, color: T.taupe, marginTop: 3 }}>{b.invoiceNo}</div>
                            </td>
                            <td style={{ padding: "13px 16px", fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>{b.date}</td>
                            <td style={{ padding: "13px 16px", fontFamily: F.ui, fontSize: 12.5, color: b.daysOverdue > 0 ? T.crimson : T.taupe, fontWeight: b.daysOverdue > 0 ? 700 : 400 }}>
                              {b.dueDate}
                              {b.daysOverdue > 0 && <div style={{ fontFamily: F.ui, fontSize: 10.5, color: T.crimson }}>{b.daysOverdue}d overdue</div>}
                            </td>
                            <td style={{ padding: "13px 16px", fontFamily: F.mono, fontSize: 12.5, fontWeight: 700, color: "#8B6018" }}>{inr(b.amount)}</td>
                            <td style={{ padding: "13px 16px", fontFamily: F.mono, fontSize: 12.5, fontWeight: 600, color: T.greenMid }}>{inr(b.paid)}</td>
                            <td style={{ padding: "13px 16px", fontFamily: F.mono, fontSize: 12.5, fontWeight: 700, color: b.balance > 0 ? T.crimson : T.taupe }}>{b.balance > 0 ? inr(b.balance) : "—"}</td>
                            <td style={{ padding: "13px 16px" }}>
                              <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, padding: "4px 11px", borderRadius: 20, background: cfg.bg, color: cfg.color, whiteSpace: "nowrap" as const }}>{b.status}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Payment transactions */}
              <div style={{ background: "#FFF", borderRadius: 14, border: `1.5px solid ${T.borderDef}`, overflow: "hidden" }}>
                <div style={{ padding: "18px 22px", borderBottom: `1px solid ${T.borderDef}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, color: T.luxuryBrown }}>Payments Made</div>
                  <span style={{ fontFamily: F.mono, fontSize: 12.5, fontWeight: 700, color: T.greenMid }}>{inr(paidInRange)}</span>
                </div>
                {filteredTxns.length === 0 ? (
                  <div style={{ padding: "40px 24px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13.5, color: T.taupe }}>No payments in this period.</div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: T.silkCream }}>
                        {["Payment Ref", "Date", "Against PO", "Mode", "UTR / Reference", "Paying Firm", "Amount"].map(h => (
                          <th key={h} style={{ padding: "12px 16px", fontFamily: F.mono, fontSize: 10, fontWeight: 700, color: T.taupe, textAlign: "left", letterSpacing: "0.8px" }}>{h.toUpperCase()}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTxns.map((p, i) => (
                        <tr key={p.id} style={{ borderTop: `1px solid ${T.borderDef}`, background: i % 2 === 0 ? "#FFF" : "rgba(247,242,234,0.4)" }}>
                          <td style={{ padding: "13px 16px", fontFamily: F.mono, fontSize: 11.5, fontWeight: 700, color: T.royalBurgundy }}>{p.id}</td>
                          <td style={{ padding: "13px 16px", fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>{p.date}</td>
                          <td style={{ padding: "13px 16px", fontFamily: F.mono, fontSize: 11.5, color: T.luxuryBrown }}>{p.billId}</td>
                          <td style={{ padding: "13px 16px" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>
                              <span style={{ width: 9, height: 9, borderRadius: 3, background: PAY_MODE_FILL[p.mode] ?? T.taupe }} />{p.mode}
                            </span>
                          </td>
                          <td style={{ padding: "13px 16px", fontFamily: F.mono, fontSize: 11, color: T.taupe }}>{p.reference}</td>
                          <td style={{ padding: "13px 16px", fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{p.firm}</td>
                          <td style={{ padding: "13px 16px", fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.greenMid }}>{inr(p.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Overdue callout */}
              {overdueBills.length > 0 && (
                <div style={{ background: T.crimsonBg, border: `1px solid rgba(192,57,43,0.20)`, borderRadius: 14, padding: "18px 22px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <AlertTriangle size={16} color={T.crimson} />
                    <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.crimson }}>
                      {overdueBills.length} bill{overdueBills.length > 1 ? "s" : ""} past the agreed {vendor.terms} terms
                    </span>
                  </div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, lineHeight: 1.6 }}>
                    {overdueBills.map(b => `${b.id} — ${inr(b.balance)} (${b.daysOverdue}d)`).join(" · ")}
                  </div>
                </div>
              )}
            </div>
          )}
          {tab === "contact" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { label: "Contact Person", value: vendor.contactName, Icon: Building2 },
                { label: "Phone", value: vendor.phone, Icon: Phone },
                { label: "WhatsApp", value: vendor.whatsapp || "—", Icon: Phone },
                { label: "GST Number", value: vendor.gstCode || "—", Icon: FileText },
                { label: "Bank Name", value: vendor.bankName || "—", Icon: IndianRupee },
                { label: "Account Number", value: vendor.accountNo || "—", Icon: IndianRupee },
              ].map(f => (
                <div key={f.label} style={{ background: "#FFF", borderRadius: 14, border: `1.5px solid ${T.borderDef}`, padding: "20px 22px" }}>
                  <div style={{ fontFamily: F.mono, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1.2px", color: T.taupe, marginBottom: 8 }}>{f.label}</div>
                  <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown, display: "flex", alignItems: "center", gap: 8 }}><f.Icon size={14} color={T.royalBurgundy} /> {f.value}</div>
                </div>
              ))}
              <div style={{ gridColumn: "1 / -1", background: "#FFF", borderRadius: 14, border: `1.5px solid ${T.borderDef}`, padding: "20px 22px" }}>
                <div style={{ fontFamily: F.mono, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1.2px", color: T.taupe, marginBottom: 8 }}>Address</div>
                <div style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, lineHeight: 1.65 }}>{vendor.address || "—"}</div>
              </div>
              {vendor.notes && (
                <div style={{ gridColumn: "1 / -1", background: "#FFF", borderRadius: 14, border: `1.5px solid ${T.borderDef}`, padding: "20px 22px" }}>
                  <div style={{ fontFamily: F.mono, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1.2px", color: T.taupe, marginBottom: 8 }}>Notes</div>
                  <div style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, lineHeight: 1.65 }}>{vendor.notes}</div>
                </div>
              )}
            </div>
          )}
          {tab === "edit" && (
            <div style={{ background: "#FFF", borderRadius: 14, border: `1.5px solid ${T.borderDef}`, padding: "28px 32px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 600, color: T.luxuryBrown }}>Edit Profile</div>
                <button onClick={() => onUpdate?.(form)} style={{ padding: "8px 16px", background: T.royalBurgundy, color: "#FFF", fontFamily: F.ui, fontSize: 13, fontWeight: 600, borderRadius: 8, cursor: "pointer", border: "none" }}>Save Changes</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={lbl}>Business Name *</label>
                    <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Name of the business or shop" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Owner / Contact Name *</label>
                    <input value={form.contactName} onChange={e => set("contactName", e.target.value)} placeholder="Who to speak to at this business" style={inp} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={lbl}>Phone Number *</label>
                      <input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="Main contact number" style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>WhatsApp Number</label>
                      <input value={form.whatsapp || ""} onChange={e => set("whatsapp", e.target.value)} placeholder="If different" style={inp} />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={lbl}>City *</label>
                      <input value={form.city} onChange={e => set("city", e.target.value)} placeholder="City" style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>State *</label>
                      <select value={form.state} onChange={e => set("state", e.target.value)} style={{ ...inp, cursor: "pointer", backgroundColor: "#FFF" }}>
                        {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={lbl}>Material Types</label>
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", padding: "10px 0" }}>
                        {["Warp", "Resham", "Jari"].map(t => {
                          const typesArr = form.type ? form.type.split(" / ").map(s => s.trim()).filter(Boolean) : [];
                          return (
                            <label key={t} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>
                              <input type="checkbox" checked={typesArr.includes(t)} onChange={e => {
                                const newTypes = e.target.checked ? [...typesArr, t] : typesArr.filter(x => x !== t);
                                set("type", newTypes.join(" / "));
                              }} style={{ accentColor: T.royalBurgundy, width: 15, height: 15 }} />
                              {t}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label style={lbl}>Payment Terms *</label>
                      <select value={form.terms} onChange={e => set("terms", e.target.value)} style={{ ...inp, cursor: "pointer", backgroundColor: "#FFF", marginBottom: 16 }}>
                        {PAYMENT_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <label style={lbl}>Vendor Rating</label>
                      <div style={{ display: "flex", gap: 6, cursor: "pointer", marginTop: 8 }}>
                        {[1, 2, 3, 4, 5].map(i => {
                          const ratingVal = (form as any).rating || 3;
                          return (
                            <div key={i} onClick={() => set("rating", i as any)}>
                              <Star size={20} fill={i <= ratingVal ? T.antiqueGold : "none"} color={i <= ratingVal ? T.antiqueGold : T.taupe} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={lbl}>Business Address</label>
                    <textarea value={form.address} onChange={e => set("address", e.target.value)} placeholder="Full address for delivery and billing" rows={3} style={{ ...inp, resize: "none", lineHeight: 1.5 }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={lbl}>Bank Name</label>
                      <input value={form.bankName || ""} onChange={e => set("bankName", e.target.value)} placeholder="For any refunds" style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Account Number</label>
                      <input value={form.accountNo || ""} onChange={e => set("accountNo", e.target.value)} placeholder="Account No." style={inp} />
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>GST Number</label>
                    <input value={form.gstCode} onChange={e => set("gstCode", e.target.value)} placeholder="15-digit GSTIN (e.g. 36AAAAA1111A1Z1)" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Notes</label>
                    <textarea value={form.notes || ""} onChange={e => set("notes", e.target.value)} placeholder="Any special instructions or supplier notes..." rows={3} style={{ ...inp, resize: "none", lineHeight: 1.5 }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
