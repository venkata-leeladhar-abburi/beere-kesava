import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { FactoryLoom } from "../../data/factoryLooms";
import { T, F } from "./theme";
import { Button, Field, IconButton, Input, Select, SelectItem, Textarea } from "../../../../shared/ui/primitives";
import { Modal } from "../../../../shared/ui/overlay";

// ── Form helpers ─────────────────────────────────────────────────────────────
function FI({ label, value, onChange, placeholder, required }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean }) {
  return (
    <Field label={label} required={required}>
      <Input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </Field>
  );
}
function FS({ label, value, onChange, options, required }: { label: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean }) {
  return (
    <Field label={label} required={required}>
      <Select value={value} onValueChange={onChange}>
        {options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </Select>
    </Field>
  );
}

// ── Add / Edit Modal ──────────────────────────────────────────────────────────
export function AddLoomModal({ open, onClose, onAdd, editLoom }: {
  open: boolean; onClose: () => void; onAdd: (l: FactoryLoom) => void; editLoom?: FactoryLoom | null;
}) {
  const blank = { loomNumber: "", location: "", operatorName: "", operatorPhone: "", status: "active", installedYear: "", notes: "" };
  const [form, setForm] = useState<any>(blank);
  useEffect(() => { if (editLoom) { const { id, ...r } = editLoom; setForm(r); } else setForm(blank); }, [editLoom, open]);
  const patch = (p: any) => setForm((prev: any) => ({ ...prev, ...p }));
  const valid = form.loomNumber.trim() && form.operatorName.trim() && form.location.trim();
  return (
    <Modal open={open} onOpenChange={o => !o && onClose()} size="sm">
        <div style={{ background: `linear-gradient(110deg, ${T.darkBurgundy} 0%, #5A1A30 100%)`, padding: "22px 26px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <Dialog.Title asChild>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#FFF" }}>{editLoom ? "Edit Factory Loom" : "Add Factory Loom"}</div>
            </Dialog.Title>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>Enter details for this loom</div>
          </div>
          <Dialog.Close asChild>
            <IconButton icon={X} label="Close" variant="ghost" size="sm" className="bg-white/12 text-white hover:bg-white/20" />
          </Dialog.Close>
        </div>
        <div style={{ padding: "24px 26px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
            <FI label="Loom Number / Name" value={form.loomNumber} onChange={v => patch({ loomNumber: v })} placeholder="e.g. Loom F-06" required />
          </div>
          <FI label="Location (Floor / Section)" value={form.location} onChange={v => patch({ location: v })} placeholder="e.g. Factory Floor A" required />
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 14 }}>
            <FI label="Operator Name" value={form.operatorName} onChange={v => patch({ operatorName: v })} placeholder="Full name" required />
            <FI label="Operator Phone" value={form.operatorPhone} onChange={v => patch({ operatorPhone: v })} placeholder="98765 00000" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 14 }}>
            <FS label="Status" value={form.status} onChange={v => patch({ status: v })} options={["active", "idle", "maintenance"]} />
            <FI label="Installed Year" value={form.installedYear} onChange={v => patch({ installedYear: v })} placeholder="2020" />
          </div>
          <Field label="Notes">
            <Textarea value={form.notes} onChange={e => patch({ notes: e.target.value })} rows={3} placeholder="Any notes..." />
          </Field>
          <div style={{ display: "flex", gap: 10 }}>
            <Button onClick={onClose} variant="secondary" size="lg" className="flex-1 h-[46px]">Cancel</Button>
            <Button disabled={!valid} onClick={() => { onAdd({ id: editLoom?.id || `FL-${Date.now()}`, ...form } as FactoryLoom); onClose(); }}
              variant="primary" size="lg" className="flex-[2] h-[46px]">
              {editLoom ? "Save Changes" : "Add Loom"}
            </Button>
          </div>
        </div>
    </Modal>
  );
}
