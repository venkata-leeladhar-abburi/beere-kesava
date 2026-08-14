// Shared add/edit supplier form fields — same field set as the wholesale
// customer form, reused for both "Add Supplier" and the profile's "Edit
// Profile" tab.

import React from "react";
import { Star, X } from "lucide-react";
import { T } from "../theme";
import { inp, lbl } from "../common/primitives";
import { STATES, PAYMENT_TERMS } from "../data";
import { SupplierFormValues } from "../types";
import { Field, Input, Select, SelectItem, IconButton } from "../../../../shared/ui/primitives";

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
  const setRating = (v: number) => setForm({ ...form, rating: v });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 32 }}>
      {/* Left */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field label="Business Name" required error={errors.name}>
          <Input id="business-name" value={form.name} onChange={e => set("name", e.target.value)} placeholder="Name of the business or shop" />
        </Field>
        <Field label="Owner / Contact Name" required error={errors.contactName}>
          <Input id="owner-contact-name" value={form.contactName} onChange={e => set("contactName", e.target.value)} placeholder="Who to speak to at this business" />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16 }}>
          <Field label="Phone Number" required error={errors.phone}>
            <Input id="phone-number" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="Main contact number" />
          </Field>
          <Field label="WhatsApp Number">
            <Input id="whatsapp-number" value={form.whatsapp} onChange={e => set("whatsapp", e.target.value)} placeholder="If different" />
          </Field>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16 }}>
          <Field label="City" required error={errors.city}>
            <Input id="city" value={form.city} onChange={e => set("city", e.target.value)} placeholder="City" />
          </Field>
          <Field label="State" required>
            <Select value={form.state} onValueChange={v => set("state", v)}>
              {STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16 }}>
          <div>
            <span style={{ ...lbl, display: "block" }}>Supplier Rating</span>
            <div style={{ display: "flex", gap: 6, cursor: "pointer", marginTop: 8 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} onClick={() => setRating(i)} role="button" tabIndex={0} aria-label={`Rate ${i} stars`} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setRating(i); } }}>
                  {/* eslint-disable-next-line no-restricted-syntax -- star rating UI, not chart series */}
                  <Star size={20} fill={i <= (form.rating || 3) ? T.antiqueGold : "none"} color={i <= (form.rating || 3) ? T.antiqueGold : T.taupe} />
                </div>
              ))}
            </div>
          </div>
          <Field label="Payment Terms" required>
            <Select value={form.terms} onValueChange={v => set("terms", v)}>
              {PAYMENT_TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </Select>
          </Field>
        </div>
      </div>

      {/* Right */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={lbl} htmlFor="business-address">Business Address</label>
          <textarea id="business-address" aria-label="Business Address" value={form.address} onChange={e => set("address", e.target.value)} placeholder="Full address for delivery and billing" rows={3}
            style={{ ...inp, resize: "none", lineHeight: 1.5 }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16 }}>
          <Field label="Bank Name">
            <Input id="bank-name" value={form.bankName} onChange={e => set("bankName", e.target.value)} placeholder="For any refunds" />
          </Field>
          <Field label="Account Number">
            <Input id="account-number" value={form.accountNo} onChange={e => set("accountNo", e.target.value)} placeholder="Account No." />
          </Field>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16 }}>
          <Field label="GST Number">
            <Input id="gst-number" value={form.gstCode} onChange={e => set("gstCode", e.target.value.toUpperCase())} placeholder="15-digit GSTIN (e.g. 36AAAAA1111A1Z1)"
              className="font-mono text-[13px]" />
          </Field>
          <Field label="Visiting Card Photo" id="visiting-card-photo">
            <Input type="file" accept="image/*" onChange={e => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = ev => onCardChange(ev.target?.result as string);
              reader.readAsDataURL(file);
            }} />
          </Field>
        </div>
        {cardPreview && (
          <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${T.borderDef}`, position: "relative" }}>
            <img src={cardPreview} alt="Visiting card" style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }} />
            <IconButton
              label="Remove visiting card photo"
              icon={X}
              variant="secondary"
              size="sm"
              shape="circle"
              onClick={() => onCardChange(null)}
              className="absolute top-2 right-2 bg-black/55 text-white border-none hover:bg-black/70"
            />
          </div>
        )}
        <div>
          <label style={lbl} htmlFor="notes">Notes</label>
          <textarea id="notes" aria-label="Notes" value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Any special instructions or supplier notes..." rows={2}
            style={{ ...inp, resize: "none", lineHeight: 1.5 }} />
        </div>
      </div>
    </div>
  );
}
