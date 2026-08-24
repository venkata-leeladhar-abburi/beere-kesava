import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Star } from "lucide-react";
import { T, F } from "./theme";
import { Vendor } from "./types";
import { PAYMENT_TERMS, STATES } from "./data";
import { Button, Field, Input, Textarea, Select, SelectItem, CheckboxField } from "../../../../shared/ui/primitives";
import { Modal } from "../../../../shared/ui/overlay";
import { VisitingCardUploadField } from "../../../../shared/ui/VisitingCardUploadField";

export function AddVendorModal({ onSave, onCancel }: { onSave: (v: Vendor) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    name: "", contactName: "", phone: "", whatsapp: "",
    city: "", state: "Andhra Pradesh", address: "",
    gstCode: "", types: ["Warp"], terms: "30 days",
    bankName: "", accountNo: "", ifscCode: "", notes: "",
    rating: 3,
  });
  const [cardUrl, setCardUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

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
      // Placeholder — VendorsPage.handleSave discards this and keeps the id the
      // backend assigns on create.
      id: "", name: form.name, initials,
      contactName: form.contactName, phone: form.phone,
      whatsapp: form.whatsapp, city: form.city, state: form.state,
      address: form.address, gstCode: form.gstCode, type: form.types.join(" / "),
      terms: form.terms, bankName: form.bankName, accountNo: form.accountNo, ifscCode: form.ifscCode,
      notes: form.notes, visitingCard: cardUrl || undefined,
      status: "active", totalOrders: 0, totalSpend: "0",
      outstanding: "0", lastOrder: "—", rating: form.rating,
    });
  };

  return (
    <Modal open onOpenChange={o => !o && onCancel()} size="xl">
      <div style={{ padding: 32, overflowY: "auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <Dialog.Title asChild>
              <h3 style={{ fontFamily: F.display, fontSize: 20, color: T.luxuryBrown, margin: "0 0 6px 0" }}>Add a New Vendor</h3>
            </Dialog.Title>
            <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, margin: 0 }}>Fill in the business and contact details. Payment terms can be set here and changed later.</p>
          </div>
          <div style={{ padding: "4px 12px", background: T.silkCream, borderRadius: 20, fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe, flexShrink: 0 }}>ID assigned on save</div>
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 32 }}>
          {/* Left Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Field label="Business Name" required error={errors.name} id="business-name">
              <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Name of the business or shop" />
            </Field>
            <Field label="Owner / Contact Name" required error={errors.contactName} id="owner-contact-name">
              <Input value={form.contactName} onChange={e => set("contactName", e.target.value)} placeholder="Who to speak to at this business" />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16 }}>
              <Field label="Phone Number" required error={errors.phone} id="phone-number">
                <Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="Main contact number" />
              </Field>
              <Field label="WhatsApp Number" id="whatsapp-number">
                <Input value={form.whatsapp} onChange={e => set("whatsapp", e.target.value)} placeholder="If different" />
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16 }}>
              <Field label="City" required error={errors.city} id="city">
                <Input value={form.city} onChange={e => set("city", e.target.value)} placeholder="City" />
              </Field>
              <Field label="State" required id="state">
                <Select value={form.state} onValueChange={v => set("state", v)}>
                  {STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16 }}>
              <div>
                <span style={{ ...lbl, display: "block" }}>Material Types</span>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", padding: "10px 0" }}>
                  {["Warp", "Resham", "Jari"].map(t => (
                    <CheckboxField
                      key={t}
                      label={t}
                      checked={form.types.includes(t)}
                      onCheckedChange={checked => {
                        const newTypes = checked ? [...form.types, t] : form.types.filter(x => x !== t);
                        setForm(p => ({ ...p, types: newTypes }));
                      }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <Field label="Payment Terms" required id="payment-terms" className="mb-4">
                  <Select value={form.terms} onValueChange={v => set("terms", v)}>
                    {PAYMENT_TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </Select>
                </Field>
                <span style={{ ...lbl, display: "block" }}>Vendor Rating</span>
                <div style={{ display: "flex", gap: 6, cursor: "pointer", marginTop: 8 }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} onClick={() => setForm(p => ({ ...p, rating: i }))} role="button" tabIndex={0} aria-label={`Rate ${i} stars`} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (() => setForm(p => ({ ...p, rating: i })))?.(); } }}>
                      {/* eslint-disable-next-line no-restricted-syntax -- star rating UI, not chart series */}
                      <Star size={20} fill={i <= form.rating ? T.antiqueGold : "none"} color={i <= form.rating ? T.antiqueGold : T.taupe} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Field label="Business Address" id="business-address">
              <Textarea value={form.address} onChange={e => set("address", e.target.value)} placeholder="Full address for delivery and billing" rows={3} className="resize-none" />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16 }}>
              <Field label="Bank Name" id="bank-name">
                <Input value={form.bankName} onChange={e => set("bankName", e.target.value)} placeholder="For any refunds" />
              </Field>
              <Field label="Account Number" id="account-number">
                <Input value={form.accountNo} onChange={e => set("accountNo", e.target.value)} placeholder="Account No." />
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16 }}>
              <Field label="IFSC Code" id="ifsc-code">
                <Input value={form.ifscCode} onChange={e => set("ifscCode", e.target.value)} placeholder="IFSC Code" />
              </Field>
              <Field label="GST Number" id="gst-number">
                <Input value={form.gstCode} onChange={e => set("gstCode", e.target.value)} placeholder="15-digit GSTIN" />
              </Field>
            </div>
            <VisitingCardUploadField cardUrl={cardUrl} onChange={setCardUrl} />
            <Field label="Notes" id="notes">
              <Input value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Any special instructions or supplier notes..." />
            </Field>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, marginTop: 32, paddingTop: 24, borderTop: `1px solid rgba(110,15,45,0.08)` }}>
          <Button onClick={onCancel} variant="tertiary" className="text-[#9C8672]">Cancel</Button>
          <Button onClick={handleSave} variant="primary" iconLeft="success" className="rounded-lg bg-[#6E0F2D] px-8">
            Save Vendor
          </Button>
        </div>
      </div>
    </Modal>
  );
}
