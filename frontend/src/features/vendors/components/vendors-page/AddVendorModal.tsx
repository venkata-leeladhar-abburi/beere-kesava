import React, { useState } from "react";
import { motion } from "motion/react";
import { CheckCircle2, Star } from "lucide-react";
import { T, F } from "./theme";
import { Vendor } from "./types";
import { PAYMENT_TERMS, STATES } from "./data";

export function AddVendorModal({ onSave, onCancel, nextId }: { onSave: (v: Vendor) => void; onCancel: () => void; nextId: string }) {
  const [form, setForm] = useState({
    name: "", contactName: "", phone: "", whatsapp: "",
    city: "", state: "Andhra Pradesh", address: "",
    gstCode: "", types: ["Warp"], terms: "30 days",
    bankName: "", accountNo: "", notes: "", visitingCard: "",
    rating: 3,
  });
  const [cardPreview, setCardPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

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

  const handleSave = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Required";
    if (!form.contactName.trim()) errs.contactName = "Required";
    if (!form.phone.trim()) errs.phone = "Required";
    if (!form.city.trim()) errs.city = "Required";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    const initials = form.name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
    onSave({
      id: nextId, name: form.name, initials,
      contactName: form.contactName, phone: form.phone,
      whatsapp: form.whatsapp, city: form.city, state: form.state,
      address: form.address, gstCode: form.gstCode, type: form.types.join(" / "),
      terms: form.terms, bankName: form.bankName, accountNo: form.accountNo,
      notes: form.notes, visitingCard: cardPreview || undefined,
      status: "active", totalOrders: 0, totalSpend: "0",
      outstanding: "0", lastOrder: "—", rating: form.rating,
    } as any);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999,
      background: "rgba(30,10,20,0.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px",
    }} onClick={onCancel}>
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        onClick={e => e.stopPropagation()}
        style={{
          background: "#FFF", borderRadius: 16, padding: 32,
          border: `1px solid rgba(110,15,45,0.10)`,
          boxShadow: "0 32px 80px rgba(0,0,0,0.22)",
          width: "100%", maxWidth: 940, maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h3 style={{ fontFamily: F.display, fontSize: 22, color: T.luxuryBrown, margin: "0 0 6px 0" }}>Add a New Vendor</h3>
            <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, margin: 0 }}>Fill in the business and contact details. Payment terms can be set here and changed later.</p>
          </div>
          <div style={{ padding: "4px 12px", background: T.silkCream, borderRadius: 20, fontFamily: F.mono, fontSize: 11, color: T.taupe, flexShrink: 0 }}>{nextId} will be assigned</div>
        </div>

        {/* Form Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
          {/* Left Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={lbl}>Business Name *</label>
              <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Name of the business or shop" style={{ ...inp, border: errors.name ? "1.5px solid #C0392B" : inp.border }} />
              {errors.name && <div style={{ color: "#C0392B", fontSize: 11, marginTop: 3 }}>{errors.name}</div>}
            </div>
            <div>
              <label style={lbl}>Owner / Contact Name *</label>
              <input value={form.contactName} onChange={e => set("contactName", e.target.value)} placeholder="Who to speak to at this business" style={{ ...inp, border: errors.contactName ? "1.5px solid #C0392B" : inp.border }} />
              {errors.contactName && <div style={{ color: "#C0392B", fontSize: 11, marginTop: 3 }}>{errors.contactName}</div>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={lbl}>Phone Number *</label>
                <input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="Main contact number" style={{ ...inp, border: errors.phone ? "1.5px solid #C0392B" : inp.border }} />
                {errors.phone && <div style={{ color: "#C0392B", fontSize: 11, marginTop: 3 }}>{errors.phone}</div>}
              </div>
              <div>
                <label style={lbl}>WhatsApp Number</label>
                <input value={form.whatsapp} onChange={e => set("whatsapp", e.target.value)} placeholder="If different" style={inp} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={lbl}>City *</label>
                <input value={form.city} onChange={e => set("city", e.target.value)} placeholder="City" style={{ ...inp, border: errors.city ? "1.5px solid #C0392B" : inp.border }} />
                {errors.city && <div style={{ color: "#C0392B", fontSize: 11, marginTop: 3 }}>{errors.city}</div>}
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
                  {["Warp", "Resham", "Jari"].map(t => (
                    <label key={t} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>
                      <input type="checkbox" checked={form.types.includes(t)} onChange={e => {
                        const newTypes = e.target.checked ? [...form.types, t] : form.types.filter(x => x !== t);
                        setForm(p => ({ ...p, types: newTypes }));
                      }} style={{ accentColor: T.royalBurgundy, width: 15, height: 15 }} />
                      {t}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label style={lbl}>Payment Terms *</label>
                <select value={form.terms} onChange={e => set("terms", e.target.value)} style={{ ...inp, cursor: "pointer", backgroundColor: "#FFF", marginBottom: 16 }}>
                  {PAYMENT_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <label style={lbl}>Vendor Rating</label>
                <div style={{ display: "flex", gap: 6, cursor: "pointer", marginTop: 8 }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} onClick={() => setForm(p => ({ ...p, rating: i }))}>
                      <Star size={20} fill={i <= form.rating ? T.antiqueGold : "none"} color={i <= form.rating ? T.antiqueGold : T.taupe} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={lbl}>Business Address</label>
              <textarea value={form.address} onChange={e => set("address", e.target.value)} placeholder="Full address for delivery and billing" rows={3}
                style={{ ...inp, resize: "none", lineHeight: 1.5 }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={lbl}>Bank Name</label>
                <input value={form.bankName} onChange={e => set("bankName", e.target.value)} placeholder="For any refunds" style={inp} />
              </div>
              <div>
                <label style={lbl}>Account Number</label>
                <input value={form.accountNo} onChange={e => set("accountNo", e.target.value)} placeholder="Account No." style={inp} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={lbl}>GST Number</label>
                <input value={form.gstCode} onChange={e => set("gstCode", e.target.value)} placeholder="15-digit GSTIN (e.g. 36AAAAA1111A1Z1)" style={inp} />
              </div>
              <div>
                <label style={lbl}>Visiting Card Photo</label>
                <input type="file" accept="image/*" onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = ev => setCardPreview(ev.target?.result as string);
                    reader.readAsDataURL(file);
                  }
                }} style={{ ...inp, padding: "8px 12px", backgroundColor: "#FFF", cursor: "pointer" }} />
              </div>
            </div>
            {cardPreview && (
              <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid rgba(110,15,45,0.12)`, maxHeight: 120 }}>
                <img src={cardPreview} alt="Visiting Card" style={{ width: "100%", height: 120, objectFit: "cover" }} />
              </div>
            )}
            <div>
              <label style={lbl}>Notes</label>
              <input value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Any special instructions or supplier notes..." style={inp} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, marginTop: 32, paddingTop: 24, borderTop: `1px solid rgba(110,15,45,0.08)` }}>
          <button onClick={onCancel} style={{ padding: "10px 24px", background: "transparent", color: T.taupe, borderRadius: 8, border: "none", fontFamily: F.ui, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <motion.button onClick={handleSave} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            style={{ padding: "10px 32px", background: T.royalBurgundy, color: "#FFF", borderRadius: 8, border: "none", fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle2 size={15} /> Save Vendor
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
