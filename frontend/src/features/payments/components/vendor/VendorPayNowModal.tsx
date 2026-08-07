import React, { useRef, useState } from "react";
import { FileText, X } from "lucide-react";
import { motion } from "motion/react";

import { VENDOR_STATIC_PAYMENT_HISTORY } from "../../data/vendors";
import { EASE, F, T, useFirms } from "../../theme";
import { Invoice, VendorPayment } from "../../types";
import { vendorPaymentsApi } from "../../../../shared/api/payments";

export function VendorPayNowModal({ vp, onClose, onSave }: { vp: VendorPayment; onClose: () => void; onSave: (amount: number, firmId: string, utr: string) => void }) {
  const { firms } = useFirms();
  const balance = vp.invoiceAmt - vp.paidAmt;
  const history = VENDOR_STATIC_PAYMENT_HISTORY[vp.id] ?? [];
  const [amount, setAmount] = useState(String(balance));
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [utr, setUtr] = useState("");
  const [method, setMethod] = useState("Bank Transfer");
  const [firmId, setFirmId] = useState(firms[0]?.id ?? "");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const inputStyle: React.CSSProperties = { width: "100%", height: 42, padding: "0 12px", border: `1.5px solid ${T.borderDef}`, borderRadius: 9, fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, background: "#fff", outline: "none", boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = { fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.taupe, marginBottom: 6, display: "block" };

  const handleSave = async () => {
    const numericAmount = parseFloat(amount);
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) return;
    setSaving(true);
    setSaveError(null);
    const targetVendorId = vp.vendorId || vp.id;
    try {
      if (targetVendorId) {
        await vendorPaymentsApi.create({
          vendorId: targetVendorId,
          amount: numericAmount,
          utr: utr.trim() || undefined,
          method: method.trim() || undefined,
          firmId: firmId.trim() || undefined,
          date: date || undefined,
        });
      }
      onSave(numericAmount, firmId, utr);
    } catch (err) {
      console.error("Failed to record vendor payment:", err);
      setSaveError(err instanceof Error ? err.message : "Failed to record payment. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(30,10,20,0.55)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(4px)" }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ duration: 0.22, ease: EASE }} onClick={e => e.stopPropagation()}
        style={{ background: T.warmIvory, borderRadius: 20, width: 840, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(44,6,27,0.28)", border: `1px solid ${T.borderDef}`, display: "flex", flexDirection: "column" }}
      >
        <div style={{ background: `linear-gradient(120deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, padding: "24px 28px", position: "relative", flexShrink: 0 }}>
          <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: "#FFFDF9" }}>Pay Vendor — {vp.vendor}</div>
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.12)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.85)" }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: "24px 28px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "start" }}>
          {/* Left Column: Payment History & Invoice Upload */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown, marginBottom: 8 }}>Payment History</div>
              {history.length === 0 ? (
                <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, padding: "16px", fontFamily: F.ui, fontSize: 13, color: T.taupe, textAlign: "center" }}>No payments recorded yet.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {history.map((h, i) => (
                    <div key={i} style={{ background: "#FFFFFF", borderRadius: 10, border: `1px solid ${T.borderDef}`, padding: "12px 14px", display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr", gap: "8px 10px" }}>
                      <div><div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, textTransform: "uppercase" }}>Amount</div><div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: T.green }}>₹{h.amount.toLocaleString("en-IN")}</div></div>
                      <div><div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, textTransform: "uppercase" }}>Date</div><div style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{h.date}</div></div>
                      <div><div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, textTransform: "uppercase" }}>Paying Firm</div><div style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{h.firm}</div></div>
                      <div style={{ gridColumn: "1 / 3" }}><div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, textTransform: "uppercase" }}>UTR</div><div style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown }}>{h.utr}</div></div>
                      <div><div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, textTransform: "uppercase" }}>Method</div><div style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{h.method}</div></div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown, marginBottom: 8 }}>Upload Invoice Document</div>
              <div
                onClick={() => fileInputRef.current?.click()} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (() => fileInputRef.current?.click())?.(); } }}
                style={{
                  background: "#FFFFFF", border: `1.5px dashed ${T.borderDef}`, borderRadius: 12, padding: "20px",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", transition: "all 0.2s"
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(110,15,45,0.02)"; e.currentTarget.style.borderColor = T.royalBurgundy; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#FFFFFF"; e.currentTarget.style.borderColor = T.borderDef; }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 22, background: "rgba(110,15,45,0.06)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                  <FileText size={20} color={T.royalBurgundy} />
                </div>
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.royalBurgundy, marginBottom: 4 }}>Click to upload invoice</div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>PDF, JPG, PNG up to 10MB</div>
                <input type="file" ref={fileInputRef} style={{ display: "none" }} accept=".pdf,image/*" />
              </div>
            </div>
          </div>

          {/* Right Column: Payment Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "rgba(200,155,71,0.10)", border: `1px solid ${T.borderGold}`, borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4 }}>Outstanding Balance</div>
              <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: T.antiqueGold }}>₹{balance.toLocaleString("en-IN")}</div>
            </div>

            <div>
              <label style={labelStyle} htmlFor="amount-to-pay">Amount to Pay (₹) *</label>
              <input id="amount-to-pay" type="number" value={amount} onChange={e => setAmount(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle} htmlFor="payment-date">Payment Date *</label>
              <input id="payment-date" type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle} htmlFor="utr-number">UTR Number *</label>
              <input id="utr-number" value={utr} onChange={e => setUtr(e.target.value)} placeholder="e.g. UTR2026053012345" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle} htmlFor="payment-method">Payment Method</label>
              <select id="payment-method" value={method} onChange={e => setMethod(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                {["Bank Transfer", "Cheque", "RTGS", "NEFT"].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle} htmlFor="paying-from-firm">Paying from Firm *</label>
              <select id="paying-from-firm" value={firmId} onChange={e => setFirmId(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                {firms.map(f => <option key={f.id} value={f.id}>{f.firmName}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle} htmlFor="notes-optional">Notes (optional)</label>
              <textarea id="notes-optional" value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ ...inputStyle, height: "auto", padding: "10px 12px", resize: "vertical" as const }} />
            </div>
          </div>
        </div>

        {saveError && (
          <div style={{ margin: "0 28px", padding: "10px 14px", borderRadius: 10, background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.25)", fontFamily: F.ui, fontSize: 13, color: "#C0392B", fontWeight: 600 }}>
            {saveError}
          </div>
        )}
        <div style={{ padding: "18px 28px 24px", display: "flex", gap: 10, justifyContent: "flex-end", borderTop: `1px solid ${T.borderDef}` }}>
          <button onClick={onClose} style={{ height: 42, padding: "0 20px", background: "transparent", border: `1px solid ${T.borderDef}`, borderRadius: 999, fontFamily: F.ui, fontSize: 13, color: T.taupe, cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ height: 42, padding: "0 24px", background: T.royalBurgundy, border: "none", borderRadius: 999, fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: "#FFF", cursor: "pointer" }}>
            {saving ? "Processing..." : "Confirm Payment"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
