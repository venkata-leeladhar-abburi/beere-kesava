import React, { useState } from "react";
import { CalendarClock, Receipt, X } from "lucide-react";
import { motion } from "motion/react";

import { EASE, F, T, BulkOrder, useFirms } from "../../theme";
import { Invoice } from "../../types";

// ── Record Payment Modal ──────────────────────────────────────────────────────
export function RecordPaymentModal({ inv, onClose, onSave }: { inv: Invoice; onClose: () => void; onSave: (amount: number, firmId: string, utr: string, date: string, method: string) => void }) {
  const { firms } = useFirms();
  const remaining = inv.total - inv.paid;
  const [amount, setAmount] = useState(String(remaining));
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [utr, setUtr] = useState("");
  const [method, setMethod] = useState("Bank Transfer");
  const [firmId, setFirmId] = useState(firms[0]?.id ?? "");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const inputStyle: React.CSSProperties = { width: "100%", height: 42, padding: "0 12px", border: `1.5px solid ${T.borderDef}`, borderRadius: 9, fontFamily: F.ui, fontSize: 13.5, color: T.luxuryBrown, background: "#fff", outline: "none", boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = { fontFamily: F.ui, fontWeight: 600, fontSize: 12.5, color: T.taupe, marginBottom: 6, display: "block" };

  const handleSave = () => {
    if (!amount || !utr || !firmId) return;
    setSaving(true);
    setTimeout(() => {
      onSave(parseFloat(amount), firmId, utr, date, method);
      setSaving(false);
    }, 500);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(30,10,20,0.55)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(4px)" }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ duration: 0.22, ease: EASE }} onClick={e => e.stopPropagation()}
        style={{ background: T.warmIvory, borderRadius: 20, width: 480, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(44,6,27,0.28)", border: `1px solid ${T.borderDef}` }}
      >
        <div style={{ background: `linear-gradient(120deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, padding: "24px 28px", position: "relative" }}>
          <div style={{ fontFamily: F.display, fontSize: 19, fontWeight: 700, color: "#FFFDF9" }}>Record Payment — {inv.customer}</div>
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.12)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.85)" }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: "24px 28px 8px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#FFFFFF", borderRadius: 10, border: `1px solid ${T.borderDef}`, padding: "12px 16px", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, fontWeight: 700 }}>{inv.id}</span>
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Invoice Reference</span>
          </div>

          <div style={{ background: "rgba(200,155,71,0.10)", border: `1px solid ${T.borderGold}`, borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4 }}>Outstanding Balance</div>
            <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 700, color: T.antiqueGold }}>₹{remaining.toLocaleString("en-IN")}</div>
          </div>

          {/* Previous Payments */}
          <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: "18px 20px", boxShadow: "0 2px 10px rgba(74,6,27,0.02)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13.5, color: T.luxuryBrown, display: "flex", alignItems: "center", gap: 8 }}>
                <Receipt size={16} color={T.royalBurgundy} /> Previous Payments
              </div>
              <span style={{ fontSize: 11, fontFamily: F.ui, color: T.taupe, fontWeight: 600 }}>
                {inv.payments?.length || 0} transaction{inv.payments?.length !== 1 ? "s" : ""}
              </span>
            </div>

            {(!inv.payments || inv.payments.length === 0) ? (
              <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe, fontStyle: "italic", textAlign: "center", padding: "16px 0", background: T.silkCream, borderRadius: 10 }}>
                No previous payments recorded.
              </div>
            ) : (
              <div className="section-nav-scroll" style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 180, overflowY: "auto", paddingRight: 4 }}>
                {inv.payments.map((p, idx) => (
                  <div key={idx} style={{
                    display: "flex", flexDirection: "column", gap: 8,
                    padding: "12px 14px", background: T.warmIvory,
                    borderRadius: 10, border: "1px solid rgba(110,15,45,0.06)",
                    borderLeft: `4px solid ${T.antiqueGold}`,
                    boxShadow: "0 2px 6px rgba(74,6,27,0.01)"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 15, color: T.royalBurgundy }}>
                          ₹{p.amount.toLocaleString("en-IN")}
                        </div>
                        <div style={{ fontFamily: F.mono, fontSize: 10.5, color: T.taupe, marginTop: 3 }}>
                          {p.utr} · {p.method}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                        <span style={{ fontSize: 9.5, fontFamily: F.mono, fontWeight: 700, background: "rgba(200,155,71,0.11)", color: T.antiqueGold, padding: "2px 6px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          {p.firmName ?? "Beere Kesava & Brothers Silks"}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: F.ui, fontSize: 11, color: T.taupe }}>
                          <CalendarClock size={11} /> {p.date}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label style={labelStyle} htmlFor="amount-received">Amount Received (₹) *</label>
            <input id="amount-received" type="number" value={amount} onChange={e => setAmount(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle} htmlFor="payment-date">Payment Date *</label>
            <input id="payment-date" type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle} htmlFor="utr-number">UTR Number *</label>
            <input id="utr-number" value={utr} onChange={e => setUtr(e.target.value)} placeholder="e.g. UTR2026042812345" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle} htmlFor="payment-method">Payment Method</label>
            <select id="payment-method" value={method} onChange={e => setMethod(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
              {["Bank Transfer", "Cheque", "Cash"].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle} htmlFor="firm-receiving-payment">Firm Receiving Payment *</label>
            <select id="firm-receiving-payment" value={firmId} onChange={e => setFirmId(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
              {firms.map(f => <option key={f.id} value={f.id}>{f.firmName}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle} htmlFor="notes-optional">Notes (optional)</label>
            <textarea id="notes-optional" value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ ...inputStyle, height: "auto", padding: "10px 12px", resize: "vertical" as const }} />
          </div>
        </div>

        <div style={{ padding: "18px 28px 24px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ height: 42, padding: "0 20px", background: "transparent", border: `1px solid ${T.borderDef}`, borderRadius: 999, fontFamily: F.ui, fontSize: 13, color: T.taupe, cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ height: 42, padding: "0 24px", background: T.royalBurgundy, border: "none", borderRadius: 999, fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: "#FFF", cursor: "pointer" }}>
            {saving ? "Saving..." : "Save Payment"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
