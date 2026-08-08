import React, { useState } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { FinishingStaffMember } from "../../finishing/contexts/FinishingStaffContext";
import { T, F, EASE } from "./theme";
import { Button, IconButton, Field, Input, Textarea } from "../../../shared/ui/primitives";

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
    <div style={{ position: "fixed", inset: 0, zIndex: "var(--z-modal)", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
          <IconButton label="Close" icon={X} size="sm" variant="ghost" onClick={onClose}
            className="bg-white/10 text-white hover:bg-white/20 hover:text-white" />
        </div>

        {/* Form */}
        <div style={{ padding: "24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 24px" }}>
          <Field label="First Name" required>
            <Input value={firstName} onChange={e => setFirstName(e.target.value)} />
          </Field>
          <Field label="Last Name" required>
            <Input value={lastName} onChange={e => setLastName(e.target.value)} />
          </Field>
          <Field label="Mobile" required>
            <Input value={mobile} onChange={e => setMobile(e.target.value)} />
          </Field>
          <Field label="Email" hint="Optional">
            <Input value={email} onChange={e => setEmail(e.target.value)} />
          </Field>
          <Field label="Employee ID" hint="Optional">
            <Input value={empId} onChange={e => setEmpId(e.target.value)} />
          </Field>
          <Field label="Specialisation" hint="Optional">
            <Input value={specialisation} onChange={e => setSpecialisation(e.target.value)} placeholder="e.g. Silk finishing" />
          </Field>
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="Notes" hint="Optional">
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
            </Field>
          </div>
        </div>

        {/* Footer buttons */}
        <div style={{ padding: "0 24px 24px", display: "flex", gap: 10 }}>
          <Button
            variant="primary"
            fullWidth
            onClick={() => { if (canSave) onSave({ firstName, lastName, mobile, email, empId, specialisation, notes }); }}
            disabled={!canSave}
          >
            Save Changes
          </Button>
          <Button variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
