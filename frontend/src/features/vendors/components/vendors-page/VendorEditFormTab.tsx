import React from "react";
import { Star } from "lucide-react";
import { T, F } from "./theme";
import { Vendor } from "./types";
import { PAYMENT_TERMS, STATES } from "./data";
import { Button, Field, Input, Textarea, Select, SelectItem, CheckboxField } from "../../../../shared/ui/primitives";

export function VendorEditFormTab({ vendor, onUpdate }: { vendor: Vendor; onUpdate?: (v: Vendor) => void }) {
  const [form, setForm] = React.useState(vendor);
  const set = (k: keyof Vendor, v: any) => setForm(p => ({ ...p, [k]: v }));

  React.useEffect(() => { setForm(vendor); }, [vendor]);

  const lbl: React.CSSProperties = {
    fontFamily: F.ui, fontSize: 12, fontWeight: 600,
    color: T.luxuryBrown, display: "block", marginBottom: 6,
  };

  return (
    <div style={{ background: "#FFF", borderRadius: 14, border: `1.5px solid ${T.borderDef}`, padding: "28px 32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 600, color: T.luxuryBrown }}>Edit Profile</div>
        <Button onClick={() => onUpdate?.(form)} variant="primary" size="sm" className="rounded-lg bg-[#6E0F2D]">Save Changes</Button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Business Name" required id="business-name">
            <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Name of the business or shop" />
          </Field>
          <Field label="Owner / Contact Name" required id="owner-contact-name">
            <Input value={form.contactName} onChange={e => set("contactName", e.target.value)} placeholder="Who to speak to at this business" />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Phone Number" required id="phone-number">
              <Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="Main contact number" />
            </Field>
            <Field label="WhatsApp Number" id="whatsapp-number">
              <Input value={form.whatsapp || ""} onChange={e => set("whatsapp", e.target.value)} placeholder="If different" />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="City" required id="city">
              <Input value={form.city} onChange={e => set("city", e.target.value)} placeholder="City" />
            </Field>
            <Field label="State" required id="state">
              <Select value={form.state} onValueChange={v => set("state", v)}>
                {STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </Select>
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={lbl}>Material Types</label>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", padding: "10px 0" }}>
                {["Warp", "Resham", "Jari"].map(t => {
                  const typesArr = form.type ? form.type.split(" / ").map(s => s.trim()).filter(Boolean) : [];
                  return (
                    <CheckboxField
                      key={t}
                      label={t}
                      checked={typesArr.includes(t)}
                      onCheckedChange={checked => {
                        const newTypes = checked ? [...typesArr, t] : typesArr.filter(x => x !== t);
                        set("type", newTypes.join(" / "));
                      }}
                    />
                  );
                })}
              </div>
            </div>
            <div>
              <Field label="Payment Terms" required id="payment-terms" className="mb-4">
                <Select value={form.terms} onValueChange={v => set("terms", v)}>
                  {PAYMENT_TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </Select>
              </Field>
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
          <Field label="Business Address" id="business-address">
            <Textarea value={form.address} onChange={e => set("address", e.target.value)} placeholder="Full address for delivery and billing" rows={3} className="resize-none" />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Bank Name" id="bank-name">
              <Input value={form.bankName || ""} onChange={e => set("bankName", e.target.value)} placeholder="For any refunds" />
            </Field>
            <Field label="Account Number" id="account-number">
              <Input value={form.accountNo || ""} onChange={e => set("accountNo", e.target.value)} placeholder="Account No." />
            </Field>
          </div>
          <Field label="GST Number" id="gst-number">
            <Input value={form.gstCode} onChange={e => set("gstCode", e.target.value)} placeholder="15-digit GSTIN (e.g. 36AAAAA1111A1Z1)" />
          </Field>
          <Field label="Notes" id="notes">
            <Textarea value={form.notes || ""} onChange={e => set("notes", e.target.value)} placeholder="Any special instructions or supplier notes..." rows={3} className="resize-none" />
          </Field>
        </div>
      </div>
    </div>
  );
}
