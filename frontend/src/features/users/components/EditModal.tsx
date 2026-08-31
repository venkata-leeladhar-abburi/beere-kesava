import { useState } from "react";
import { FinishingStaffMember } from "@/features/finishing";
import { Button, Field, Input, Textarea } from "../../../shared/ui/primitives";
import { Modal } from "../../../shared/ui/overlay";

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
    <Modal open onOpenChange={o => { if (!o) onClose(); }} size="md">
      <Modal.Header title="Edit Finishing Staff Profile" />
      <Modal.Body>
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "18px 24px", paddingBottom: 24 }}>
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
      </Modal.Body>
      <Modal.Footer>
        <Button variant="tertiary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => { if (canSave) onSave({ firstName, lastName, mobile, email, empId, specialisation, notes }); }}
          disabled={!canSave}
        >
          Save Changes
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
