import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus, Search, X, Edit2,
  LayoutGrid, LayoutList, CheckCircle2, Clock, AlertTriangle,
  ArrowLeft, FileText, Factory, Package, Layers, Sparkles,
} from "lucide-react";

// ── Design Tokens ───────────────────────────────────────────────────────────
const T = {
  silkCream:     "#F7F2EA",
  warmIvory:     "#FFFDF9",
  royalBurgundy: "#6E0F2D",
  deepWine:      "#4A061B",
  darkBurgundy:  "#3D0E1A",
  antiqueGold:   "#C89B47",
  goldLight:     "#E7C983",
  luxuryBrown:   "#3B2314",
  warmCream:     "#F5E8D0",
  taupe:         "#8B7060",
  crimson:       "#C0392B",
  green:         "#1E6640",
  borderDef:     "rgba(110,15,45,0.10)",
  borderGold:    "rgba(200,155,71,0.22)",
};
const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ── Types ────────────────────────────────────────────────────────────────────
interface FactoryLoom {
  id: string; loomNumber: string;
  location: string; operatorName: string; operatorPhone: string;
  status: "active" | "idle" | "maintenance";
  installedYear: string; notes: string;
}
interface LoomBatch {
  batchId: string; loomId: string; sareeCount: number; completedCount: number;
  dueDate: string; designCode: string; designName: string; orderRef: string;
  status: "active" | "completed" | "draft"; startDate: string;
}
interface LoomMaterial {
  batchId: string; loomId: string; mirId: string; date: string;
  materialType: "Warp" | "Resham" | "Jari"; description: string;
  quantity: number; unit: string; grnBatch: string; issuedBy: string;
}
interface LoomSaree {
  sareeId: string; loomId: string; batchId: string; sareeType: string;
  status: "complete" | "in-progress" | "pending";
  completedDate?: string; qualityStatus?: "pass" | "fail" | "pending";
}

// ── Data ─────────────────────────────────────────────────────────────────────
const INITIAL_LOOMS: FactoryLoom[] = [
  { id: "FL-001", loomNumber: "Loom F-01", location: "Factory Floor A", operatorName: "Srinivas Kumar", operatorPhone: "98765 11001", status: "active", installedYear: "2018", notes: "Main production loom for premium sarees" },
  { id: "FL-002", loomNumber: "Loom F-02", location: "Factory Floor A", operatorName: "Mahesh Reddy", operatorPhone: "87654 22002", status: "active", installedYear: "2020", notes: "Dobby specialised for border patterns" },
  { id: "FL-003", loomNumber: "Loom F-03", location: "Factory Floor B", operatorName: "Ramesh Naidu", operatorPhone: "76543 33003", status: "idle", installedYear: "2019", notes: "Currently awaiting new batch assignment" },
  { id: "FL-004", loomNumber: "Loom F-04", location: "Factory Floor B", operatorName: "Suresh Babu", operatorPhone: "65432 44004", status: "maintenance", installedYear: "2015", notes: "Scheduled maintenance — resume in 3 days" },
  { id: "FL-005", loomNumber: "Loom F-05", location: "Factory Floor C", operatorName: "Venkateswara Rao", operatorPhone: "54321 55005", status: "active", installedYear: "2022", notes: "New high-speed loom" },
];
const SAMPLE_BATCHES: LoomBatch[] = [
  { batchId: "BATCH-094", loomId: "FL-001", sareeCount: 10, completedCount: 7, dueDate: "20 Jul 2026", designCode: "DS-019", designName: "Grand Kanjivaram Pallu", orderRef: "Lakshmi Silks · ORD-041", status: "active", startDate: "01 Jul 2026" },
  { batchId: "BATCH-088", loomId: "FL-001", sareeCount: 12, completedCount: 12, dueDate: "05 Jul 2026", designCode: "DS-015", designName: "Classic Zari Border", orderRef: "Padma Stores · ORD-038", status: "completed", startDate: "20 Jun 2026" },
  { batchId: "BATCH-091", loomId: "FL-002", sareeCount: 8, completedCount: 3, dueDate: "25 Jul 2026", designCode: "DS-021", designName: "Peacock Motif Dobby", orderRef: "Annapurna Silks · ORD-043", status: "active", startDate: "05 Jul 2026" },
  { batchId: "BATCH-085", loomId: "FL-002", sareeCount: 6, completedCount: 6, dueDate: "28 Jun 2026", designCode: "DS-012", designName: "Temple Border Series", orderRef: "Rajam Silks · ORD-035", status: "completed", startDate: "10 Jun 2026" },
  { batchId: "BATCH-092", loomId: "FL-003", sareeCount: 10, completedCount: 0, dueDate: "30 Jul 2026", designCode: "DS-022", designName: "Royal Blue Brocade", orderRef: "N/A", status: "draft", startDate: "—" },
  { batchId: "BATCH-095", loomId: "FL-005", sareeCount: 14, completedCount: 5, dueDate: "01 Aug 2026", designCode: "DS-025", designName: "Silk Elegance Collection", orderRef: "Star Boutique · ORD-047", status: "active", startDate: "10 Jul 2026" },
];
const SAMPLE_MATERIALS: LoomMaterial[] = [
  { batchId: "BATCH-094", loomId: "FL-001", mirId: "MIR-2026-041", date: "01 Jul 2026", materialType: "Warp", description: "Cotton/Silk blend warp", quantity: 4.5, unit: "kg", grnBatch: "GRN-2026-JUN-001", issuedBy: "Admin (Kesava Rao)" },
  { batchId: "BATCH-094", loomId: "FL-001", mirId: "MIR-2026-041", date: "01 Jul 2026", materialType: "Resham", description: "Red Resham", quantity: 0.8, unit: "kg", grnBatch: "GRN-2026-JUN-002", issuedBy: "Admin (Kesava Rao)" },
  { batchId: "BATCH-094", loomId: "FL-001", mirId: "MIR-2026-043", date: "05 Jul 2026", materialType: "Jari", description: "Polyester 2G Gold", quantity: 8, unit: "Reels", grnBatch: "GRN-2026-JUN-003", issuedBy: "Admin (Kesava Rao)" },
  { batchId: "BATCH-088", loomId: "FL-001", mirId: "MIR-2026-028", date: "20 Jun 2026", materialType: "Warp", description: "Pure Silk Warp", quantity: 6.0, unit: "kg", grnBatch: "GRN-2026-MAY-006", issuedBy: "Admin (Kesava Rao)" },
  { batchId: "BATCH-091", loomId: "FL-002", mirId: "MIR-2026-044", date: "06 Jul 2026", materialType: "Jari", description: "Gold 1G Polyester", quantity: 4, unit: "Buns", grnBatch: "GRN-2026-MAY-014", issuedBy: "Admin (Kesava Rao)" },
  { batchId: "BATCH-091", loomId: "FL-002", mirId: "MIR-2026-044", date: "06 Jul 2026", materialType: "Warp", description: "Resham Warp blend", quantity: 3.5, unit: "kg", grnBatch: "GRN-2026-JUN-001", issuedBy: "Admin (Kesava Rao)" },
  { batchId: "BATCH-095", loomId: "FL-005", mirId: "MIR-2026-048", date: "10 Jul 2026", materialType: "Warp", description: "Silk warp — premium", quantity: 8.0, unit: "kg", grnBatch: "GRN-2026-JUN-001", issuedBy: "Admin (Kesava Rao)" },
  { batchId: "BATCH-095", loomId: "FL-005", mirId: "MIR-2026-048", date: "10 Jul 2026", materialType: "Jari", description: "5G Gold Silk fast", quantity: 6, unit: "Buns", grnBatch: "GRN-2026-JUN-003", issuedBy: "Admin (Kesava Rao)" },
];
const SAMPLE_SAREES: LoomSaree[] = [
  { sareeId: "FL001-L1-001", loomId: "FL-001", batchId: "BATCH-094", sareeType: "SB-001", status: "complete", completedDate: "06 Jul 2026", qualityStatus: "pass" },
  { sareeId: "FL001-L1-002", loomId: "FL-001", batchId: "BATCH-094", sareeType: "SB-001", status: "complete", completedDate: "07 Jul 2026", qualityStatus: "pass" },
  { sareeId: "FL001-L1-003", loomId: "FL-001", batchId: "BATCH-094", sareeType: "SB-001", status: "complete", completedDate: "08 Jul 2026", qualityStatus: "fail" },
  { sareeId: "FL001-L1-004", loomId: "FL-001", batchId: "BATCH-094", sareeType: "SB-001", status: "complete", completedDate: "09 Jul 2026", qualityStatus: "pass" },
  { sareeId: "FL001-L1-005", loomId: "FL-001", batchId: "BATCH-094", sareeType: "SB-001", status: "in-progress" },
  { sareeId: "FL001-L1-006", loomId: "FL-001", batchId: "BATCH-094", sareeType: "SB-001", status: "in-progress" },
  { sareeId: "FL001-L1-007", loomId: "FL-001", batchId: "BATCH-094", sareeType: "SB-001", status: "pending" },
  { sareeId: "FL002-L1-001", loomId: "FL-002", batchId: "BATCH-091", sareeType: "SB-002", status: "complete", completedDate: "10 Jul 2026", qualityStatus: "pass" },
  { sareeId: "FL002-L1-002", loomId: "FL-002", batchId: "BATCH-091", sareeType: "SB-002", status: "complete", completedDate: "12 Jul 2026", qualityStatus: "pass" },
  { sareeId: "FL002-L1-003", loomId: "FL-002", batchId: "BATCH-091", sareeType: "SB-002", status: "in-progress" },
  { sareeId: "FL005-L1-001", loomId: "FL-005", batchId: "BATCH-095", sareeType: "SB-003", status: "complete", completedDate: "14 Jul 2026", qualityStatus: "pass" },
  { sareeId: "FL005-L1-002", loomId: "FL-005", batchId: "BATCH-095", sareeType: "SB-003", status: "complete", completedDate: "15 Jul 2026", qualityStatus: "pass" },
  { sareeId: "FL005-L1-003", loomId: "FL-005", batchId: "BATCH-095", sareeType: "SB-003", status: "in-progress" },
];

// ── Exported list for use in other pages ─────────────────────────────────────
export const FACTORY_LOOMS_LIST: FactoryLoom[] = INITIAL_LOOMS;

// ── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  active:      { label: "Active",      color: T.green,       bg: "rgba(30,102,64,0.10)",  icon: React.createElement(CheckCircle2, { size: 12 }) },
  idle:        { label: "Idle",        color: T.antiqueGold, bg: "rgba(200,155,71,0.12)", icon: React.createElement(Clock, { size: 12 }) },
  maintenance: { label: "Maintenance", color: T.crimson,     bg: "rgba(192,57,43,0.10)",  icon: React.createElement(AlertTriangle, { size: 12 }) },
};
const BATCH_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  active:    { label: "Active",    color: T.royalBurgundy, bg: "rgba(110,15,45,0.08)" },
  completed: { label: "Completed", color: T.green,         bg: "rgba(30,102,64,0.10)" },
  draft:     { label: "Draft",     color: T.taupe,         bg: "rgba(139,112,96,0.08)" },
};
const MAT_TAG: Record<string, { col: string; bg: string }> = {
  Warp:   { col: T.royalBurgundy, bg: "rgba(110,15,45,0.08)" },
  Resham: { col: "#7A5E1C",       bg: "rgba(200,155,71,0.12)" },
  Jari:   { col: "#1E5E40",       bg: "rgba(30,102,64,0.10)" },
};

function FadeUp({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.42, delay, ease: EASE }} style={style}>
      {children}
    </motion.div>
  );
}

// ── Form helpers ─────────────────────────────────────────────────────────────
function FI({ label, value, onChange, placeholder, required }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean }) {
  return (
    <div>
      <label style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12.5, color: T.taupe, display: "block", marginBottom: 6 }}>
        {label}{required && <span style={{ color: T.crimson }}> *</span>}
      </label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", height: 44, borderRadius: 10, border: `1.5px solid ${T.borderDef}`, padding: "0 14px", fontFamily: F.ui, fontSize: 13.5, outline: "none", boxSizing: "border-box" as const }} />
    </div>
  );
}
function FS({ label, value, onChange, options, required }: { label: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean }) {
  return (
    <div>
      <label style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12.5, color: T.taupe, display: "block", marginBottom: 6 }}>
        {label}{required && <span style={{ color: T.crimson }}> *</span>}
      </label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: "100%", height: 44, borderRadius: 10, border: `1.5px solid ${T.borderDef}`, padding: "0 14px", fontFamily: F.ui, fontSize: 13.5, outline: "none", boxSizing: "border-box" as const, appearance: "none" as const }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// ── Add / Edit Modal ──────────────────────────────────────────────────────────
function AddLoomModal({ open, onClose, onAdd, editLoom }: {
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
            <div style={{ fontFamily: F.ui, fontSize: 12.5, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>Enter details for this loom</div>
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
            <label style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12.5, color: T.taupe, display: "block", marginBottom: 6 }}>Notes</label>
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

// ── Loom Detail Page ──────────────────────────────────────────────────────────
function LoomDetailPage({ loom, batches, materials, sarees, onBack, onEdit }: {
  loom: FactoryLoom; batches: LoomBatch[]; materials: LoomMaterial[]; sarees: LoomSaree[];
  onBack: () => void; onEdit: (l: FactoryLoom) => void;
}) {
  const [tab, setTab] = useState<"overview"|"batches"|"materials"|"sarees">("overview");
  const sc = STATUS_CFG[loom.status];
  const lb = batches.filter(b => b.loomId === loom.id);
  const lm = materials.filter(m => m.loomId === loom.id);
  const ls = sarees.filter(s => s.loomId === loom.id);
  const done = ls.filter(s => s.status === "complete").length;
  const TH: React.CSSProperties = { fontFamily: F.mono, fontSize: 11, fontWeight: 500, color: T.taupe, letterSpacing: "1.4px", textTransform: "uppercase" as const, padding: "12px 16px", textAlign: "left" as const, borderBottom: `1px solid ${T.borderDef}`, background: T.silkCream, whiteSpace: "nowrap" as const };
  const TD: React.CSSProperties = { padding: "13px 16px", borderBottom: "1px solid rgba(110,15,45,0.05)", verticalAlign: "middle" as const, fontFamily: F.ui, fontSize: 13.5, color: T.luxuryBrown };
  const TABS = [{ k: "overview", l: "Overview" }, { k: "batches", l: `Batches (${lb.length})` }, { k: "materials", l: `Materials (${lm.length})` }, { k: "sarees", l: `Sarees (${ls.length})` }];

  return (
    <div style={{ fontFamily: F.ui, background: T.silkCream, minHeight: "100vh" }}>
      <div style={{ background: T.darkBurgundy, position: "relative" as const, overflow: "hidden", minHeight: 180, display: "flex", alignItems: "stretch" }}>
        <div style={{ flex: 1, padding: "36px 56px", zIndex: 10, position: "relative" as const }}>
          <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.10)", border: "none", borderRadius: 9, padding: "7px 14px", color: "rgba(255,255,255,0.80)", fontFamily: F.ui, fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 20 }}>
            <ArrowLeft size={14} /> Back to Factory Looms
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 60, height: 60, borderRadius: 16, background: T.royalBurgundy, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Factory size={28} color="#FFF" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                <h1 style={{ fontFamily: F.display, fontWeight: 700, fontSize: 32, color: "#FFF", margin: 0 }}>{loom.loomNumber}</h1>
                <span style={{ background: sc.bg, color: sc.color, borderRadius: 999, padding: "4px 12px", fontFamily: F.ui, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>{sc.icon}{sc.label}</span>
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 13.5, color: "rgba(255,255,255,0.65)" }}>{loom.location} · Operator: {loom.operatorName}</div>
            </div>
            <motion.button onClick={() => onEdit(loom)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.22)", borderRadius: 10, padding: "9px 18px", color: "#FFF", fontFamily: F.ui, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <Edit2 size={14} /> Edit Details
            </motion.button>
          </div>
        </div>
        {[320, 460].map((sz, i) => <div key={i} style={{ position: "absolute" as const, right: -sz * 0.3, bottom: -sz * 0.4, width: sz, height: sz, borderRadius: "50%", border: `1px solid rgba(200,155,71,${0.10 - i * 0.03})`, pointerEvents: "none" as const }} />)}
      </div>

      {/* Tabs */}
      <div style={{ background: "#FFF", borderBottom: `1px solid ${T.borderDef}`, padding: "0 56px", display: "flex", gap: 4 }}>
        {TABS.map(t => <button key={t.k} onClick={() => setTab(t.k as any)} style={{ padding: "14px 20px", border: "none", borderBottom: `2.5px solid ${tab === t.k ? T.royalBurgundy : "transparent"}`, background: "transparent", cursor: "pointer", fontFamily: F.ui, fontSize: 13.5, fontWeight: tab === t.k ? 700 : 500, color: tab === t.k ? T.royalBurgundy : T.taupe, transition: "all 0.18s" }}>{t.l}</button>)}
      </div>

      <div style={{ padding: "36px 56px 80px", maxWidth: 1280, margin: "0 auto" }}>
        {tab === "overview" && (
          <FadeUp>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18, marginBottom: 24 }}>
              {[
                { label: "Active Batches",   v: lb.filter(b => b.status === "active").length, icon: React.createElement(Layers, { size: 20, color: T.royalBurgundy }) },
                { label: "Total Batches",    v: lb.length, icon: React.createElement(Package, { size: 20, color: T.antiqueGold }) },
                { label: "Sarees Produced",  v: `${done}/${ls.length}`, icon: React.createElement(CheckCircle2, { size: 20, color: T.green }) },
                { label: "Materials Issued", v: lm.length, icon: React.createElement(Sparkles, { size: 20, color: T.royalBurgundy }) },
              ].map(s => (
                <div key={s.label} style={{ background: "#FFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: "18px 20px", boxShadow: "0 2px 12px rgba(44,24,16,0.06)", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: T.silkCream, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.icon}</div>
                  <div>
                    <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 22, color: T.luxuryBrown }}>{s.v}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 3 }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: "#FFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, padding: "24px 26px", boxShadow: "0 2px 14px rgba(44,24,16,0.06)", marginBottom: 20 }}>
              <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 17, color: T.luxuryBrown, marginBottom: 20 }}>Loom Details</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
                {[{ l: "Loom Number", v: loom.loomNumber }, { l: "Location", v: loom.location }, { l: "Status", v: loom.status.charAt(0).toUpperCase() + loom.status.slice(1) }, { l: "Installed Year", v: loom.installedYear || "—" }, { l: "Operator Name", v: loom.operatorName }, { l: "Operator Phone", v: loom.operatorPhone || "—" }, { l: "Notes", v: loom.notes || "—" }].map(f => (
                  <div key={f.l}><div style={{ fontFamily: F.mono, fontSize: 10.5, color: T.taupe, letterSpacing: "1.4px", textTransform: "uppercase" as const, marginBottom: 4 }}>{f.l}</div><div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>{f.v}</div></div>
                ))}
              </div>
            </div>
            {lb.filter(b => b.status === "active").length > 0 && (
              <div style={{ background: "#FFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, padding: "20px 22px", boxShadow: "0 2px 14px rgba(44,24,16,0.06)" }}>
                <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 17, color: T.luxuryBrown, marginBottom: 14 }}>Currently Running Batches</div>
                {lb.filter(b => b.status === "active").map(b => (
                  <div key={b.batchId} style={{ background: T.silkCream, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
                    <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", padding: "4px 10px", borderRadius: 7 }}>{b.batchId}</div>
                    <div style={{ flex: 1 }}><div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 13.5, color: T.luxuryBrown }}>{b.designName}</div><div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{b.orderRef} · Due: {b.dueDate}</div></div>
                    <div style={{ textAlign: "right" as const }}><div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: T.royalBurgundy }}>{b.completedCount}/{b.sareeCount}</div><div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>sarees done</div></div>
                    <div style={{ width: 80, height: 6, borderRadius: 99, background: T.borderDef }}><div style={{ width: `${(b.completedCount / b.sareeCount) * 100}%`, height: "100%", borderRadius: 99, background: T.royalBurgundy }} /></div>
                  </div>
                ))}
              </div>
            )}
          </FadeUp>
        )}

        {tab === "batches" && (
          <FadeUp>
            <div style={{ background: "#FFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, boxShadow: "0 2px 14px rgba(44,24,16,0.06)", overflow: "hidden" }}>
              <div style={{ padding: "18px 22px", borderBottom: `1px solid ${T.borderDef}` }}><div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 17, color: T.luxuryBrown }}>Batches — {loom.loomNumber}</div></div>
              {lb.length === 0 ? <div style={{ padding: 40, textAlign: "center" as const, color: T.taupe }}>No batches yet</div> : (
                <div style={{ overflowX: "auto" as const }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr>{["Batch ID","Design","Order Ref","Sarees","Progress","Start","Due","Status"].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                    <tbody>
                      {lb.map((b, i) => {
                        const s = BATCH_STATUS[b.status];
                        const pct = b.sareeCount > 0 ? Math.round((b.completedCount / b.sareeCount) * 100) : 0;
                        return (
                          <tr key={b.batchId} style={{ background: i % 2 === 0 ? "#FFF" : T.warmIvory }}>
                            <td style={{ ...TD, fontFamily: F.mono, color: T.royalBurgundy, fontWeight: 700 }}>{b.batchId}</td>
                            <td style={TD}><div style={{ fontWeight: 700 }}>{b.designName}</div><div style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>{b.designCode}</div></td>
                            <td style={{ ...TD, fontSize: 12.5, color: T.taupe }}>{b.orderRef}</td>
                            <td style={{ ...TD, textAlign: "center" as const, fontWeight: 700 }}>{b.completedCount}/{b.sareeCount}</td>
                            <td style={TD}><div style={{ width: 80, height: 5, borderRadius: 99, background: T.borderDef }}><div style={{ width: `${pct}%`, height: "100%", borderRadius: 99, background: T.royalBurgundy }} /></div><div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, marginTop: 2 }}>{pct}%</div></td>
                            <td style={{ ...TD, fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{b.startDate}</td>
                            <td style={{ ...TD, fontFamily: F.mono, fontSize: 12 }}>{b.dueDate}</td>
                            <td style={TD}><span style={{ background: s.bg, color: s.color, borderRadius: 7, padding: "4px 10px", fontFamily: F.ui, fontSize: 12, fontWeight: 600 }}>{s.label}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </FadeUp>
        )}

        {tab === "materials" && (
          <FadeUp>
            <div style={{ background: "#FFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, boxShadow: "0 2px 14px rgba(44,24,16,0.06)", overflow: "hidden" }}>
              <div style={{ padding: "18px 22px", borderBottom: `1px solid ${T.borderDef}` }}><div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 17, color: T.luxuryBrown }}>Materials Received — {loom.loomNumber}</div></div>
              {lm.length === 0 ? <div style={{ padding: 40, textAlign: "center" as const, color: T.taupe }}>No materials yet</div> : (
                <div style={{ overflowX: "auto" as const }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr>{["MIR ID","Batch","Date","Material","Description","Qty","GRN Batch","Issued By"].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                    <tbody>
                      {lm.map((m, i) => {
                        const mt = MAT_TAG[m.materialType];
                        return (
                          <tr key={`${m.mirId}-${i}`} style={{ background: i % 2 === 0 ? "#FFF" : T.warmIvory }}>
                            <td style={{ ...TD, fontFamily: F.mono, color: T.royalBurgundy, fontWeight: 700, fontSize: 12 }}>{m.mirId}</td>
                            <td style={{ ...TD, fontFamily: F.mono, fontSize: 12, color: T.antiqueGold, fontWeight: 700 }}>{m.batchId}</td>
                            <td style={{ ...TD, fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{m.date}</td>
                            <td style={TD}><span style={{ background: mt.bg, color: mt.col, borderRadius: 7, padding: "3px 9px", fontFamily: F.mono, fontSize: 11, fontWeight: 600 }}>{m.materialType}</span></td>
                            <td style={{ ...TD, fontSize: 13 }}>{m.description}</td>
                            <td style={{ ...TD, fontFamily: F.mono, fontWeight: 700 }}>{m.quantity} {m.unit}</td>
                            <td style={{ ...TD, fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy }}>{m.grnBatch}</td>
                            <td style={{ ...TD, fontSize: 12.5, color: T.taupe }}>{m.issuedBy}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </FadeUp>
        )}

        {tab === "sarees" && (
          <FadeUp>
            <div style={{ background: "#FFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, boxShadow: "0 2px 14px rgba(44,24,16,0.06)", overflow: "hidden" }}>
              <div style={{ padding: "18px 22px", borderBottom: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div><div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 17, color: T.luxuryBrown }}>Sarees — {loom.loomNumber}</div><div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: 4 }}>{done} completed · {ls.length - done} remaining</div></div>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: F.ui, fontSize: 12.5, color: T.green, background: "rgba(30,102,64,0.10)", borderRadius: 8, padding: "4px 12px" }}><CheckCircle2 size={13} />{done} done</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: F.ui, fontSize: 12.5, color: T.antiqueGold, background: "rgba(200,155,71,0.12)", borderRadius: 8, padding: "4px 12px" }}><Clock size={13} />{ls.length - done} remaining</div>
                </div>
              </div>
              {ls.length === 0 ? <div style={{ padding: 40, textAlign: "center" as const, color: T.taupe }}>No sarees yet</div> : (
                <div style={{ overflowX: "auto" as const }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr>{["#","Saree ID","Batch ID","Type","Status","Completed","QC"].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                    <tbody>
                      {ls.map((s, i) => {
                        const ss = s.status === "complete" ? { l: "Complete", c: T.green, bg: "rgba(30,102,64,0.10)" } : s.status === "in-progress" ? { l: "In Progress", c: T.antiqueGold, bg: "rgba(200,155,71,0.12)" } : { l: "Pending", c: T.taupe, bg: "rgba(139,112,96,0.08)" };
                        const qc = !s.qualityStatus || s.qualityStatus === "pending" ? { l: "—", c: T.taupe, bg: "transparent" } : s.qualityStatus === "pass" ? { l: "Pass", c: T.green, bg: "rgba(30,102,64,0.10)" } : { l: "Fail", c: T.crimson, bg: "rgba(192,57,43,0.09)" };
                        return (
                          <tr key={s.sareeId} style={{ background: i % 2 === 0 ? "#FFF" : T.warmIvory }}>
                            <td style={{ ...TD, color: T.taupe, width: 40 }}>{i + 1}</td>
                            <td style={{ ...TD, fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, fontWeight: 700 }}>{s.sareeId}</td>
                            <td style={{ ...TD, fontFamily: F.mono, fontSize: 12, color: T.antiqueGold, fontWeight: 600 }}>{s.batchId}</td>
                            <td style={{ ...TD, fontFamily: F.mono, fontSize: 12 }}>{s.sareeType}</td>
                            <td style={TD}><span style={{ background: ss.bg, color: ss.c, borderRadius: 7, padding: "3px 9px", fontFamily: F.ui, fontSize: 12, fontWeight: 600 }}>{ss.l}</span></td>
                            <td style={{ ...TD, fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{s.completedDate || "—"}</td>
                            <td style={TD}><span style={{ background: qc.bg, color: qc.c, borderRadius: 7, padding: "3px 9px", fontFamily: F.ui, fontSize: 12, fontWeight: 600 }}>{qc.l}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </FadeUp>
        )}
      </div>
    </div>
  );
}

// ── Loom Card ─────────────────────────────────────────────────────────────────
function LoomCard({ loom, batches, sarees, onView }: { loom: FactoryLoom; batches: LoomBatch[]; sarees: LoomSaree[]; onView: () => void }) {
  const sc = STATUS_CFG[loom.status];
  const ab = batches.filter(b => b.loomId === loom.id && b.status === "active").length;
  const done = sarees.filter(s => s.loomId === loom.id && s.status === "complete").length;
  const tb = batches.filter(b => b.loomId === loom.id).length;
  const tc = T.royalBurgundy;
  return (
    <motion.div whileHover={{ y: -4, boxShadow: "0 20px 56px rgba(74,6,27,0.14)" }} transition={{ type: "spring", stiffness: 260, damping: 22 }}
      style={{ background: "#FFF", borderRadius: 20, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 3px 16px rgba(74,6,27,0.07)", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 6, background: tc }} />
      <div style={{ padding: "20px 22px", flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: tc, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Factory size={22} color="#FFF" /></div>
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 17, color: T.luxuryBrown }}>{loom.loomNumber}</div>
              <div style={{ fontFamily: F.mono, fontSize: 11.5, color: T.taupe, marginTop: 2 }}>{loom.id}</div>
            </div>
          </div>
          <span style={{ background: sc.bg, color: sc.color, borderRadius: 999, padding: "4px 10px", fontFamily: F.ui, fontSize: 11.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>{sc.icon}{sc.label}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
          {[{ l: "Location", v: loom.location }, { l: "Operator", v: loom.operatorName }, { l: "Installed", v: loom.installedYear || "—" }].map(f => (
            <div key={f.l} style={{ background: T.silkCream, borderRadius: 10, padding: "9px 11px" }}>
              <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 3 }}>{f.l}</div>
              <div style={{ fontFamily: F.ui, fontSize: 12.5, fontWeight: 600, color: T.luxuryBrown, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{f.v}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[{ v: ab, l: "Active Batches", c: T.royalBurgundy, bg: "rgba(110,15,45,0.06)" }, { v: done, l: "Sarees Done", c: T.green, bg: "rgba(30,102,64,0.07)" }, { v: tb, l: "Total Batches", c: T.antiqueGold, bg: "rgba(200,155,71,0.08)" }].map(s => (
            <div key={s.l} style={{ flex: 1, background: s.bg, borderRadius: 10, padding: "8px 12px", textAlign: "center" as const }}>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: s.c }}>{s.v}</div>
              <div style={{ fontFamily: F.ui, fontSize: 10.5, color: T.taupe }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: "0 22px 20px" }}>
        <motion.button onClick={onView} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          style={{ width: "100%", height: 42, borderRadius: 12, border: `1.5px solid ${T.royalBurgundy}`, background: "transparent", color: T.royalBurgundy, fontFamily: F.ui, fontWeight: 700, fontSize: 13.5, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
          <FileText size={15} /> View Details
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── Main Page Export ──────────────────────────────────────────────────────────
export function FactoryLoomPage() {
  const [looms, setLooms] = useState<FactoryLoom[]>(INITIAL_LOOMS);
  const [view, setView] = useState<"card"|"table">("card");
  const [search, setSearch] = useState("");
  const [sf, setSf] = useState<"all"|"active"|"idle"|"maintenance">("all");
  const [showModal, setShowModal] = useState(false);
  const [editLoom, setEditLoom] = useState<FactoryLoom|null>(null);
  const [selected, setSelected] = useState<FactoryLoom|null>(null);
  const [batches] = useState<LoomBatch[]>(SAMPLE_BATCHES);
  const [materials] = useState<LoomMaterial[]>(SAMPLE_MATERIALS);
  const [sarees] = useState<LoomSaree[]>(SAMPLE_SAREES);

  const filtered = looms.filter(l => {
    const ms = !search || l.loomNumber.toLowerCase().includes(search.toLowerCase()) || l.operatorName.toLowerCase().includes(search.toLowerCase()) || l.id.toLowerCase().includes(search.toLowerCase());
    return ms && (sf === "all" || l.status === sf);
  });

  const handleAddOrEdit = (l: FactoryLoom) => {
    setLooms(prev => prev.find(x => x.id === l.id) ? prev.map(x => x.id === l.id ? l : x) : [...prev, l]);
    setEditLoom(null);
  };
  const handleEdit = (l: FactoryLoom) => { setEditLoom(l); setShowModal(true); setSelected(null); };

  const TH: React.CSSProperties = { fontFamily: F.mono, fontSize: 11, fontWeight: 500, color: T.taupe, letterSpacing: "1.4px", textTransform: "uppercase" as const, padding: "13px 18px", textAlign: "left" as const, borderBottom: `1px solid ${T.borderDef}`, background: T.silkCream, whiteSpace: "nowrap" as const };
  const TD: React.CSSProperties = { padding: "13px 18px", borderBottom: "1px solid rgba(110,15,45,0.05)", verticalAlign: "middle" as const, fontFamily: F.ui, fontSize: 13.5 };

  if (selected) return <LoomDetailPage loom={selected} batches={batches} materials={materials} sarees={sarees} onBack={() => setSelected(null)} onEdit={handleEdit} />;

  return (
    <div style={{ fontFamily: F.ui, background: T.silkCream, minHeight: "100vh" }}>
      <div style={{ background: T.darkBurgundy, position: "relative" as const, overflow: "hidden", minHeight: 190, display: "flex", alignItems: "stretch" }}>
        <div style={{ flex: 1, padding: "44px 56px", zIndex: 10, position: "relative" as const }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <div style={{ width: 28, height: 1, background: T.antiqueGold }} />
            <span style={{ fontFamily: F.mono, fontSize: 9, color: `${T.antiqueGold}80`, letterSpacing: "1.5px", textTransform: "uppercase" as const }}>SINCE 1999 · PEOPLE</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <h1 style={{ fontFamily: F.display, fontWeight: 700, fontSize: 42, color: "#fff", margin: "0 0 8px", lineHeight: 1.1 }}>Factory Looms</h1>
              <p style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,255,255,0.60)", maxWidth: 560, margin: 0, lineHeight: 1.65 }}>Manage in-house factory looms, track batch assignments, materials, and production output.</p>
            </div>
            <motion.button onClick={() => { setEditLoom(null); setShowModal(true); }} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              style={{ display: "flex", alignItems: "center", gap: 8, background: T.antiqueGold, color: T.darkBurgundy, border: "none", borderRadius: 12, padding: "12px 22px", fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
              <Plus size={17} /> Add Factory Loom
            </motion.button>
          </div>
        </div>
        {[320, 460].map((sz, i) => <div key={i} style={{ position: "absolute" as const, right: -sz * 0.3, bottom: -sz * 0.4, width: sz, height: sz, borderRadius: "50%", border: `1px solid rgba(200,155,71,${0.10 - i * 0.03})`, pointerEvents: "none" as const }} />)}
      </div>

      {/* Stats */}
      <div style={{ background: "#FFF", borderBottom: `1px solid ${T.borderDef}`, padding: "14px 56px", display: "flex", gap: 28 }}>
        {[{ l: "Total Looms", v: looms.length, c: T.luxuryBrown }, { l: "Active", v: looms.filter(l => l.status === "active").length, c: T.green }, { l: "Idle", v: looms.filter(l => l.status === "idle").length, c: T.antiqueGold }, { l: "Maintenance", v: looms.filter(l => l.status === "maintenance").length, c: T.crimson }].map(s => (
          <div key={s.l} style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 24, color: s.c }}>{s.v}</div>
            <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: "26px 56px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 22 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {(["all", "active", "idle", "maintenance"] as const).map(f => (
              <button key={f} onClick={() => setSf(f)} style={{ padding: "7px 16px", borderRadius: 99, cursor: "pointer", fontFamily: F.ui, fontSize: 13, fontWeight: 600, background: sf === f ? T.royalBurgundy : "transparent", color: sf === f ? "#FFF" : T.taupe, border: sf === f ? "none" : `1px solid rgba(110,15,45,0.16)` }}>
                {f === "all" ? "All Looms" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#FFF", border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: "8px 14px" }}>
              <Search size={14} color={T.taupe} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search loom or operator..."
                style={{ border: "none", outline: "none", fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, background: "transparent", width: 200 }} />
            </div>
            <div style={{ display: "flex", gap: 5 }}>
              {([["card", LayoutGrid, "Card"], ["table", LayoutList, "Table"]] as const).map(([v, Icon, label]) => (
                <motion.button key={v} onClick={() => setView(v as any)} whileHover={{ scale: 1.04 }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 13px", borderRadius: 10, cursor: "pointer", fontFamily: F.ui, fontSize: 12.5, fontWeight: 600, background: view === v ? T.royalBurgundy : "#FFF", color: view === v ? "#FFF" : T.taupe, border: view === v ? "none" : `1px solid ${T.borderDef}` }}>
                  <Icon size={13} />{label}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {filtered.length === 0
          ? <div style={{ textAlign: "center" as const, padding: "80px 0", fontFamily: F.ui, color: T.taupe }}>No looms found.</div>
          : view === "card"
          ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20, paddingBottom: 60 }}>
              {filtered.map((l, i) => <FadeUp key={l.id} delay={i * 0.05}><LoomCard loom={l} batches={batches} sarees={sarees} onView={() => setSelected(l)} /></FadeUp>)}
            </div>
          ) : (
            <div style={{ background: "#FFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, overflow: "hidden", marginBottom: 60 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>{["ID","Loom","Location","Operator","Status","Active Batches","Sarees Done","Actions"].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                <tbody>
                  {filtered.map((l, i) => {
                    const sc = STATUS_CFG[l.status];
                    const ab = batches.filter(b => b.loomId === l.id && b.status === "active").length;
                    const done = sarees.filter(s => s.loomId === l.id && s.status === "complete").length;
                    return (
                      <tr key={l.id} style={{ background: i % 2 === 0 ? "#FFF" : T.warmIvory }}>
                        <td style={{ ...TD, fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, fontWeight: 700 }}>{l.id}</td>
                        <td style={{ ...TD, fontWeight: 700, color: T.luxuryBrown }}>{l.loomNumber}</td>
                        <td style={{ ...TD, fontSize: 13, color: T.taupe }}>{l.location}</td>
                        <td style={{ ...TD }}>{l.operatorName}</td>
                        <td style={TD}><span style={{ background: sc.bg, color: sc.color, borderRadius: 7, padding: "4px 10px", fontFamily: F.ui, fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>{sc.icon}{sc.label}</span></td>
                        <td style={{ ...TD, textAlign: "center" as const, fontWeight: 700, color: T.royalBurgundy }}>{ab}</td>
                        <td style={{ ...TD, textAlign: "center" as const, fontWeight: 700, color: T.green }}>{done}</td>
                        <td style={TD}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <motion.button onClick={() => setSelected(l)} whileHover={{ scale: 1.04 }} style={{ height: 34, padding: "0 12px", borderRadius: 8, border: `1px solid ${T.royalBurgundy}`, background: "transparent", color: T.royalBurgundy, fontFamily: F.ui, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}><FileText size={13} /> View</motion.button>
                            <motion.button onClick={() => handleEdit(l)} whileHover={{ scale: 1.04 }} style={{ height: 34, padding: "0 12px", borderRadius: 8, border: `1px solid ${T.borderDef}`, background: "transparent", color: T.taupe, fontFamily: F.ui, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}><Edit2 size={13} /> Edit</motion.button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        }
      </div>
      <AddLoomModal open={showModal} onClose={() => { setShowModal(false); setEditLoom(null); }} onAdd={handleAddOrEdit} editLoom={editLoom} />
    </div>
  );
}
