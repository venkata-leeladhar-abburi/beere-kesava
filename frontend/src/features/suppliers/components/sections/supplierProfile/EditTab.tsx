// Edit Profile tab of the supplier profile — reuses the shared form fields.

import React from "react";
import { CheckCircle2 } from "lucide-react";
import { T, F } from "../../theme";
import { SupplierFormValues } from "../../types";
import { SupplierFormFields } from "../SupplierFormFields";

export function EditTab({
  card, form, setForm, cardPreview, setCardPreview, savedFlash, onSave,
}: {
  card: React.CSSProperties;
  form: SupplierFormValues;
  setForm: (f: SupplierFormValues) => void;
  cardPreview: string | null;
  setCardPreview: (v: string | null) => void;
  savedFlash: boolean;
  onSave: () => void;
}) {
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
          <button onClick={onSave}
            style={{ padding: "9px 18px", background: T.royalBurgundy, color: "#FFF", fontFamily: F.ui, fontSize: 13, fontWeight: 600, borderRadius: 8, cursor: "pointer", border: "none" }}>
            Save Changes
          </button>
        </div>
      </div>
      <SupplierFormFields form={form} setForm={setForm} errors={{}} cardPreview={cardPreview} onCardChange={setCardPreview} />
    </div>
  );
}
