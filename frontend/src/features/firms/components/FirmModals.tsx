// The firm *detail* view used to live here as a modal. It is now a real page
// (FirmDetailPage) reached from the directory's "View Details" button, so the
// only modal left in this file is the create/edit form.
import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  X, Building2, CreditCard, User, Phone,
  MapPin, Hash, Check,
} from "lucide-react";
import { Firm } from "../contexts/FirmsContext";
import { T, F } from "./theme";
import { Button, IconButton, Field as PField, Input, Textarea } from "../../../shared/ui/primitives";
import { Modal } from "../../../shared/ui/overlay";

function SLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, letterSpacing: "2px", color: T.taupe, textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ height: 1, width: 24, background: T.borderDef }} />
      {children}
      <div style={{ flex: 1, height: 1, background: T.borderDef }} />
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", required, textarea, icon }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean; textarea?: boolean; icon?: React.ComponentProps<typeof Input>["iconLeft"];
}) {
  return (
    <PField label={label} required={required}>
      {textarea ? (
        <Textarea rows={3} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      ) : (
        <Input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} iconLeft={icon} />
      )}
    </PField>
  );
}

type FormState = Omit<Firm, "id" | "createdAt">;

export function FirmFormModal({ initial, onSave, onClose, title }: { initial: FormState; onSave: (data: FormState) => void; onClose: () => void; title: string }) {
  const [form, setForm] = React.useState<FormState>(initial);
  const [saved, setSaved] = React.useState(false);
  function set(key: keyof FormState, val: string) {
    setForm(prev => ({ ...prev, [key]: key === "purchaseAmount" ? (val === "" ? undefined : Number(val)) : val }));
  }
  function handleSave() {
    if (!form.firmName.trim()) return;
    onSave(form); setSaved(true); setTimeout(onClose, 600);
  }
  return (
    <Modal open onOpenChange={o => !o && onClose()} size="md">
        <div style={{ background: T.darkBurgundy, borderRadius: "var(--radius-xl) var(--radius-xl) 0 0", padding: "24px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(200,155,71,0.7)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 4 }}>FIRMS MANAGEMENT</div>
            <Dialog.Title asChild>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#FFF" }}>{title}</div>
            </Dialog.Title>
          </div>
          <Dialog.Close asChild>
            <IconButton icon={X} label="Close" variant="secondary" size="sm" />
          </Dialog.Close>
        </div>
        <div style={{ padding: "28px 28px 32px", overflowY: "auto" }}>
          <SLabel>Basic Information</SLabel>
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 14, marginBottom: 20 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Firm Name" value={form.firmName} onChange={v => set("firmName", v)} placeholder="e.g. Surat Zari Works" required icon={Building2} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="GST Number" value={form.gstNumber ?? ""} onChange={v => set("gstNumber", v)} placeholder="29ABCDE1234F1Z5" icon={Hash} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Address" value={form.address ?? ""} onChange={v => set("address", v)} placeholder="Street, City, State, PIN" textarea icon={MapPin} />
            </div>
          </div>
          <SLabel>Bank Details</SLabel>
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 14, marginBottom: 20 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Bank Name" value={form.bankName ?? ""} onChange={v => set("bankName", v)} placeholder="e.g. State Bank of India" icon={CreditCard} />
            </div>
            <Field label="Account Number" value={form.accountNumber ?? ""} onChange={v => set("accountNumber", v)} placeholder="e.g. 001234567890" />
            <Field label="IFSC Code" value={form.ifscCode ?? ""} onChange={v => set("ifscCode", v)} placeholder="e.g. SBIN0001234" />
          </div>
          <SLabel>Contact Person</SLabel>
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 14, marginBottom: 28 }}>
            <Field label="Contact Person Name" value={form.contactPersonName ?? ""} onChange={v => set("contactPersonName", v)} placeholder="Full name" icon={User} />
            <Field label="Phone Number" value={form.contactPersonPhone ?? ""} onChange={v => set("contactPersonPhone", v)} placeholder="9876543210" type="tel" icon={Phone} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="secondary" size="lg" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button variant="primary" size="lg" className="flex-[2]" disabled={!form.firmName.trim()} iconLeft={saved ? Check : undefined} onClick={handleSave}>
              {saved ? "Saved!" : title}
            </Button>
          </div>
        </div>
    </Modal>
  );
}
