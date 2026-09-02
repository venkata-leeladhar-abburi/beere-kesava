// Shared add/edit supplier form fields — same field set as the wholesale
// customer form, reused for both "Add Supplier" and the profile's "Edit
// Profile" tab.

import { Star } from "lucide-react";
import { T } from "../theme";
import { inp, lbl } from "../common/primitives";
import { SupplierFormValues } from "../types";
import { Field, Input, PhoneInput } from "../../../../shared/ui/primitives";
import { VisitingCardUploadField } from "../../../../shared/ui/VisitingCardUploadField";

export function SupplierFormFields({
  form, setForm, errors, cardPreview, onCardChange,
}: {
  form: SupplierFormValues;
  setForm: (f: SupplierFormValues) => void;
  errors: Record<string, string>;
  cardPreview: string | null;
  /** Receives the stored path of the uploaded card, or null when cleared. */
  onCardChange: (url: string | null) => void;
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
        <Field label="Short Name" error={errors.shortName}>
          <Input id="short-name" value={form.shortName} onChange={e => set("shortName", e.target.value)} placeholder="Printed on saree tags, e.g. RAVI" />
        </Field>
        <Field label="Owner / Contact Name" required error={errors.contactName}>
          <Input id="owner-contact-name" value={form.contactName} onChange={e => set("contactName", e.target.value)} placeholder="Who to speak to at this business" />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16 }}>
          <Field label="Phone Number" required error={errors.phone}>
            <PhoneInput id="phone-number" value={form.phone} onValueChange={v => set("phone", v)} />
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
            <Input id="state" value={form.state} onChange={e => set("state", e.target.value)} placeholder="State" />
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
            <Input id="payment-terms" value={form.terms} onChange={e => set("terms", e.target.value)} placeholder="e.g. 30 days" />
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
          <Field label="Bank Name" required error={errors.bankName}>
            <Input id="bank-name" value={form.bankName} onChange={e => set("bankName", e.target.value)} placeholder="For any refunds" />
          </Field>
          <Field label="Account Number" required error={errors.accountNo}>
            <Input id="account-number" value={form.accountNo} onChange={e => set("accountNo", e.target.value)} placeholder="Account No." />
          </Field>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16 }}>
          <Field label="IFSC Code" required error={errors.ifscCode}>
            <Input id="ifsc-code" value={form.ifscCode || ""} onChange={e => set("ifscCode", e.target.value)} placeholder="IFSC Code" />
          </Field>
          <Field label="GST Number" required error={errors.gstCode}>
            <Input id="gst-number" value={form.gstCode} onChange={e => set("gstCode", e.target.value.toUpperCase())} placeholder="15-digit GSTIN (e.g. 36AAAAA1111A1Z1)"
              className="font-mono text-[13px]" />
          </Field>
        </div>
        <VisitingCardUploadField cardUrl={cardPreview} onChange={onCardChange} />
        <div>
          <label style={lbl} htmlFor="notes">Notes</label>
          <textarea id="notes" aria-label="Notes" value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Any special instructions or supplier notes..." rows={2}
            style={{ ...inp, resize: "none", lineHeight: 1.5 }} />
        </div>
      </div>
    </div>
  );
}
