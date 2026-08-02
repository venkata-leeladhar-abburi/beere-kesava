// Shared add/edit supplier form fields — same field set as the wholesale
// customer form, reused for both "Add Supplier" and the profile's "Edit
// Profile" tab.

import React from "react";
import { Star, X } from "lucide-react";
import { T, F } from "../theme";
import { inp, lbl } from "../common/primitives";
import { STATES, PAYMENT_TERMS } from "../data";
import { SupplierFormValues } from "../types";

export function SupplierFormFields({
  form, setForm, errors, cardPreview, onCardChange,
}: {
  form: SupplierFormValues;
  setForm: (f: SupplierFormValues) => void;
  errors: Record<string, string>;
  cardPreview: string | null;
  onCardChange: (dataUrl: string | null) => void;
}) {
  const set = (k: keyof SupplierFormValues, v: string) => setForm({ ...form, [k]: v });
  const err = (k: string) => errors[k]
    ? <div style={{ color: T.crimson, fontSize: 11, marginTop: 3, fontFamily: F.ui }}>{errors[k]}</div>
    : null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
      {/* Left */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={lbl}>Business Name *</label>
          <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Name of the business or shop"
            style={{ ...inp, border: errors.name ? `1.5px solid ${T.crimson}` : inp.border }} />
          {err("name")}
        </div>
        <div>
          <label style={lbl}>Owner / Contact Name *</label>
          <input value={form.contactName} onChange={e => set("contactName", e.target.value)} placeholder="Who to speak to at this business"
            style={{ ...inp, border: errors.contactName ? `1.5px solid ${T.crimson}` : inp.border }} />
          {err("contactName")}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={lbl}>Phone Number *</label>
            <input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="Main contact number"
              style={{ ...inp, border: errors.phone ? `1.5px solid ${T.crimson}` : inp.border }} />
            {err("phone")}
          </div>
          <div>
            <label style={lbl}>WhatsApp Number</label>
            <input value={form.whatsapp} onChange={e => set("whatsapp", e.target.value)} placeholder="If different" style={inp} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={lbl}>City *</label>
            <input value={form.city} onChange={e => set("city", e.target.value)} placeholder="City"
              style={{ ...inp, border: errors.city ? `1.5px solid ${T.crimson}` : inp.border }} />
            {err("city")}
          </div>
          <div>
            <label style={lbl}>State *</label>
            <select value={form.state} onChange={e => set("state", e.target.value)} style={{ ...inp, cursor: "pointer" }}>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={lbl}>Supplier Rating</label>
            <div style={{ display: "flex", gap: 6, cursor: "pointer", marginTop: 8 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} onClick={() => set("rating", i as any)}>
                  <Star size={20} fill={i <= (form.rating || 3) ? T.antiqueGold : "none"} color={i <= (form.rating || 3) ? T.antiqueGold : T.taupe} />
                </div>
              ))}
            </div>
          </div>
          <div>
            <label style={lbl}>Payment Terms *</label>
            <select value={form.terms} onChange={e => set("terms", e.target.value)} style={{ ...inp, cursor: "pointer" }}>
              {PAYMENT_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Right */}
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
            <input value={form.gstCode} onChange={e => set("gstCode", e.target.value.toUpperCase())} placeholder="15-digit GSTIN (e.g. 36AAAAA1111A1Z1)"
              style={{ ...inp, fontFamily: F.mono, fontSize: 13 }} />
          </div>
          <div>
            <label style={lbl}>Visiting Card Photo</label>
            <input type="file" accept="image/*" onChange={e => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = ev => onCardChange(ev.target?.result as string);
              reader.readAsDataURL(file);
            }} style={{ ...inp, padding: "8px 12px", cursor: "pointer" }} />
          </div>
        </div>
        {cardPreview && (
          <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${T.borderDef}`, position: "relative" }}>
            <img src={cardPreview} alt="Visiting card" style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }} />
            <button onClick={() => onCardChange(null)}
              style={{ position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: "50%", background: "rgba(0,0,0,0.55)", border: "none", color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={13} />
            </button>
          </div>
        )}
        <div>
          <label style={lbl}>Notes</label>
          <textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Any special instructions or supplier notes..." rows={2}
            style={{ ...inp, resize: "none", lineHeight: 1.5 }} />
        </div>
      </div>
    </div>
  );
}
