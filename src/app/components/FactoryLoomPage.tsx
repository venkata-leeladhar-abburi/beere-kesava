import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus, Search, X, Edit2,
  LayoutGrid, LayoutList, CheckCircle2, Clock, AlertTriangle,
  ArrowLeft, FileText, Factory, Package, Layers, Sparkles,
  TrendingUp, Trophy, Percent, Timer,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Line, Legend,
  RadialBarChart, RadialBar,
} from "recharts";
import { useBatches } from "./BatchContext";
import { useDesignLibrary, DispatchRecord } from "./DesignLibraryContext";
import { useMaterialIssue } from "./MaterialIssueContext";
import { useQc } from "./QcContext";
import { DispatchDetailsModal } from "./BatchCreationPage";
import { WeaverSareesSection } from "./WeaverSareesSection";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "./DateFilterBar";

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
const fmtIssueDate = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

function SectionPill({ label }: { label: string }) {
  return <div style={{ fontFamily: F.mono, fontSize: 13, color: T.taupe, letterSpacing: "1.2px", textTransform: "uppercase" as const, marginBottom: 4 }}>{label}</div>;
}

/**
 * Design dispatches are addressed by a free-form loom label ("Loom 3") in the
 * Design Library, while looms here are identified as FL-00X / "Loom F-01".
 * Accept any of those spellings so existing dispatches still resolve.
 */
function loomDispatchAliases(loom: FactoryLoom): string[] {
  const digits = loom.loomNumber.replace(/[^0-9]/g, "").replace(/^0+/, "");
  return [loom.id, loom.loomNumber, digits ? `Loom ${digits}` : ""].filter(Boolean);
}

function LoomDetailPage({ loom, onBack, onEdit }: {
  loom: FactoryLoom;
  onBack: () => void;
  onEdit: (l: FactoryLoom) => void;
}) {
  const [tab, setTab] = useState<"overview" | "batches" | "dispatches" | "materials">("overview");
  const [batchDateFilter, setBatchDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [dispatchDateFilter, setDispatchDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [viewDispatches, setViewDispatches] = useState<{ weaverName: string; records: DispatchRecord[] } | null>(null);
  const [zoomImage, setZoomImage] = useState<{ url: string; label: string } | null>(null);

  const { batches } = useBatches();
  const { dispatches } = useDesignLibrary();
  const { issueRecords } = useMaterialIssue();
  const { getQcForLoom } = useQc();

  const sc = STATUS_CFG[loom.status];
  const aliases = loomDispatchAliases(loom);

  const getBatchNum = (id: string) => {
    const m = id.match(/BATCH-(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  };

  // ── Batches this loom is working on ────────────────────────────────────────
  const loomBatches = batches.filter(b => b.rows.some(r => r.factoryLoomId === loom.id));
  const sortedLoomBatches = [...loomBatches].sort((a, b) => {
    if (a.status === "active" && b.status !== "active") return -1;
    if (a.status !== "active" && b.status === "active") return 1;
    return getBatchNum(b.batchId) - getBatchNum(a.batchId);
  }).filter(b => matchesDateFilter(b.createdAt, batchDateFilter));

  const qcRecords = getQcForLoom(loom.id);
  const activeBatchCount = loomBatches.filter(b => b.status === "active").length;
  const assignedCount = loomBatches.reduce((n, b) => n + b.rows.filter(r => r.factoryLoomId === loom.id).length, 0);
  const qcPassedCount = qcRecords.filter(r => r.result === "passed").length;

  // ── Materials issued to this loom ──────────────────────────────────────────
  const materialRecords = issueRecords.filter(r => r.factoryLoomId === loom.id && r.status !== "cancelled");

  // ── Design dispatches sent to this loom, grouped by batch ──────────────────
  const loomDispatches = dispatches.filter(d =>
    d.recipientType === "loom" && aliases.includes(d.recipientId) && matchesDateFilter(d.sentAt, dispatchDateFilter));
  const dispatchGroups: { batchId: string; records: DispatchRecord[] }[] = [];
  loomDispatches.forEach(d => {
    const ids = d.batches.length > 0 ? d.batches : ["No batch linked"];
    ids.forEach(bId => {
      let g = dispatchGroups.find(x => x.batchId === bId);
      if (!g) { g = { batchId: bId, records: [] }; dispatchGroups.push(g); }
      g.records.push(d);
    });
  });
  dispatchGroups.sort((a, b) => getBatchNum(b.batchId) - getBatchNum(a.batchId));

  const TABS = [
    { k: "overview", l: "Overview", icon: <FileText size={16} /> },
    { k: "batches", l: "Batch History", icon: <Layers size={16} /> },
    { k: "dispatches", l: "Design Dispatches", icon: <Sparkles size={16} /> },
    { k: "materials", l: "Materials Received", icon: <Package size={16} /> },
  ];

  return (
    <>
    <div style={{ fontFamily: F.ui, background: T.silkCream, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 48px", borderBottom: `1px solid ${T.borderDef}`, background: "#FFFFFF", position: "sticky" as const, top: 0, zIndex: 10 }}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "none", cursor: "pointer", color: T.royalBurgundy, fontFamily: F.ui, fontWeight: 700, fontSize: 15, padding: "8px 4px" }}>
          <ArrowLeft size={18} /> Back to Factory Looms
        </button>
        <span style={{ fontFamily: F.mono, fontSize: 12, letterSpacing: "1px", textTransform: "uppercase" as const, color: T.taupe }}>Factory Loom Profile</span>
      </div>

      {/* Identity strip */}
      <div style={{ padding: "40px 48px", background: "#FFFFFF", borderBottom: `1px solid ${T.borderDef}` }}>
        <div style={{ display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap" as const }}>
          <div style={{ width: 104, height: 104, borderRadius: 26, background: T.royalBurgundy, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Factory size={46} color="#FFF" />
          </div>
          <div style={{ flex: "1 1 320px" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: sc.color, background: sc.bg, borderRadius: 99, padding: "5px 14px", marginBottom: 12 }}>{sc.icon}{sc.label}</span>
            <div style={{ fontFamily: F.display, fontSize: 32, color: "#1A0A0F", lineHeight: 1.2, fontWeight: 600 }}>{loom.loomNumber}</div>
            <div style={{ fontFamily: F.mono, fontSize: 14, color: T.royalBurgundy, marginTop: 6 }}>{loom.id}</div>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const }}>
            {[
              { icon: <Factory size={15} color={T.royalBurgundy} />, label: "Location", value: loom.location },
              { icon: <FileText size={15} color={T.royalBurgundy} />, label: "Operator", value: loom.operatorName },
              { icon: <Layers size={15} color={T.royalBurgundy} />, label: "Installed", value: loom.installedYear },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 10, background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "10px 16px", minWidth: 140 }}>
                {s.icon}
                <div>
                  <div style={{ fontFamily: F.ui, fontSize: 10.5, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>{s.label}</div>
                  <div style={{ fontFamily: F.ui, fontSize: 13.5, fontWeight: 700, color: T.luxuryBrown }}>{s.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: "0 48px", borderBottom: `1px solid ${T.borderDef}`, display: "flex", gap: 24, background: "#FFFFFF", overflowX: "auto" as const }}>
        {TABS.map(t => (
          <button key={t.k} onClick={() => setTab(t.k as any)}
            style={{ padding: "16px 0", display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontSize: 15, fontWeight: 600, color: tab === t.k ? T.royalBurgundy : T.taupe, background: "transparent", border: "none", borderBottom: `3px solid ${tab === t.k ? T.royalBurgundy : "transparent"}`, cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap" as const }}>
            {t.icon}{t.l}
          </button>
        ))}
      </div>

      <div style={{ padding: "40px 48px 80px", flex: 1 }}>
        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 36 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 18 }}>
              {[
                { label: "Active Batches", v: activeBatchCount, icon: <Layers size={20} color={T.royalBurgundy} /> },
                { label: "Total Batches", v: loomBatches.length, icon: <Package size={20} color={T.antiqueGold} /> },
                { label: "Sarees Assigned", v: assignedCount, icon: <CheckCircle2 size={20} color={T.green} /> },
                { label: "QC Passed", v: qcPassedCount, icon: <Sparkles size={20} color={T.royalBurgundy} /> },
              ].map(s => (
                <div key={s.label} style={{ background: "#FFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: "20px 22px", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: T.warmIvory, border: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.icon}</div>
                  <div>
                    <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1.1 }}>{s.v}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 32, alignItems: "start" as const }}>
              <div>
                <SectionPill label="Loom Details" />
                <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, overflow: "hidden" }}>
                  {[
                    { label: "Loom Number", value: loom.loomNumber },
                    { label: "Location", value: loom.location },
                    { label: "Operator Name", value: loom.operatorName },
                    { label: "Operator Phone", value: loom.operatorPhone },
                    { label: "Installed Year", value: loom.installedYear },
                    { label: "Notes", value: loom.notes || "—" },
                  ].map((r, i, arr) => (
                    <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "16px 20px", borderBottom: i < arr.length - 1 ? `1px solid ${T.borderDef}` : "none", background: i % 2 === 1 ? T.warmIvory : "#FFFFFF" }}>
                      <span style={{ color: T.taupe, fontFamily: F.ui, fontSize: 14.5 }}>{r.label}</span>
                      <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown, textAlign: "right" as const }}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <SectionPill label="Materials History" />
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 10, maxHeight: 320, overflowY: "auto" as const }}>
                  {materialRecords.length === 0 ? (
                    <div style={{ background: T.warmIvory, borderRadius: 16, padding: 20, textAlign: "center" as const, color: T.taupe, fontFamily: F.ui, fontSize: 14, fontStyle: "italic" as const, border: `1px solid ${T.borderDef}` }}>
                      No materials issued to this loom yet.
                    </div>
                  ) : materialRecords.map(r => (
                    <div key={r.id} style={{ background: "#FFFFFF", border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 10 }}>
                        <span style={{ fontFamily: F.mono, fontSize: 11.5, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.08)", borderRadius: 6, padding: "2px 8px" }}>{r.id}</span>
                        <span style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe }}>{fmtIssueDate(r.issuedAt)}</span>
                      </div>
                      {r.materials.map((m, i) => (
                        <div key={i} style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>
                          • {m.materialType}: <strong>{m.quantity} {m.unit}</strong>{m.description ? ` ${m.description}` : ""}
                        </div>
                      ))}
                      <div style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe, marginTop: 6 }}>Batch {r.batchId || "—"} · Issued by {r.issuedBy}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sarees — same section as the weaver profile */}
            <div>
              <SectionPill label="Sarees" />
              <WeaverSareesSection ownerType="loom" weaverId={loom.id} weaverName={loom.loomNumber} />
            </div>
          </div>
        )}

        {/* ── BATCH HISTORY ── */}
        {tab === "batches" && (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 24 }}>
            <SectionPill label="All Batches & Assigned Sarees" />
            <DateFilterBar filter={batchDateFilter} onChange={setBatchDateFilter} />
            {sortedLoomBatches.length > 0 ? sortedLoomBatches.map(b => {
              const rowsInBatch = b.rows.filter(r => r.factoryLoomId === loom.id);
              const batchDispatches = dispatches.filter(d => d.recipientType === "loom" && aliases.includes(d.recipientId) && d.batches.includes(b.batchId));
              const doneCount = rowsInBatch.filter(r => r.qcPassed === true).length;
              const pct = rowsInBatch.length > 0 ? Math.round((doneCount / rowsInBatch.length) * 100) : 0;
              const statusBg = b.status === "completed" ? "rgba(30,102,64,0.08)" : b.status === "active" ? "rgba(200,155,71,0.08)" : "rgba(139,112,96,0.08)";
              const statusColor = b.status === "completed" ? T.green : b.status === "active" ? T.royalBurgundy : T.taupe;
              return (
                <div key={b.batchId} style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: 20, boxShadow: "0 4px 16px rgba(0,0,0,0.02)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap" as const, gap: 10 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontFamily: F.mono, fontSize: 15, fontWeight: 700, color: T.royalBurgundy }}>{b.batchId}</span>
                      <span style={{ fontFamily: F.ui, fontSize: 11, background: statusBg, color: statusColor, borderRadius: 6, padding: "3px 8px", fontWeight: 700, textTransform: "uppercase" as const }}>{b.status}</span>
                    </div>
                    {b.dueDate && <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Due Date: {b.dueDate}</div>}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" as const, marginBottom: 6 }}>
                    <span style={{ fontFamily: F.ui, fontSize: 13.5, color: T.luxuryBrown }}>Progress: {doneCount} of {rowsInBatch.length} sarees done</span>
                    <span style={{ fontFamily: F.mono, fontSize: 13.5, fontWeight: 700, color: T.antiqueGold }}>{pct}%</span>
                  </div>
                  <div style={{ height: 6, background: "rgba(110,15,45,0.08)", borderRadius: 99, overflow: "hidden", marginBottom: 16 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${T.antiqueGold}, ${T.goldLight})`, borderRadius: 99 }} />
                  </div>

                  <div style={{ overflowX: "auto" as const, border: `1px solid ${T.borderDef}`, borderRadius: 10, background: "#FFFFFF" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" as const, minWidth: 560 }}>
                      <thead>
                        <tr style={{ background: T.warmCream }}>
                          {["Saree ID", "Saree Type", "Bulk Order", "Design Dispatch", "QC Status"].map(h => (
                            <th key={h} style={{ padding: "8px 10px", textAlign: "left" as const, fontFamily: F.ui, fontSize: 10.5, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.8px", borderBottom: `1px solid ${T.borderDef}` }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rowsInBatch.map((row, idx) => {
                          let qcLabel = "In Production", qcBg = "rgba(139,112,96,0.08)", qcColorVal = T.taupe;
                          if (row.qcPassed === true) { qcLabel = "QC Passed"; qcBg = "rgba(30,102,64,0.08)"; qcColorVal = T.green; }
                          else if (row.qcPassed === false) { qcLabel = "QC Failed"; qcBg = "rgba(192,57,43,0.08)"; qcColorVal = T.crimson; }
                          return (
                            <tr key={idx} style={{ background: idx % 2 === 0 ? "#fff" : "rgba(247,242,234,0.4)", borderBottom: `1px solid ${T.borderDef}` }}>
                              <td style={{ padding: "9px 10px" }}>
                                {row.sareeId
                                  ? <span style={{ fontFamily: F.mono, fontSize: 11.5, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.08)", borderRadius: 5, padding: "2px 6px" }}>{row.sareeId}</span>
                                  : <span style={{ color: "rgba(139,112,96,0.4)", fontSize: 11 }}>—</span>}
                              </td>
                              <td style={{ padding: "9px 10px", fontFamily: F.mono, fontSize: 11, color: T.luxuryBrown }}>{row.sareeTypeCode || "—"}</td>
                              <td style={{ padding: "9px 10px", fontFamily: F.ui, fontSize: 11, color: row.bulkOrderRef ? T.royalBurgundy : T.green, fontWeight: 600 }}>{row.bulkOrderLabel || "General Stock"}</td>
                              <td style={{ padding: "9px 10px" }}>
                                {idx === 0 && batchDispatches.length > 0
                                  ? <button onClick={() => setViewDispatches({ weaverName: loom.loomNumber, records: batchDispatches })}
                                      style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.08)", border: "none", borderRadius: 6, padding: "3px 9px", cursor: "pointer" }}>
                                      {batchDispatches.length} Dispatch{batchDispatches.length > 1 ? "es" : ""}
                                    </button>
                                  : <span style={{ color: "rgba(139,112,96,0.35)", fontSize: 11 }}>—</span>}
                              </td>
                              <td style={{ padding: "9px 10px" }}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: qcColorVal, background: qcBg, borderRadius: 99, padding: "2px 8px", whiteSpace: "nowrap" as const }}>
                                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: qcColorVal }} />{qcLabel}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            }) : (
              <div style={{ background: T.warmIvory, borderRadius: 16, padding: 20, textAlign: "center" as const, color: T.taupe, fontFamily: F.ui, fontSize: 14.5, fontStyle: "italic" as const, border: `1px solid ${T.borderDef}` }}>
                No batch history found for this loom.
              </div>
            )}
          </div>
        )}

        {/* ── DESIGN DISPATCHES ── */}
        {tab === "dispatches" && (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 24 }}>
            <SectionPill label="Design Dispatches Sent to This Loom" />
            <DateFilterBar filter={dispatchDateFilter} onChange={setDispatchDateFilter} />
            {dispatchGroups.length > 0 ? dispatchGroups.map(group => (
              <div key={group.batchId} style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: 20, boxShadow: "0 4px 16px rgba(0,0,0,0.02)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <span style={{ fontFamily: F.mono, fontSize: 15, fontWeight: 700, color: T.royalBurgundy }}>{group.batchId}</span>
                  <span style={{ fontFamily: F.ui, fontSize: 11, background: "rgba(110,15,45,0.08)", color: T.royalBurgundy, borderRadius: 6, padding: "3px 8px", fontWeight: 700 }}>{group.records.length} dispatch{group.records.length > 1 ? "es" : ""}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
                  {group.records.map(h => (
                    <div key={h.id} style={{ background: T.warmIvory, borderRadius: 12, border: `1px solid ${T.borderDef}`, padding: "16px 18px", display: "flex", flexDirection: "column" as const, gap: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontFamily: F.mono, fontSize: 11.5, fontWeight: 700, color: T.royalBurgundy }}>{h.id}</span>
                        <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>Sent on {h.sentAt}</span>
                      </div>
                      <div style={{ background: "rgba(110,15,45,0.03)", border: "1px solid rgba(110,15,45,0.06)", borderRadius: 10, padding: "10px 14px", fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, lineHeight: 1.5 }}>
                        <strong>Instructions:</strong> {h.instructions}
                      </div>
                      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" as const, flexWrap: "wrap" as const }}>
                        {h.colorSlipImage && (
                          <div style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
                            <span style={{ fontFamily: F.ui, fontSize: 10.5, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.4px" }}>Color Slip</span>
                            <img src={h.colorSlipImage} alt="Color slip" onClick={() => setZoomImage({ url: h.colorSlipImage!, label: `Color Slip — ${h.id}` })}
                              style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover" as const, border: `1px solid ${T.borderDef}`, cursor: "pointer" }} />
                          </div>
                        )}
                        {h.designGraphImage && (
                          <div style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
                            <span style={{ fontFamily: F.ui, fontSize: 10.5, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.4px" }}>Design Graph</span>
                            <img src={h.designGraphImage} alt="Design graph" onClick={() => setZoomImage({ url: h.designGraphImage!, label: `Design Graph — ${h.id}` })}
                              style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover" as const, border: `1px solid ${T.borderDef}`, cursor: "pointer" }} />
                          </div>
                        )}
                        {!h.colorSlipImage && !h.designGraphImage && (
                          <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, fontStyle: "italic" as const }}>No files attached</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )) : (
              <div style={{ background: T.warmIvory, borderRadius: 16, padding: 20, textAlign: "center" as const, color: T.taupe, fontFamily: F.ui, fontSize: 14.5, fontStyle: "italic" as const, border: `1px solid ${T.borderDef}` }}>
                No design dispatches found for this loom.
              </div>
            )}
          </div>
        )}

        {/* ── MATERIALS RECEIVED ── */}
        {tab === "materials" && (
          <div>
            <SectionPill label="Materials Issued — Batch Wise" />
            {materialRecords.length === 0 ? (
              <div style={{ background: T.warmIvory, borderRadius: 16, padding: 24, textAlign: "center" as const, color: T.taupe, fontFamily: F.ui, fontSize: 14.5, fontStyle: "italic" as const, marginTop: 12 }}>
                No materials issued to this loom yet. Use the Issue Material page to record material handovers.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 18, marginTop: 12 }}>
                {Array.from(materialRecords.reduce((m, r) => {
                  const key = r.batchId || "Unassigned";
                  if (!m.has(key)) m.set(key, [] as typeof materialRecords);
                  m.get(key)!.push(r);
                  return m;
                }, new Map<string, typeof materialRecords>()).entries()).map(([batchId, recs]) => (
                  <div key={batchId} style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                      <span style={{ fontFamily: F.mono, fontSize: 15, fontWeight: 700, color: T.royalBurgundy }}>{batchId}</span>
                      <span style={{ fontFamily: F.ui, fontSize: 11, background: "rgba(110,15,45,0.08)", color: T.royalBurgundy, borderRadius: 6, padding: "3px 8px", fontWeight: 700 }}>{recs.length} issuance{recs.length > 1 ? "s" : ""}</span>
                    </div>
                    {recs.map(r => (
                      <div key={r.id} style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap" as const, gap: 8 }}>
                          <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{r.id}</span>
                          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{fmtIssueDate(r.issuedAt)}</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
                          {r.materials.map((m, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: "10px 14px", flexWrap: "wrap" as const }}>
                              <span style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown }}>{m.materialType}</span>
                              {m.description && <span style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>{m.description}</span>}
                              <span style={{ fontFamily: F.mono, fontSize: 12.5, color: T.royalBurgundy, marginLeft: "auto" }}>{m.quantity} {m.unit}</span>
                              <span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, background: "rgba(139,112,96,0.10)", borderRadius: 5, padding: "2px 8px" }}>{m.grnBatchId}</span>
                            </div>
                          ))}
                        </div>
                        <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 6 }}>Issued by {r.issuedBy}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky edit bar — mirrors the weaver profile */}
      <div style={{ padding: "24px 32px", borderTop: `1px solid ${T.borderDef}`, background: "#FFFFFF", position: "sticky" as const, bottom: 0, display: "flex", gap: 16 }}>
        <motion.button onClick={() => onEdit(loom)} whileHover={{ scale: 1.02 }}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: T.royalBurgundy, color: "#FFFDF9", border: "none", borderRadius: 12, padding: "14px 0", fontFamily: F.ui, fontSize: 16, fontWeight: 600, cursor: "pointer" }}>
          <Edit2 size={16} /> Edit Details
        </motion.button>
      </div>
    </div>

    <AnimatePresence>
      {viewDispatches && <DispatchDetailsModal key="dd" weaverName={viewDispatches.weaverName} records={viewDispatches.records} onClose={() => setViewDispatches(null)} />}
      {zoomImage && (
        <motion.div key="zoom" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => setZoomImage(null)}
          style={{ position: "fixed" as const, inset: 0, background: "rgba(20,4,10,0.85)", zIndex: 200, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", gap: 14, cursor: "zoom-out" }}>
          <img src={zoomImage.url} alt={zoomImage.label} style={{ maxWidth: "80vw", maxHeight: "75vh", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }} />
          <span style={{ fontFamily: F.ui, fontSize: 13, color: "#fff", fontWeight: 600 }}>{zoomImage.label}</span>
        </motion.div>
      )}
    </AnimatePresence>
    </>
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
// ── Analytics ────────────────────────────────────────────────────────────────
// Reads the loom / batch / material / saree records directly, scoped by one
// shared timeline control. Sarees are dated by completion, materials by issue
// date, batches by start date.

const LA_MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const UTIL_META: Record<string, { label: string; color: string }> = {
  active:      { label: "Active",      color: T.green },
  idle:        { label: "Idle",        color: T.antiqueGold },
  maintenance: { label: "Maintenance", color: T.crimson },
};
const FLOOR_FILLS = [T.royalBurgundy, T.antiqueGold, T.green, "#5A3E6B", "#2D6B6B"];
const laQcColor = (r: number) => (r >= 95 ? T.green : r >= 85 ? "#8B6018" : T.crimson);

function LoomAnalytics({ looms, batches, materials, sarees }: {
  looms: FactoryLoom[]; batches: LoomBatch[]; materials: LoomMaterial[]; sarees: LoomSaree[];
}) {
  const [filter, setFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);

  const doneSarees = React.useMemo(
    () => sarees.filter(s => s.status === "complete" && matchesDateFilter(s.completedDate, filter)),
    [sarees, filter]
  );
  const periodMaterials = React.useMemo(
    () => materials.filter(m => matchesDateFilter(m.date, filter)),
    [materials, filter]
  );

  const periodLabel = React.useMemo(() => {
    if (filter.mode === "day" && filter.day) return new Date(filter.day).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    if (filter.mode === "range") return `${filter.from || "start"} → ${filter.to || "today"}`;
    if (filter.mode === "month" && filter.month) { const [y, m] = filter.month.split("-"); return `${LA_MONTH_ABBR[+m - 1]} ${y}`; }
    if (filter.mode === "year" && filter.year) return filter.year;
    return "All time";
  }, [filter]);

  const produced = doneSarees.length;
  const passed = doneSarees.filter(s => s.qualityStatus === "pass").length;
  const failed = doneSarees.filter(s => s.qualityStatus === "fail").length;
  const passRate = produced ? Math.round((passed / produced) * 100) : 0;

  // Loom availability is current state, not period-scoped.
  const utilisation = React.useMemo(() => (["active", "idle", "maintenance"] as const)
    .map(k => ({ key: k, name: UTIL_META[k].label, value: looms.filter(l => l.status === k).length, color: UTIL_META[k].color }))
    .filter(d => d.value > 0), [looms]);
  const activeLooms = looms.filter(l => l.status === "active").length;
  const utilRate = looms.length ? Math.round((activeLooms / looms.length) * 100) : 0;

  const monthly = React.useMemo(() => {
    const m = new Map<string, { produced: number; passed: number }>();
    doneSarees.forEach(s => {
      const d = new Date(s.completedDate!);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const e = m.get(key) || { produced: 0, passed: 0 };
      e.produced += 1;
      if (s.qualityStatus === "pass") e.passed += 1;
      m.set(key, e);
    });
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([key, v]) => ({
      month: `${LA_MONTH_ABBR[+key.slice(5) - 1]} ${key.slice(2, 4)}`,
      ...v,
      rate: v.produced ? Math.round((v.passed / v.produced) * 100) : 0,
    }));
  }, [doneSarees]);

  const perLoom = React.useMemo(() => looms.map(l => {
    const mine = doneSarees.filter(s => s.loomId === l.id);
    const ok = mine.filter(s => s.qualityStatus === "pass").length;
    const loomBatches = batches.filter(b => b.loomId === l.id);
    const assigned = loomBatches.filter(b => b.status === "active").reduce((a, b) => a + b.sareeCount, 0);
    return {
      ...l,
      short: l.loomNumber.replace("Loom ", ""),
      produced: mine.length,
      passed: ok,
      rejects: mine.length - ok,
      passRate: mine.length ? Math.round((ok / mine.length) * 100) : 0,
      activeBatches: loomBatches.filter(b => b.status === "active").length,
      assigned,
      wip: sarees.filter(s => s.loomId === l.id && s.status === "in-progress").length,
    };
  }), [looms, doneSarees, batches, sarees]);

  const rankedLooms = React.useMemo(
    () => [...perLoom].sort((a, b) => b.produced - a.produced),
    [perLoom]
  );

  // Active batches with their delivery risk — the operational hot list.
  const today = new Date();
  const batchProgress = React.useMemo(() => batches
    .filter(b => b.status === "active")
    .map(b => {
      const due = new Date(b.dueDate);
      const daysLeft = isNaN(due.getTime()) ? null : Math.ceil((due.getTime() - today.getTime()) / 86400000);
      const loom = looms.find(l => l.id === b.loomId);
      return {
        ...b,
        loomName: loom?.loomNumber ?? b.loomId,
        pct: b.sareeCount ? Math.round((b.completedCount / b.sareeCount) * 100) : 0,
        daysLeft,
        overdue: daysLeft !== null && daysLeft < 0,
      };
    })
    .sort((a, b) => (a.daysLeft ?? 999) - (b.daysLeft ?? 999)),
    [batches, looms]);
  const overdueCount = batchProgress.filter(b => b.overdue).length;
  const pipeline = batches.filter(b => b.status === "active").reduce((a, b) => a + (b.sareeCount - b.completedCount), 0);

  // Warp and Resham are kg; Jari comes in Reels or Buns — so units are never mixed.
  const byMaterial = React.useMemo(() => {
    const m = new Map<string, { qty: number; type: string; unit: string }>();
    periodMaterials.forEach(x => {
      const key = `${x.materialType}|${x.unit}`;
      const e = m.get(key) || { qty: 0, type: x.materialType, unit: x.unit };
      e.qty += x.quantity;
      m.set(key, e);
    });
    return [...m.values()]
      .map(v => ({ ...v, label: `${v.type} (${v.unit})`, fill: MAT_TAG[v.type]?.col ?? T.taupe }))
      .sort((a, b) => b.qty - a.qty);
  }, [periodMaterials]);
  const warpKg = periodMaterials.filter(m => m.materialType === "Warp" && m.unit === "kg").reduce((a, m) => a + m.quantity, 0);

  const byFloor = React.useMemo(() => {
    const m = new Map<string, { produced: number; looms: number; active: number }>();
    perLoom.forEach(l => {
      const e = m.get(l.location) || { produced: 0, looms: 0, active: 0 };
      e.produced += l.produced; e.looms += 1;
      if (l.status === "active") e.active += 1;
      m.set(l.location, e);
    });
    return [...m.entries()]
      .map(([floor, v], i) => ({ floor, short: floor.replace("Factory Floor ", "Floor "), ...v, fill: FLOOR_FILLS[i % FLOOR_FILLS.length] }))
      .sort((a, b) => b.produced - a.produced);
  }, [perLoom]);

  const card: React.CSSProperties = {
    background: "#FFF", borderRadius: 20, border: `1px solid ${T.borderDef}`,
    padding: "24px 28px", boxShadow: "0 2px 12px rgba(74,6,27,0.05)",
  };
  const cardTitle: React.CSSProperties = { fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown };
  const cardSub: React.CSSProperties = { fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 3 };
  const tip = { fontFamily: F.ui, fontSize: 12, borderRadius: 10, border: `1px solid ${T.borderDef}`, boxShadow: "0 8px 24px rgba(74,6,27,0.12)" };

  return (
    <div style={{ padding: "34px 56px 0" }}>
      <FadeUp>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div style={{ width: 3, height: 28, background: T.antiqueGold, borderRadius: 2 }} />
          <h2 style={{ fontFamily: F.display, fontSize: 26, color: T.luxuryBrown, margin: 0, fontWeight: 600 }}>Loom Analytics</h2>
          <span style={{ fontFamily: F.mono, fontSize: 10.5, fontWeight: 700, letterSpacing: "1px", color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", padding: "4px 10px", borderRadius: 20, textTransform: "uppercase" as const }}>{periodLabel}</span>
        </div>

        {/* Timeline scope — drives every chart in this section */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" as const }}>
          <DateFilterBar filter={filter} onChange={setFilter} />
          <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
            {[
              { label: "SAREES WOVEN", value: String(produced), color: T.royalBurgundy },
              { label: "QC PASS RATE", value: `${passRate}%`, color: laQcColor(passRate) },
              { label: "LOOM UTILISATION", value: `${utilRate}%`, color: utilRate >= 70 ? T.green : T.crimson },
            ].map(k => (
              <div key={k.label}>
                <div style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 600, letterSpacing: "1px", color: T.taupe }}>{k.label}</div>
                <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>
        </div>
      </FadeUp>

      {/* ── Row 1: throughput + loom availability ── */}
      <FadeUp delay={0.04}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 22, marginBottom: 22 }}>
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={cardTitle}>Factory Throughput</div>
                <div style={cardSub}>Sarees completed against quality-check outcomes</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: passRate >= 90 ? "rgba(30,102,64,0.09)" : "rgba(192,57,43,0.08)", padding: "4px 10px", borderRadius: 20 }}>
                <TrendingUp size={13} color={passRate >= 90 ? T.green : T.crimson} />
                <span style={{ fontFamily: F.ui, fontSize: 11.5, fontWeight: 700, color: passRate >= 90 ? T.green : T.crimson }}>{failed} rejected</span>
              </div>
            </div>
            <div style={{ fontFamily: F.display, fontSize: 42, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1.1, margin: "10px 0 2px" }}>{produced}</div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 8 }}>{pipeline} sarees still in the pipeline across active batches</div>
            {monthly.length === 0 ? (
              <div style={{ padding: "60px 0", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13.5, color: T.taupe }}>No sarees completed in this period.</div>
            ) : (
              <ResponsiveContainer width="100%" height={208}>
                <ComposedChart data={monthly} barSize={26}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(110,15,45,0.06)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontFamily: F.ui, fontSize: 11, fill: T.taupe }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontFamily: F.ui, fontSize: 11, fill: T.taupe }} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
                  <YAxis yAxisId="r" orientation="right" domain={[0, 100]} hide />
                  <RechartsTooltip contentStyle={tip} formatter={(v: any, n: any) => n === "Pass Rate" ? [`${v}%`, n] : [`${v} sarees`, n]} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe, paddingTop: 8 }} />
                  <Bar name="Completed" dataKey="produced" fill={T.royalBurgundy} radius={[5, 5, 0, 0]} />
                  <Bar name="Passed QC" dataKey="passed" fill={T.goldLight} radius={[5, 5, 0, 0]} />
                  <Line yAxisId="r" name="Pass Rate" dataKey="rate" stroke={T.green} strokeWidth={2.5} dot={{ r: 3.5, fill: T.green, strokeWidth: 0 }} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>

          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Factory size={16} color={T.royalBurgundy} />
              <div style={cardTitle}>Loom Availability</div>
            </div>
            <div style={cardSub}>Current floor state · idle looms are lost capacity</div>
            <div style={{ position: "relative" as const, marginTop: 12 }}>
              <ResponsiveContainer width="100%" height={172}>
                <PieChart>
                  <Pie data={utilisation} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={54} outerRadius={78} paddingAngle={3} stroke="none">
                    {utilisation.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={tip} formatter={(v: any, _n: any, p: any) => [`${v} looms`, p.payload.name]} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: "absolute" as const, inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" as const }}>
                <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1 }}>{utilRate}%</div>
                <div style={{ fontFamily: F.ui, fontSize: 10.5, color: T.taupe, marginTop: 3 }}>running</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
              {utilisation.map(d => (
                <div key={d.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />
                    <span style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>{d.name}</span>
                  </div>
                  <span style={{ fontFamily: F.mono, fontSize: 12.5, fontWeight: 700, color: T.luxuryBrown }}>{d.value}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: `1px solid ${T.borderDef}`, marginTop: 14, paddingTop: 14, display: "flex", justifyContent: "space-between", fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
              <span>Sarees in progress</span>
              <span style={{ fontFamily: F.mono, fontWeight: 700, color: T.luxuryBrown }}>{perLoom.reduce((a, l) => a + l.wip, 0)}</span>
            </div>
          </div>
        </div>
      </FadeUp>

      {/* ── Row 2: output per loom + batch delivery risk ── */}
      <FadeUp delay={0.08}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 22, marginBottom: 22 }}>
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Trophy size={17} color={T.antiqueGold} />
                <div>
                  <div style={cardTitle}>Output by Loom</div>
                  <div style={cardSub}>Sarees completed · bar colour shows QC pass rate</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                {[{ c: T.green, t: "≥95%" }, { c: "#8B6018", t: "85–94%" }, { c: T.crimson, t: "<85%" }].map(g => (
                  <div key={g.t} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 9, height: 9, borderRadius: 3, background: g.c }} />
                    <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>{g.t}</span>
                  </div>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={215}>
              <BarChart data={rankedLooms} layout="vertical" barSize={22} margin={{ left: 4, right: 54 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(110,15,45,0.06)" horizontal={false} />
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis type="category" dataKey="short" width={68} tick={{ fontFamily: F.ui, fontSize: 12, fill: T.luxuryBrown }} axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{ fill: "rgba(110,15,45,0.04)" }} contentStyle={tip}
                  formatter={(v: any, _n: any, p: any) => [`${v} completed · ${p.payload.passRate}% pass · ${p.payload.wip} in progress`, `${p.payload.loomNumber} — ${p.payload.operatorName}`]} />
                <Bar dataKey="produced" radius={[0, 6, 6, 0]}
                  label={{ position: "right", formatter: (v: any) => `${v}`, fontFamily: F.mono, fontSize: 11.5, fontWeight: 700, fill: T.luxuryBrown }}>
                  {rankedLooms.map(l => <Cell key={l.id} fill={l.produced === 0 ? "#E3D2AC" : laQcColor(l.passRate)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {/* Operator strip */}
            <div style={{ display: "flex", gap: 8, borderTop: `1px solid ${T.borderDef}`, paddingTop: 14, marginTop: 6 }}>
              {rankedLooms.slice(0, 4).map((l, i) => {
                const sc = STATUS_CFG[l.status];
                return (
                  <div key={l.id} style={{ flex: 1, minWidth: 0, background: i === 0 && l.produced > 0 ? "rgba(200,155,71,0.08)" : T.silkCream, border: `1px solid ${i === 0 && l.produced > 0 ? T.borderGold : T.borderDef}`, borderRadius: 12, padding: "10px 12px" }}>
                    <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.luxuryBrown, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>{l.short}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 }}>{l.operatorName}</div>
                    <div style={{ fontFamily: F.mono, fontSize: 10.5, color: sc.color, marginTop: 4, fontWeight: 700 }}>{sc.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Timer size={16} color={overdueCount ? T.crimson : T.royalBurgundy} />
              <div style={cardTitle}>Batch Delivery Risk</div>
            </div>
            <div style={cardSub}>Active batches by nearest due date</div>
            <div style={{ background: overdueCount ? "rgba(192,57,43,0.08)" : "rgba(30,102,64,0.09)", borderRadius: 14, padding: "14px 18px", margin: "16px 0" }}>
              <div style={{ fontFamily: F.mono, fontSize: 9.5, fontWeight: 700, letterSpacing: "1.1px", color: T.taupe, marginBottom: 6 }}>PAST DUE</div>
              <div style={{ fontFamily: F.display, fontSize: 28, fontWeight: 700, color: overdueCount ? T.crimson : T.green, lineHeight: 1 }}>{overdueCount}</div>
              <div style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe, marginTop: 6 }}>of {batchProgress.length} active batches</div>
            </div>
            {batchProgress.length === 0 ? (
              <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>No active batches on the floor.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {batchProgress.map(b => (
                  <div key={b.batchId}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontFamily: F.mono, fontSize: 11.5, fontWeight: 700, color: T.royalBurgundy }}>{b.batchId}</span>
                      <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: b.overdue ? T.crimson : b.daysLeft !== null && b.daysLeft <= 5 ? "#E67E22" : T.taupe }}>
                        {b.daysLeft === null ? b.dueDate : b.overdue ? `${Math.abs(b.daysLeft)}d overdue` : `${b.daysLeft}d left`}
                      </span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: T.silkCream, overflow: "hidden" }}>
                      <div style={{ width: `${b.pct}%`, height: "100%", borderRadius: 4, background: b.overdue ? "linear-gradient(90deg,#C0392B,#E74C3C)" : `linear-gradient(90deg,${T.deepWine},${T.royalBurgundy})` }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontFamily: F.ui, fontSize: 10.5, color: T.taupe, marginTop: 4 }}>
                      <span>{b.loomName} · {b.designCode}</span>
                      <span>{b.completedCount}/{b.sareeCount} · {b.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </FadeUp>

      {/* ── Row 3: material draw, floor comparison, factory health ── */}
      <FadeUp delay={0.12}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 22, paddingBottom: 8 }}>
          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Layers size={16} color={T.royalBurgundy} />
              <div style={cardTitle}>Material Consumption</div>
            </div>
            <div style={cardSub}>Issued to looms · units kept separate</div>
            {byMaterial.length === 0 ? (
              <div style={{ padding: "62px 0", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>No material issued in this period.</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={186}>
                  <BarChart data={byMaterial} barSize={26} margin={{ top: 16, left: -20, right: 6 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(110,15,45,0.06)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontFamily: F.ui, fontSize: 9.5, fill: T.taupe }} axisLine={false} tickLine={false} interval={0} />
                    <YAxis tick={{ fontFamily: F.ui, fontSize: 10.5, fill: T.taupe }} axisLine={false} tickLine={false} width={38} />
                    <RechartsTooltip cursor={{ fill: "rgba(110,15,45,0.04)" }} contentStyle={tip}
                      formatter={(v: any, _n: any, p: any) => [`${v} ${p.payload.unit}`, p.payload.type]} />
                    <Bar dataKey="qty" radius={[5, 5, 0, 0]}>
                      {byMaterial.map(d => <Cell key={d.label} fill={d.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ borderTop: `1px solid ${T.borderDef}`, marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between", fontFamily: F.ui, fontSize: 11.5, color: T.taupe }}>
                  <span>Warp drawn {warpKg.toFixed(1)} kg</span>
                  <span style={{ color: T.luxuryBrown, fontWeight: 700 }}>
                    {produced ? `${(warpKg / produced).toFixed(2)} kg/saree` : "—"}
                  </span>
                </div>
              </>
            )}
          </div>

          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Package size={16} color={T.royalBurgundy} />
              <div style={cardTitle}>Output by Floor</div>
            </div>
            <div style={cardSub}>Which sections carry production</div>
            <ResponsiveContainer width="100%" height={186}>
              <BarChart data={byFloor} barSize={30} margin={{ top: 16, left: -20, right: 6 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(110,15,45,0.06)" vertical={false} />
                <XAxis dataKey="short" tick={{ fontFamily: F.ui, fontSize: 11, fill: T.taupe }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontFamily: F.ui, fontSize: 10.5, fill: T.taupe }} axisLine={false} tickLine={false} width={34} allowDecimals={false} />
                <RechartsTooltip cursor={{ fill: "rgba(110,15,45,0.04)" }} contentStyle={tip}
                  formatter={(v: any, _n: any, p: any) => [`${v} sarees · ${p.payload.active}/${p.payload.looms} looms running`, p.payload.floor]} />
                <Bar dataKey="produced" radius={[5, 5, 0, 0]}>
                  {byFloor.map(d => <Cell key={d.floor} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ borderTop: `1px solid ${T.borderDef}`, marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between", fontFamily: F.ui, fontSize: 11.5, color: T.taupe }}>
              <span>{byFloor.length} floors</span>
              <span style={{ color: T.luxuryBrown, fontWeight: 600 }}>Top: {byFloor[0]?.floor ?? "—"}</span>
            </div>
          </div>

          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Percent size={16} color={T.royalBurgundy} />
              <div style={cardTitle}>Factory Health</div>
            </div>
            <div style={cardSub}>Quality and capacity snapshot</div>
            <ResponsiveContainer width="100%" height={142}>
              <RadialBarChart innerRadius="62%" outerRadius="100%" startAngle={210} endAngle={-30}
                data={[{ name: "Pass", value: passRate, fill: laQcColor(passRate) }]}>
                <RadialBar dataKey="value" background={{ fill: T.silkCream }} cornerRadius={10} />
                <text x="50%" y="60%" textAnchor="middle" style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, fill: T.luxuryBrown }}>{passRate}%</text>
                <text x="50%" y="80%" textAnchor="middle" style={{ fontFamily: F.ui, fontSize: 10.5, fill: T.taupe }}>QC PASS RATE</text>
              </RadialBarChart>
            </ResponsiveContainer>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 }}>
              {[
                { label: "Rejected", value: `${failed} pcs` },
                { label: "Avg / Loom", value: `${activeLooms ? Math.round(produced / activeLooms) : 0} pcs` },
                { label: "Open Pipeline", value: `${pipeline} pcs` },
                { label: "Looms Down", value: String(looms.filter(l => l.status === "maintenance").length) },
              ].map(k => (
                <div key={k.label} style={{ background: T.silkCream, borderRadius: 10, padding: "10px 12px", border: `1px solid ${T.borderDef}` }}>
                  <div style={{ fontFamily: F.ui, fontSize: 9.5, fontWeight: 600, letterSpacing: "0.5px", color: T.taupe, marginBottom: 4, textTransform: "uppercase" as const }}>{k.label}</div>
                  <div style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>{k.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FadeUp>
    </div>
  );
}

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

  if (selected) return <LoomDetailPage loom={selected} onBack={() => setSelected(null)} onEdit={handleEdit} />;

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

      <LoomAnalytics looms={looms} batches={batches} materials={materials} sarees={sarees} />

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
