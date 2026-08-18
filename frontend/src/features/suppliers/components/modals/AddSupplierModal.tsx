// Modal for adding a new supplier — uses the shared SupplierFormFields.

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { CheckCircle2 } from "lucide-react";
import { T, F } from "../theme";
import { SupplierFormFields } from "../sections/SupplierFormFields";
import { emptyForm } from "../utils";
import { SupplierFormValues } from "../types";
import { Button } from "../../../../shared/ui/primitives";
import { Modal } from "../../../../shared/ui/overlay";

export function AddSupplierModal({ onSave, onCancel }: {
  onSave: (v: SupplierFormValues, card: string | null) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<SupplierFormValues>(emptyForm());
  const [cardPreview, setCardPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim())        errs.name = "Required";
    if (!form.contactName.trim()) errs.contactName = "Required";
    if (!form.phone.trim())       errs.phone = "Required";
    if (!form.city.trim())        errs.city = "Required";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const finalWhatsapp = form.whatsapp?.trim() ? form.whatsapp : form.phone;
    onSave({ ...form, whatsapp: finalWhatsapp }, cardPreview);
  };

  return (
    <Modal open onOpenChange={o => !o && onCancel()} size="xl">
      <div style={{ padding: 32, overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <Dialog.Title asChild>
              <h3 style={{ fontFamily: F.display, fontSize: 20, color: T.luxuryBrown, margin: "0 0 6px 0" }}>Add a New Supplier</h3>
            </Dialog.Title>
            <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, margin: 0 }}>Fill in the business and contact details. Payment terms can be set here and changed later.</p>
          </div>
          <div style={{ padding: "4px 12px", background: T.silkCream, borderRadius: 20, fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe, flexShrink: 0 }}>ID assigned on save</div>
        </div>

        <SupplierFormFields form={form} setForm={setForm} errors={errors} cardPreview={cardPreview} onCardChange={setCardPreview} />

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, marginTop: 32, paddingTop: 24, borderTop: `1px solid ${T.borderDef}` }}>
          <Button variant="tertiary" size="md" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" size="md" iconLeft={CheckCircle2} onClick={handleSave}>
            Save Supplier
          </Button>
        </div>
      </div>
    </Modal>
  );
}
