import { useState } from "react";
import { TableRow } from "./utils";
import { T, F } from "./theme";
import { Button, Field, Input, PhoneInput } from "../../../shared/ui/primitives";
import { Modal } from "../../../shared/ui/overlay";

export interface UserEditFields {
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
}

export function EditUserModal({ row, saving, error, onClose, onSave }: {
  row: TableRow;
  saving?: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (updates: UserEditFields) => void;
}) {
  const [firstName, setFirstName] = useState(row.firstName);
  const [lastName,  setLastName]  = useState(row.lastName);
  const [mobile,    setMobile]    = useState(row.mobile);
  const [email,     setEmail]     = useState(row.email ?? "");

  const canSave = firstName.trim() && lastName.trim() && mobile.trim();

  return (
    <Modal open onOpenChange={o => { if (!o) onClose(); }} size="md">
      <Modal.Header title={`Edit ${row.role} Profile`} />
      <Modal.Body>
        {error && (
          <div style={{ background: T.crimsonBg, border: "1px solid rgba(192,57,43,0.25)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontFamily: F.ui, fontSize: 13, color: T.crimson }}>
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "18px 24px", paddingBottom: 24 }}>
          <Field label="First Name" required>
            <Input value={firstName} onChange={e => setFirstName(e.target.value)} />
          </Field>
          <Field label="Last Name" required>
            <Input value={lastName} onChange={e => setLastName(e.target.value)} />
          </Field>
          <Field label="Mobile" required>
            <PhoneInput value={mobile} onValueChange={setMobile} />
          </Field>
          <Field label="Email" hint="Optional">
            <Input value={email} onChange={e => setEmail(e.target.value)} />
          </Field>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="tertiary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => { if (canSave) onSave({ firstName, lastName, mobile, email }); }}
          disabled={!canSave || saving}
        >
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
