// Modal for adding a new supplier — uses the shared SupplierFormFields.

import React, { useState } from "react";
import { motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";
import { T, F, EASE } from "../theme";
import { SupplierFormFields } from "../sections/SupplierFormFields";
import { emptyForm } from "../utils";
import { SupplierFormValues } from "../types";

export function AddSupplierModal({ onSave, onCancel, nextId }: {
  onSave: (v: SupplierFormValues, card: string | null) => void;
  onCancel: () => void;
  nextId: string;
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
    onSave(form, cardPreview);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(30,10,20,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={onCancel}>
      <motion.div initial={{ opacity: 0, y: 32, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.28, ease: EASE }} onClick={e => e.stopPropagation()}
        style={{ background: "#FFF", borderRadius: 16, padding: 32, border: `1px solid ${T.borderDef}`, boxShadow: "0 32px 80px rgba(0,0,0,0.22)", width: "100%", maxWidth: 940, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h3 style={{ fontFamily: F.display, fontSize: 22, color: T.luxuryBrown, margin: "0 0 6px 0" }}>Add a New Supplier</h3>
            <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, margin: 0 }}>Fill in the business and contact details. Payment terms can be set here and changed later.</p>
          </div>
          <div style={{ padding: "4px 12px", background: T.silkCream, borderRadius: 20, fontFamily: F.mono, fontSize: 11, color: T.taupe, flexShrink: 0 }}>{nextId} will be assigned</div>
        </div>

        <SupplierFormFields form={form} setForm={setForm} errors={errors} cardPreview={cardPreview} onCardChange={setCardPreview} />

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, marginTop: 32, paddingTop: 24, borderTop: `1px solid ${T.borderDef}` }}>
          <button onClick={onCancel} style={{ padding: "10px 24px", background: "transparent", color: T.taupe, borderRadius: 8, border: "none", fontFamily: F.ui, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <motion.button onClick={handleSave} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            style={{ padding: "10px 32px", background: T.royalBurgundy, color: "#FFF", borderRadius: 8, border: "none", fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle2 size={15} /> Save Supplier
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
