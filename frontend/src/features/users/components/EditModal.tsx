import React, { useState } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { FinishingStaffMember } from "../../finishing/contexts/FinishingStaffContext";
import { T, F, EASE, inputStyle, labelStyle, FieldFocus, FieldBlur } from "./theme";

export function EditModal({ member, onClose, onSave }: {
  member: FinishingStaffMember;
  onClose: () => void;
  onSave: (updates: Partial<FinishingStaffMember>) => void;
}) {
  const [firstName,      setFirstName]      = useState(member.firstName);
  const [lastName,       setLastName]       = useState(member.lastName);
  const [mobile,         setMobile]         = useState(member.mobile);
  const [email,          setEmail]          = useState(member.email);
  const [empId,          setEmpId]          = useState(member.empId);
  const [specialisation, setSpecialisation] = useState(member.specialisation);
  const [notes,          setNotes]          = useState(member.notes);

  const canSave = firstName.trim() && lastName.trim() && mobile.trim();

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(61,14,26,0.45)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.25, ease: EASE }}
        style={{ position: "relative", width: 580, maxHeight: "90vh", overflowY: "auto", background: "#fff", borderRadius: 20, boxShadow: "0 24px 80px rgba(61,14,26,0.22)", overflow: "hidden" }}
      >
        {/* Header */}
        <div style={{ background: T.darkBurgundy, padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: "#fff" }}>
            Edit Finishing Staff Profile
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.10)", border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={15} color="#fff" />
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: "24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 24px" }}>
          <div>
            <label style={labelStyle}>First Name <span style={{ color: T.crimson }}>*</span></label>
            <input value={firstName} onChange={e => setFirstName(e.target.value)} style={inputStyle} onFocus={FieldFocus} onBlur={FieldBlur} />
          </div>
          <div>
            <label style={labelStyle}>Last Name <span style={{ color: T.crimson }}>*</span></label>
            <input value={lastName} onChange={e => setLastName(e.target.value)} style={inputStyle} onFocus={FieldFocus} onBlur={FieldBlur} />
          </div>
          <div>
            <label style={labelStyle}>Mobile <span style={{ color: T.crimson }}>*</span></label>
            <input value={mobile} onChange={e => setMobile(e.target.value)} style={inputStyle} onFocus={FieldFocus} onBlur={FieldBlur} />
          </div>
          <div>
            <label style={labelStyle}>Email <span style={{ color: T.taupe, fontWeight: 400 }}>— Optional</span></label>
            <input value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} onFocus={FieldFocus} onBlur={FieldBlur} />
          </div>
          <div>
            <label style={labelStyle}>Employee ID <span style={{ color: T.taupe, fontWeight: 400 }}>— Optional</span></label>
            <input value={empId} onChange={e => setEmpId(e.target.value)} style={inputStyle} onFocus={FieldFocus} onBlur={FieldBlur} />
          </div>
          <div>
            <label style={labelStyle}>Specialisation <span style={{ color: T.taupe, fontWeight: 400 }}>— Optional</span></label>
            <input value={specialisation} onChange={e => setSpecialisation(e.target.value)} placeholder="e.g. Silk finishing" style={inputStyle} onFocus={FieldFocus} onBlur={FieldBlur} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Notes <span style={{ color: T.taupe, fontWeight: 400 }}>— Optional</span></label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ ...inputStyle, resize: "none" as const, lineHeight: 1.55 }} onFocus={FieldFocus} onBlur={FieldBlur} />
          </div>
        </div>

        {/* Footer buttons */}
        <div style={{ padding: "0 24px 24px", display: "flex", gap: 10 }}>
          <button
            onClick={() => { if (canSave) onSave({ firstName, lastName, mobile, email, empId, specialisation, notes }); }}
            disabled={!canSave}
            style={{ flex: 1, height: 46, background: canSave ? `linear-gradient(135deg, #6E0F2D 0%, #4A061B 100%)` : "rgba(139,112,96,0.15)", border: "none", borderRadius: 999, fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: canSave ? "#fff" : T.taupe, cursor: canSave ? "pointer" : "not-allowed" }}
          >
            Save Changes
          </button>
          <button onClick={onClose} style={{ flex: 1, height: 46, background: "transparent", border: `1px solid ${T.borderMed}`, borderRadius: 999, fontFamily: F.ui, fontWeight: 500, fontSize: 13, color: T.royalBurgundy, cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}
