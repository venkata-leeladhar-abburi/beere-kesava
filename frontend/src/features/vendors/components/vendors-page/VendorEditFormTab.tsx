import React from "react";
import { Star } from "lucide-react";
import { T, F } from "./theme";
import { Vendor } from "./types";
import { PAYMENT_TERMS, STATES } from "./data";

export function VendorEditFormTab({ vendor, onUpdate }: { vendor: Vendor; onUpdate?: (v: Vendor) => void }) {
  const [form, setForm] = React.useState(vendor);
  const set = (k: keyof Vendor, v: any) => setForm(p => ({ ...p, [k]: v }));

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

  return (
    <div style={{ background: "#FFF", borderRadius: 14, border: `1.5px solid ${T.borderDef}`, padding: "28px 32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 600, color: T.luxuryBrown }}>Edit Profile</div>
        <button onClick={() => onUpdate?.(form)} style={{ padding: "8px 16px", background: T.royalBurgundy, color: "#FFF", fontFamily: F.ui, fontSize: 13, fontWeight: 600, borderRadius: 8, cursor: "pointer", border: "none" }}>Save Changes</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={lbl} htmlFor="business-name">Business Name *</label>
            <input id="business-name" value={form.name} onChange={e => set("name", e.target.value)} placeholder="Name of the business or shop" style={inp} />
          </div>
          <div>
            <label style={lbl} htmlFor="owner-contact-name">Owner / Contact Name *</label>
            <input id="owner-contact-name" value={form.contactName} onChange={e => set("contactName", e.target.value)} placeholder="Who to speak to at this business" style={inp} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={lbl} htmlFor="phone-number">Phone Number *</label>
              <input id="phone-number" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="Main contact number" style={inp} />
            </div>
            <div>
              <label style={lbl} htmlFor="whatsapp-number">WhatsApp Number</label>
              <input id="whatsapp-number" value={form.whatsapp || ""} onChange={e => set("whatsapp", e.target.value)} placeholder="If different" style={inp} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={lbl} htmlFor="city">City *</label>
              <input id="city" value={form.city} onChange={e => set("city", e.target.value)} placeholder="City" style={inp} />
            </div>
            <div>
              <label style={lbl} htmlFor="state">State *</label>
              <select id="state" value={form.state} onChange={e => set("state", e.target.value)} style={{ ...inp, cursor: "pointer", backgroundColor: "#FFF" }}>
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
              <label style={lbl} htmlFor="payment-terms">Payment Terms *</label>
              <select id="payment-terms" value={form.terms} onChange={e => set("terms", e.target.value)} style={{ ...inp, cursor: "pointer", backgroundColor: "#FFF", marginBottom: 16 }}>
                {PAYMENT_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <label style={lbl}>Vendor Rating</label>
              <div style={{ display: "flex", gap: 6, cursor: "pointer", marginTop: 8 }}>
                {[1, 2, 3, 4, 5].map(i => {
                  const ratingVal = (form as any).rating || 3;
                  return (
                    <div key={i} onClick={() => set("rating", i)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (() => set("rating", i))?.(); } }}>
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
            <label style={lbl} htmlFor="business-address">Business Address</label>
            <textarea id="business-address" value={form.address} onChange={e => set("address", e.target.value)} placeholder="Full address for delivery and billing" rows={3} style={{ ...inp, resize: "none", lineHeight: 1.5 }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={lbl} htmlFor="bank-name">Bank Name</label>
              <input id="bank-name" value={form.bankName || ""} onChange={e => set("bankName", e.target.value)} placeholder="For any refunds" style={inp} />
            </div>
            <div>
              <label style={lbl} htmlFor="account-number">Account Number</label>
              <input id="account-number" value={form.accountNo || ""} onChange={e => set("accountNo", e.target.value)} placeholder="Account No." style={inp} />
            </div>
          </div>
          <div>
            <label style={lbl} htmlFor="gst-number">GST Number</label>
            <input id="gst-number" value={form.gstCode} onChange={e => set("gstCode", e.target.value)} placeholder="15-digit GSTIN (e.g. 36AAAAA1111A1Z1)" style={inp} />
          </div>
          <div>
            <label style={lbl} htmlFor="notes">Notes</label>
            <textarea id="notes" value={form.notes || ""} onChange={e => set("notes", e.target.value)} placeholder="Any special instructions or supplier notes..." rows={3} style={{ ...inp, resize: "none", lineHeight: 1.5 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
