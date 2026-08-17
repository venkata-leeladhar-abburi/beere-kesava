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

// A stable, module-level constant — reused as-is so the effect below can
// safely depend on it without triggering on every render.
const blank = { loomNumber: "", location: "", operatorName: "", operatorPhone: "", status: "active" as "active" | "idle" | "maintenance", installedYear: "", notes: "" };
type LoomForm = typeof blank & Partial<Omit<FactoryLoom, "id">>;

// ── Add / Edit Modal ──────────────────────────────────────────────────────────
export function AddLoomModal({ open, onClose, onAdd, editLoom }: {
  open: boolean; onClose: () => void; onAdd: (l: FactoryLoom) => void; editLoom?: FactoryLoom | null;
}) {
  const [form, setForm] = useState<LoomForm>(blank);
  useEffect(() => { if (editLoom) { const { id: _id, ...r } = editLoom; setForm(r as LoomForm); } else setForm(blank); }, [editLoom, open]);
  const patch = (p: Partial<LoomForm>) => setForm((prev) => ({ ...prev, ...p }));
  // Location is no longer collected on add — the backend field stays for
  // existing looms and is still editable from Edit, since data already
  // recorded there shouldn't be thrown away.
  const valid = form.loomNumber.trim();
  return (
    <Modal open={open} onOpenChange={o => !o && onClose()} size="sm">
        <div style={{ background: `linear-gradient(110deg, ${T.darkBurgundy} 0%, #5A1A30 100%)`, padding: "22px 26px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <Dialog.Title asChild>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#FFF" }}>{editLoom ? "Edit Factory Loom" : "Add Factory Loom"}</div>
            </Dialog.Title>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
              {editLoom ? "Update details for this loom" : "Enter the loom number — its ID is assigned automatically"}
            </div>
          </div>
          <Dialog.Close asChild>
            <IconButton icon={X} label="Close" variant="ghost" size="sm" className="bg-white/12 text-white hover:bg-white/20" />
          </Dialog.Close>
        </div>
        <div style={{ padding: "24px 26px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
            <FI label="Loom Number / Name" value={form.loomNumber} onChange={v => patch({ loomNumber: v })} placeholder="e.g. Loom F-06" required />
          </div>
          {editLoom && (
            <FI label="Location (Floor / Section)" value={form.location} onChange={v => patch({ location: v })} placeholder="e.g. Factory Floor A" />
          )}
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 14 }}>
            <FI label="Operator Name" value={form.operatorName} onChange={v => patch({ operatorName: v })} placeholder="Full name" />
            <FI label="Operator Phone" value={form.operatorPhone} onChange={v => patch({ operatorPhone: v })} placeholder="98765 00000" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 14 }}>
            <FS label="Status" value={form.status} onChange={v => patch({ status: v as "active" | "idle" | "maintenance" })} options={["active", "idle", "maintenance"]} />
            <FI label="Installed Year" value={form.installedYear} onChange={v => patch({ installedYear: v })} placeholder="2020" />
          </div>
          <Field label="Notes">
            <Textarea value={form.notes} onChange={e => patch({ notes: e.target.value })} rows={3} placeholder="Any notes..." />
          </Field>
          <div style={{ display: "flex", gap: 10 }}>
            <Button onClick={onClose} variant="secondary" size="lg" className="flex-1 h-[46px]">Cancel</Button>
            {/* On create the id is left blank — FactoryLoomPage posts to the API
                and keeps the id the backend assigns. It used to send
                `FL-${Date.now()}`, a client-invented id that was thrown away. */}
            <Button disabled={!valid} onClick={() => { onAdd({ id: editLoom?.id || "", ...form } as FactoryLoom); onClose(); }}
              variant="primary" size="lg" className="flex-[2] h-[46px]">
              {editLoom ? "Save Changes" : "Add Loom"}
            </Button>
          </div>
        </div>
    </Modal>
  );
}
