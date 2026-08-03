import React, { useState } from "react";
import { motion } from "motion/react";
import {
  ImageSquare, Graph, FloppyDisk, WarningCircle, X as PhX,
} from "@phosphor-icons/react";
import { DesignEntry } from "../contexts/DesignLibraryContext";
import { T, F, G } from "./theme";
import { WeaverCombobox, UploadZone, fieldStyle, labelStyle } from "./DesignLibraryComponents";

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
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(30,10,20,0.55)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
      <motion.div onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.22 }}
        style={{ background: T.warmIvory, borderRadius: 20, width: 560, maxWidth: "calc(100vw - 48px)", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(44,6,27,0.28)", border: `1px solid ${T.borderDef}` }}
      >
        <div style={{ padding: "22px 24px 18px", borderBottom: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: T.luxuryBrown }}>Add New Design Code</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.taupe, display: "flex" }}><PhX size={18} /></button>
        </div>

        <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Design Code <span style={{ color: T.royalBurgundy }}>*</span></label>
              <input value={form.code ?? ""} onChange={e => set("code", e.target.value)} style={fieldStyle} placeholder="e.g. BKB-047" />
            </div>
            <div>
              <label style={labelStyle} htmlFor="saree-type">Saree Type</label>
              <select id="saree-type" value={form.typeCode} onChange={e => { const t = SAREE_TYPES.find(x => x.code === e.target.value); set("typeCode", e.target.value); set("typeName", t?.name ?? ""); }} style={{ ...fieldStyle, cursor: "pointer" }}>
                {SAREE_TYPES.map(t => <option key={t.code} value={t.code}>{t.code} · {t.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Colour <span style={{ fontWeight: 400, color: T.taupe }}>(optional)</span></label>
            <input value={form.color ?? ""} onChange={e => set("color", e.target.value)} style={fieldStyle} placeholder="e.g. Maroon, Cream, Indigo" />
          </div>

          <div>
            <label style={labelStyle}>Weaver Name <span style={{ fontWeight: 400, color: T.taupe }}>(optional)</span></label>
            <WeaverCombobox value={form.weaverName ?? ""} onChange={v => set("weaverName", v)} />
          </div>

          <div>
            <label style={labelStyle}>Notes for Weaver <span style={{ fontWeight: 400, color: T.taupe }}>(optional)</span></label>
            <textarea value={form.notesForWeaver ?? ""} onChange={e => set("notesForWeaver", e.target.value)} rows={2} placeholder="Special instructions for the weaver…"
              style={{ width: "100%", padding: "12px 14px", fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, background: T.warmIvory, border: `1.5px solid ${T.borderDef}`, borderRadius: 10, outline: "none", resize: "none", lineHeight: 1.6, boxSizing: "border-box" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <UploadZone label="Color Slip Photo (optional)" hint="Clear photo of the color slip" icon={ImageSquare}
              preview={form.colorSlipPhoto ?? null} onFile={url => set("colorSlipPhoto", url)} />
            <UploadZone label="Design Graph (optional)" hint="Upload graph if available" icon={Graph}
              preview={form.designGraph ?? null} onFile={url => set("designGraph", url)} />
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "rgba(200,155,71,0.09)", border: "1px solid rgba(200,155,71,0.28)", borderRadius: 10, padding: "11px 14px" }}>
            <WarningCircle size={16} color={T.antiqueGold} weight="fill" style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontFamily: F.ui, fontSize: 12.5, color: "#8B6018", lineHeight: 1.5 }}>
              Only Design Code is required — all other fields can be filled in later. The new code will be saved to the master Design Library immediately.
            </span>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <motion.button onClick={handleSave} disabled={!form.code?.trim()}
              whileHover={form.code?.trim() ? { scale: 1.02, backgroundColor: T.deepWine } : undefined} whileTap={form.code?.trim() ? { scale: 0.97 } : undefined}
              style={{ flex: 2, height: 46, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: form.code?.trim() ? T.royalBurgundy : T.taupe, color: "#FFFDF9", border: "none", borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: form.code?.trim() ? "pointer" : "not-allowed", opacity: form.code?.trim() ? 1 : 0.55 }}>
              <FloppyDisk size={17} color="#FFFDF9" weight="bold" /> Save Design Code
            </motion.button>
            <motion.button onClick={onClose} whileHover={{ scale: 1.02 }}
              style={{ flex: 1, height: 46, background: "transparent", border: `1.5px solid ${T.borderDef}`, borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.taupe, cursor: "pointer" }}>
              Cancel
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function SlipModal({ design, onClose, onSave }: { design: DesignEntry; onClose: () => void; onSave: (slip: string | null, graph: string | null) => void }) {
  const [slip, setSlip] = useState<string | null>(design.colorSlipPhoto);
  const [graph, setGraph] = useState<string | null>(design.designGraph);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(30,10,20,0.55)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
      <motion.div onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.22 }}
        style={{ background: T.warmIvory, borderRadius: 20, width: 480, maxWidth: "calc(100vw - 48px)", boxShadow: "0 24px 80px rgba(44,6,27,0.28)", border: `1px solid ${T.borderDef}` }}
      >
        <div style={{ padding: "22px 24px 18px", borderBottom: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, fontWeight: 700, marginBottom: 2 }}>{design.code}</div>
            <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>{design.hasColorSlip ? "Update Color Slip" : "Upload Color Slip"}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.taupe }}><PhX size={18} /></button>
        </div>
        <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <UploadZone label="Color Slip Photo" hint="Clear photo of the color slip" icon={ImageSquare} preview={slip} onFile={setSlip} />
          <UploadZone label="Design Graph (optional)" hint="Upload design graph image" icon={Graph} preview={graph} onFile={setGraph} />
          <div style={{ display: "flex", gap: 10 }}>
            <motion.button onClick={() => onSave(slip, graph)} whileHover={{ scale: 1.02, backgroundColor: T.deepWine }} whileTap={{ scale: 0.97 }}
              style={{ flex: 2, height: 46, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: T.royalBurgundy, color: "#FFFDF9", border: "none", borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              <FloppyDisk size={17} color="#FFFDF9" weight="bold" /> {design.hasColorSlip ? "Update Slip" : "Upload Slip"}
            </motion.button>
            <motion.button onClick={onClose} whileHover={{ scale: 1.02 }}
              style={{ flex: 1, height: 46, background: "transparent", border: `1.5px solid ${T.borderDef}`, borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.taupe, cursor: "pointer" }}>
              Cancel
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
