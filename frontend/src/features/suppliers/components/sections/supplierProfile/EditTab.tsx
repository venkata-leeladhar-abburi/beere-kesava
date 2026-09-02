// Edit Profile tab of the supplier profile — reuses the shared form fields.

import React from "react";
import { CheckCircle2 } from "lucide-react";
import { T, F } from "../../theme";
import { SupplierFormValues } from "../../types";
import { SupplierFormFields } from "../SupplierFormFields";
import { Button } from "../../../../../shared/ui/primitives";

export function EditTab({
  card, form, setForm, cardPreview, setCardPreview, savedFlash, onSave,
}: {
  card: React.CSSProperties;
  form: SupplierFormValues;
  setForm: (f: SupplierFormValues) => void;
  cardPreview: string | null;
  setCardPreview: (v: string | null) => void;
  savedFlash: boolean;
  onSave: (values: SupplierFormValues) => void;
}) {
  // WhatsApp defaults to the phone number when left blank. The values are
  // passed straight to onSave rather than written back through setForm first —
  // that older path saved whatever the parent had already rendered, so the
  // defaulted number only landed if a deferred re-render happened to win.
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const handleSave = () => {
    const errs: Record<string, string> = {};
    if (!form.bankName.trim())  errs.bankName = "Required";
    if (!form.accountNo.trim()) errs.accountNo = "Required";
    if (!form.ifscCode?.trim()) errs.ifscCode = "Required";
    if (!form.gstCode.trim())   errs.gstCode = "Required";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    const values = { ...form, whatsapp: form.whatsapp?.trim() ? form.whatsapp : form.phone };
    setForm(values);
    onSave(values);
  };

  return (
    <div style={{ ...card, padding: "28px 32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 600, color: T.luxuryBrown }}>Edit Profile</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {savedFlash && (
            <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.green, display: "flex", alignItems: "center", gap: 6 }}>
              <CheckCircle2 size={14} /> Saved
            </span>
          )}
          <Button variant="primary" size="md" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
      <SupplierFormFields form={form} setForm={setForm} errors={errors} cardPreview={cardPreview} onCardChange={setCardPreview} />
    </div>
  );
}
