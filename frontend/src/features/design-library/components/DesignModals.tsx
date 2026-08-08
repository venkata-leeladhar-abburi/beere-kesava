import { useState } from "react";
import {
  Image as ImageSquare, Workflow as Graph, Save as FloppyDisk, AlertCircle as WarningCircle,
} from "lucide-react";
import { DesignEntry } from "../contexts/DesignLibraryContext";
import { T, F } from "./theme";
import { WeaverCombobox, UploadZone, labelStyle } from "./DesignLibraryComponents";
import { Button, Input, Textarea, Select, SelectItem } from "../../../shared/ui/primitives";
import { Modal } from "../../../shared/ui/overlay";

const SAREE_TYPES = [
  { code: "HZ-003", name: "Heavy Zari" },
  { code: "SB-001", name: "Self Brocade" },
  { code: "PS-002", name: "Plain Silk" },
  { code: "BS-004", name: "Bridal Special" },
  { code: "LC-005", name: "Light Cotton" },
];

function emptyForm(): Partial<DesignEntry> {
  return { code: "", name: "", typeCode: "HZ-003", typeName: "Heavy Zari", desc: "", color: "", weaverName: "", notesForWeaver: "", colorSlipPhoto: null, designGraph: null };
}

export function AddDesignModal({ onClose, onSave }: { onClose: () => void; onSave: (d: DesignEntry) => void }) {
  const [form, setForm] = useState<Partial<DesignEntry>>(emptyForm());
  const set = (k: keyof DesignEntry, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  function handleSave() {
    if (!form.code?.trim()) return;
    const type = SAREE_TYPES.find(t => t.code === form.typeCode);
    onSave({
      code: form.code!.trim(),
      name: form.name?.trim() || "",
      typeCode: form.typeCode || "",
      typeName: type?.name || form.typeName || "",
      desc: form.desc?.trim() || "",
      color: form.color?.trim() || "",
      weaverName: form.weaverName?.trim() || "",
      notesForWeaver: form.notesForWeaver?.trim() || "",
      colorSlipPhoto: form.colorSlipPhoto ?? null,
      designGraph: form.designGraph ?? null,
      batches: 0,
      total: 0,
      hasColorSlip: !!form.colorSlipPhoto,
      hasGraph: !!form.designGraph,
    });
  }

  return (
    <Modal open onOpenChange={o => !o && onClose()} size="md">
      <Modal.Header title="Add New Design Code" />
      <Modal.Body>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 4, paddingBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Design Code <span style={{ color: T.royalBurgundy }}>*</span></label>
              <Input value={form.code ?? ""} onChange={e => set("code", e.target.value)} placeholder="e.g. BKB-047" />
            </div>
            <div>
              <label style={labelStyle} htmlFor="saree-type">Saree Type</label>
              <Select value={form.typeCode} onValueChange={v => { const t = SAREE_TYPES.find(x => x.code === v); set("typeCode", v); set("typeName", t?.name ?? ""); }}>
                {SAREE_TYPES.map(t => <SelectItem key={t.code} value={t.code}>{t.code} · {t.name}</SelectItem>)}
              </Select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Colour <span style={{ fontWeight: 400, color: T.taupe }}>(optional)</span></label>
            <Input value={form.color ?? ""} onChange={e => set("color", e.target.value)} placeholder="e.g. Maroon, Cream, Indigo" />
          </div>

          <div>
            <label style={labelStyle}>Weaver Name <span style={{ fontWeight: 400, color: T.taupe }}>(optional)</span></label>
            <WeaverCombobox value={form.weaverName ?? ""} onChange={v => set("weaverName", v)} />
          </div>

          <div>
            <label style={labelStyle}>Notes for Weaver <span style={{ fontWeight: 400, color: T.taupe }}>(optional)</span></label>
            <Textarea value={form.notesForWeaver ?? ""} onChange={e => set("notesForWeaver", e.target.value)} rows={2} placeholder="Special instructions for the weaver…" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <UploadZone label="Color Slip Photo (optional)" hint="Clear photo of the color slip" icon={ImageSquare}
              preview={form.colorSlipPhoto ?? null} onFile={url => set("colorSlipPhoto", url)} />
            <UploadZone label="Design Graph (optional)" hint="Upload graph if available" icon={Graph}
              preview={form.designGraph ?? null} onFile={url => set("designGraph", url)} />
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "rgba(200,155,71,0.09)", border: "1px solid rgba(200,155,71,0.28)", borderRadius: 10, padding: "11px 14px" }}>
            <WarningCircle size={16} color={T.antiqueGold} style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontFamily: F.ui, fontSize: 12, color: "#8B6018", lineHeight: 1.5 }}>
              Only Design Code is required — all other fields can be filled in later. The new code will be saved to the master Design Library immediately.
            </span>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={onClose} variant="secondary" size="lg" className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!form.code?.trim()} variant="primary" size="lg" className="flex-[2]" iconLeft={FloppyDisk}>
          Save Design Code
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export function SlipModal({ design, onClose, onSave }: { design: DesignEntry; onClose: () => void; onSave: (slip: string | null, graph: string | null) => void }) {
  const [slip, setSlip] = useState<string | null>(design.colorSlipPhoto);
  const [graph, setGraph] = useState<string | null>(design.designGraph);
  return (
    <Modal open onOpenChange={o => !o && onClose()} size="sm">
      <Modal.Header
        title={design.hasColorSlip ? "Update Color Slip" : "Upload Color Slip"}
        subtitle={design.code}
      />
      <Modal.Body>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 4, paddingBottom: 20 }}>
          <UploadZone label="Color Slip Photo" hint="Clear photo of the color slip" icon={ImageSquare} preview={slip} onFile={setSlip} />
          <UploadZone label="Design Graph (optional)" hint="Upload design graph image" icon={Graph} preview={graph} onFile={setGraph} />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={onClose} variant="secondary" size="lg" className="flex-1">
          Cancel
        </Button>
        <Button onClick={() => onSave(slip, graph)} variant="primary" size="lg" className="flex-[2]" iconLeft={FloppyDisk}>
          {design.hasColorSlip ? "Update Slip" : "Upload Slip"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
