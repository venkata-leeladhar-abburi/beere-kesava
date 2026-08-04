import React, { useState } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { FactoryLoom } from "../../data/factoryLooms";
import { T, F, EASE } from "./theme";

// ── Form helpers ─────────────────────────────────────────────────────────────
function FI({ label, value, onChange, placeholder, required }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean }) {
  return (
    <div>
      <label style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.taupe, display: "block", marginBottom: 6 }}>
        {label}{required && <span style={{ color: T.crimson }}> *</span>}
      </label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", height: 44, borderRadius: 10, border: `1.5px solid ${T.borderDef}`, padding: "0 14px", fontFamily: F.ui, fontSize: 13, outline: "none", boxSizing: "border-box" as const }} />
    </div>
  );
}
function FS({ label, value, onChange, options, required }: { label: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean }) {
  return (
    <div>
      <label style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.taupe, display: "block", marginBottom: 6 }}>
        {label}{required && <span style={{ color: T.crimson }}> *</span>}
      </label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: "100%", height: 44, borderRadius: 10, border: `1.5px solid ${T.borderDef}`, padding: "0 14px", fontFamily: F.ui, fontSize: 13, outline: "none", boxSizing: "border-box" as const, appearance: "none" as const }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// ── Add / Edit Modal ──────────────────────────────────────────────────────────
export function AddLoomModal({ open, onClose, onAdd, editLoom }: {
  open: boolean; onClose: () => void; onAdd: (l: FactoryLoom) => void; editLoom?: FactoryLoom | null;
}) {
  const blank = { loomNumber: "", location: "", operatorName: "", operatorPhone: "", status: "active", installedYear: "", notes: "" };
  const [form, setForm] = useState<any>(blank);
  React.useEffect(() => { if (editLoom) { const { id, ...r } = editLoom; setForm(r); } else setForm(blank); }, [editLoom, open]);
  const patch = (p: any) => setForm((prev: any) => ({ ...prev, ...p }));
  const valid = form.loomNumber.trim() && form.operatorName.trim() && form.location.trim();
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 900, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(61,14,26,0.60)", backdropFilter: "blur(4px)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.28, ease: EASE }}
        style={{ background: "#FFF", borderRadius: 22, width: "min(560px, 96vw)", maxHeight: "90vh", overflowY: "auto" as const, boxShadow: "0 32px 80px rgba(61,14,26,0.30)" }}>
        <div style={{ background: `linear-gradient(110deg, ${T.darkBurgundy} 0%, #5A1A30 100%)`, padding: "22px 26px", borderTopLeftRadius: 22, borderTopRightRadius: 22, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#FFF" }}>{editLoom ? "Edit Factory Loom" : "Add Factory Loom"}</div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>Enter details for this loom</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 8, width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} color="#FFF" />
          </button>
        </div>
        <div style={{ padding: "24px 26px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
            <FI label="Loom Number / Name" value={form.loomNumber} onChange={v => patch({ loomNumber: v })} placeholder="e.g. Loom F-06" required />
          </div>
          <FI label="Location (Floor / Section)" value={form.location} onChange={v => patch({ location: v })} placeholder="e.g. Factory Floor A" required />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <FI label="Operator Name" value={form.operatorName} onChange={v => patch({ operatorName: v })} placeholder="Full name" required />
            <FI label="Operator Phone" value={form.operatorPhone} onChange={v => patch({ operatorPhone: v })} placeholder="98765 00000" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <FS label="Status" value={form.status} onChange={v => patch({ status: v })} options={["active", "idle", "maintenance"]} />
            <FI label="Installed Year" value={form.installedYear} onChange={v => patch({ installedYear: v })} placeholder="2020" />
          </div>
          <div>
            <label style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.taupe, display: "block", marginBottom: 6 }}>Notes</label>
            <textarea value={form.notes} onChange={e => patch({ notes: e.target.value })} rows={3} placeholder="Any notes..."
              style={{ width: "100%", borderRadius: 10, border: `1.5px solid ${T.borderDef}`, padding: "10px 14px", fontFamily: F.ui, fontSize: 13, outline: "none", resize: "vertical" as const, boxSizing: "border-box" as const }} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, height: 46, borderRadius: 12, border: `1.5px solid ${T.borderDef}`, background: "transparent", fontFamily: F.ui, fontWeight: 600, fontSize: 14, color: T.luxuryBrown, cursor: "pointer" }}>Cancel</button>
            <motion.button disabled={!valid} onClick={() => { onAdd({ id: editLoom?.id || `FL-${Date.now()}`, ...form } as FactoryLoom); onClose(); }}
              whileHover={{ scale: valid ? 1.02 : 1 }} whileTap={{ scale: 0.98 }}
              style={{ flex: 2, height: 46, borderRadius: 12, border: "none", background: valid ? T.royalBurgundy : "#C0C0C0", color: "#FFF", fontFamily: F.ui, fontWeight: 700, fontSize: 14, cursor: valid ? "pointer" : "not-allowed" }}>
              {editLoom ? "Save Changes" : "Add Loom"}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
