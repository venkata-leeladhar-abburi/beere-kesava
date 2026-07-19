import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FloppyDisk, CheckCircle,
  Users, Tag, ShoppingBag, Trash, Factory, SortAscending,
  WarningCircle, CheckSquare, Square, ArrowRight,
  MagnifyingGlass, Stack, Package, Graph,
} from "@phosphor-icons/react";
import { useBatches, SareeRow, BatchRecord, generateSareeId } from "./BatchContext";
import { useBulkOrders } from "./BulkOrderContext";
import { useDesignLibrary, DesignEntry } from "./DesignLibraryContext";
import { DesignCodeCard } from "./DesignLibraryPage";
import { SareeTypeCard, SareeTypeRecord } from "./RatesPricingPage";
import { FACTORY_LOOMS_LIST } from "./FactoryLoomPage";
import { useMaterialIssue } from "./MaterialIssueContext";

// ─── Design tokens ────────────────────────────────────────────────────────────
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
  green:         "#1E6640",
  red:           "#C0392B",
  amber:         "#B7791F",
  borderDef:     "rgba(110,15,45,0.10)",
  borderGold:    "rgba(200,155,71,0.22)",
};
const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};
const G = {
  button:  "linear-gradient(135deg, #6E0F2D 0%, #4A061B 100%)",
  header:  "linear-gradient(135deg, #3D0E1A 0%, #4A061B 60%, #6E0F2D 100%)",
  green:   "linear-gradient(135deg, #1E6640 0%, #145230 100%)",
};

// ─── Weavers ──────────────────────────────────────────────────────────────────
const WEAVERS = [
  { id: "WV-001", name: "Ravi Kumar",   initials: "RK", loom: 2, bg: "#6E0F2D" },
  { id: "WV-002", name: "Padma Veni",   initials: "PV", loom: 1, bg: "#C4923A" },
  { id: "WV-003", name: "Suresh Murti", initials: "SM", loom: 2, bg: "#8B7060" },
  { id: "WV-005", name: "Anand K.",     initials: "AK", loom: 1, bg: "#4A061B" },
  { id: "WV-012", name: "Meena R.",     initials: "MR", loom: 3, bg: "#A05080" },
  { id: "WV-018", name: "Lakshmi D.",   initials: "LD", loom: 1, bg: "#C4923A" },
  { id: "WV-024", name: "Venkat Rao",   initials: "VR", loom: 1, bg: "#1E6640" },
  { id: "WV-031", name: "Kamala B.",    initials: "KB", loom: 1, bg: "#3D0E1A" },
];

// ─── Saree types (mirrors RatesPricingPage seed) ─────────────────────────────
const SAREE_TYPES_BRIEF: { code: string; name: string }[] = [
  { code: "HZ-003", name: "Heavy Zari"     },
  { code: "SB-001", name: "Self Brocade"   },
  { code: "PS-002", name: "Plain Silk"     },
  { code: "BS-004", name: "Bridal Special" },
  { code: "LC-005", name: "Light Cotton"   },
];

// Minimal SareeTypeRecord for card view
const SAREE_TYPE_RECORDS: SareeTypeRecord[] = [
  { code:"HZ-003", type:"Heavy Zari",     description:"Heavy gold zari woven silk, traditional motifs",        charge:"680",  retail:"4800", wholesale:"3600", stdWeight:"720", warpWeight:"380", reshamWeight:"180", jariWeight:"160", changed:"01 Jun 2026" },
  { code:"SB-001", type:"Self Brocade",   description:"Self-coloured brocade weave, intricate self patterns",  charge:"450",  retail:"3200", wholesale:"2400", stdWeight:"640", warpWeight:"320", reshamWeight:"200", jariWeight:"120", changed:"28 May 2026" },
  { code:"PS-002", type:"Plain Silk",     description:"Lightweight plain silk, minimal embellishment",         charge:"280",  retail:"2200", wholesale:"1600", stdWeight:"520", warpWeight:"340", reshamWeight:"120", jariWeight:"60",  changed:"20 May 2026" },
  { code:"BS-004", type:"Bridal Special", description:"Premium bridal saree with heavy zari and stone work",   charge:"1200", retail:"9500", wholesale:"7200", stdWeight:"900", warpWeight:"460", reshamWeight:"240", jariWeight:"200", changed:"15 Jun 2026" },
  { code:"LC-005", type:"Light Cotton",   description:"Everyday lightweight cotton, summer collection",        charge:"180",  retail:"1400", wholesale:"1000", stdWeight:"420", warpWeight:"280", reshamWeight:"80",  jariWeight:"60",  changed:"10 May 2026" },
];

// ─── Helper: field style ──────────────────────────────────────────────────────
const fld: React.CSSProperties = {
  width: "100%", height: 44, padding: "0 14px",
  fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown,
  background: T.warmIvory, border: `1.5px solid ${T.borderDef}`,
  borderRadius: 10, outline: "none", boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  fontFamily: F.ui, fontSize: 12, fontWeight: 700,
  color: T.luxuryBrown, display: "block", marginBottom: 6,
};

// ─── Row completeness ─────────────────────────────────────────────────────────
function rowComplete(r: SareeRow) {
  return !!((r.weaverId || r.factoryLoomId) && r.sareeId && r.sareeTypeCode);
}
function rowEmpty(r: SareeRow) {
  return !r.weaverId && !r.factoryLoomId && !r.sareeTypeCode;
}

// ─── Pip avatar ───────────────────────────────────────────────────────────────
function Pip({ initials, bg, size = 28 }: { initials: string; bg: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontFamily: F.mono, fontSize: size * 0.38, fontWeight: 700, color: "#fff", letterSpacing: "-0.5px" }}>{initials}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PICKER MODALS
// ═══════════════════════════════════════════════════════════════════════════════

// ── Weaver Picker ─────────────────────────────────────────────────────────────
function WeaverPickerModal({ onClose, onSelect }: { onClose: () => void; onSelect: (w: typeof WEAVERS[0]) => void }) {
  const [sel, setSel] = useState<string | null>(null);
  return (
    <PickerShell title="Assign Weaver" onClose={onClose}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 24px" }}>
        {WEAVERS.map(w => (
          <button key={w.id} onClick={() => setSel(w.id)}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", border: `2px solid ${sel === w.id ? T.royalBurgundy : T.borderDef}`, borderRadius: 12, background: sel === w.id ? "rgba(110,15,45,0.05)" : T.warmIvory, cursor: "pointer", textAlign: "left" }}>
            <Pip initials={w.initials} bg={w.bg} size={34} />
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{w.name}</div>
              <div style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>{w.id} · L{w.loom}</div>
            </div>
          </button>
        ))}
      </div>
      <div style={{ padding: "16px 24px 24px", display: "flex", gap: 10 }}>
        <motion.button onClick={() => { const w = WEAVERS.find(x => x.id === sel); if (w) onSelect(w); }} disabled={!sel}
          whileHover={sel ? { scale: 1.02 } : undefined}
          style={{ flex: 2, height: 46, background: sel ? T.royalBurgundy : T.taupe, opacity: sel ? 1 : 0.5, color: "#fff", border: "none", borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: sel ? "pointer" : "not-allowed" }}>
          Assign Weaver
        </motion.button>
        <button onClick={onClose} style={{ flex: 1, height: 46, background: "transparent", border: `1.5px solid ${T.borderDef}`, borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.taupe, cursor: "pointer" }}>Cancel</button>
      </div>
    </PickerShell>
  );
}

// ── Bulk Order Picker ─────────────────────────────────────────────────────────
function BulkOrderPickerModal({ onClose, onSelect }: { onClose: () => void; onSelect: (ref: string | null, label: string) => void }) {
  const { bulkOrders } = useBulkOrders();
  const [sel, setSel] = useState<string | "general" | null>(null);
  return (
    <PickerShell title="Assign Bulk Order" onClose={onClose}>
      <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: 8, maxHeight: 340, overflowY: "auto" }}>
        {/* General Stock */}
        <button onClick={() => setSel("general")}
          style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", border: `2px solid ${sel === "general" ? T.green : T.borderDef}`, borderRadius: 12, background: sel === "general" ? "rgba(30,102,64,0.06)" : T.warmIvory, cursor: "pointer", textAlign: "left" }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: T.green, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Package size={18} color="#fff" weight="duotone" />
          </div>
          <div>
            <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.green }}>General Stock</div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Not linked to any bulk order</div>
          </div>
        </button>
        <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "1px", margin: "4px 0 2px" }}>Active Bulk Orders</div>
        {bulkOrders.map(o => (
          <button key={o.ref} onClick={() => setSel(o.ref)}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", border: `2px solid ${sel === o.ref ? T.royalBurgundy : T.borderDef}`, borderRadius: 12, background: sel === o.ref ? "rgba(110,15,45,0.05)" : T.warmIvory, cursor: "pointer", textAlign: "left" }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(110,15,45,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <ShoppingBag size={16} color={T.royalBurgundy} weight="duotone" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{o.ref}</div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.customer} · {o.sareeType}</div>
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, flexShrink: 0 }}>{o.done}/{o.total}</div>
          </button>
        ))}
      </div>
      <div style={{ padding: "16px 24px 24px", display: "flex", gap: 10 }}>
        <motion.button onClick={() => {
          if (sel === "general") { onSelect(null, "General Stock"); }
          else if (sel) { const o = bulkOrders.find(x => x.ref === sel); if (o) onSelect(o.ref, `${o.ref} · ${o.customer}`); }
        }} disabled={!sel} whileHover={sel ? { scale: 1.02 } : undefined}
          style={{ flex: 2, height: 46, background: sel ? T.royalBurgundy : T.taupe, opacity: sel ? 1 : 0.5, color: "#fff", border: "none", borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: sel ? "pointer" : "not-allowed" }}>
          Assign
        </motion.button>
        <button onClick={onClose} style={{ flex: 1, height: 46, background: "transparent", border: `1.5px solid ${T.borderDef}`, borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.taupe, cursor: "pointer" }}>Cancel</button>
      </div>
    </PickerShell>
  );
}

// ── Design Code Picker ────────────────────────────────────────────────────────
function DesignCodePickerModal({ onClose, onSelect }: { onClose: () => void; onSelect: (code: string) => void }) {
  const { designs, addDesign } = useDesignLibrary();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const [mode, setMode] = useState<"search" | "new">("search");
  const [newCode, setNewCode] = useState("");
  const [newWeaver, setNewWeaver] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const filtered = designs.filter(d =>
    d.code.toLowerCase().includes(q.toLowerCase()) ||
    (d.name && d.name.toLowerCase().includes(q.toLowerCase()))
  );

  function handleSaveNew() {
    if (!newCode.trim()) return;
    const entry: DesignEntry = {
      code: newCode.trim(), name: "", typeCode: "", typeName: "",
      desc: "", weaverName: newWeaver.trim(), notesForWeaver: newNotes.trim(),
      colorSlipPhoto: null, designGraph: null,
      batches: 0, total: 0, hasColorSlip: false, hasGraph: false,
    };
    addDesign(entry);
    onSelect(newCode.trim());
  }

  return (
    <PickerShell title="Assign Design Code" onClose={onClose} width={540}>
      {/* Mode toggle */}
      <div style={{ padding: "0 24px 16px", display: "flex", gap: 8 }}>
        {(["search", "new"] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            style={{ flex: 1, height: 38, border: `1.5px solid ${mode === m ? T.royalBurgundy : T.borderDef}`, borderRadius: 10, background: mode === m ? T.royalBurgundy : "transparent", color: mode === m ? "#fff" : T.taupe, fontFamily: F.ui, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            {m === "search" ? "Select Existing" : "+ Create New"}
          </button>
        ))}
      </div>

      {mode === "search" ? (
        <>
          <div style={{ padding: "0 24px 12px", position: "relative" }}>
            <MagnifyingGlass size={16} color={T.taupe} style={{ position: "absolute", left: 38, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search design code or name…"
              style={{ ...fld, paddingLeft: 40 }} autoFocus />
          </div>
          <div style={{ padding: "0 24px", maxHeight: 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
            {filtered.map(d => (
              <button key={d.code} onClick={() => setSel(d.code)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", border: `2px solid ${sel === d.code ? T.royalBurgundy : T.borderDef}`, borderRadius: 11, background: sel === d.code ? "rgba(110,15,45,0.05)" : T.warmIvory, cursor: "pointer", textAlign: "left" }}>
                <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.08)", borderRadius: 6, padding: "3px 10px", flexShrink: 0 }}>{d.code}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {d.name && <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</div>}
                  {d.weaverName && <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Weaver: {d.weaverName}</div>}
                </div>
                {(d.hasGraph || d.hasColorSlip) && (
                  <div style={{ display: "flex", gap: 4 }}>
                    {d.hasColorSlip && <span style={{ fontFamily: F.ui, fontSize: 10, background: "rgba(30,102,64,0.10)", color: T.green, borderRadius: 5, padding: "2px 7px", fontWeight: 600 }}>Slip</span>}
                    {d.hasGraph && <span style={{ fontFamily: F.ui, fontSize: 10, background: "rgba(30,102,64,0.10)", color: T.green, borderRadius: 5, padding: "2px 7px", fontWeight: 600 }}>Graph</span>}
                  </div>
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "24px 0", fontFamily: F.ui, fontSize: 14, color: T.taupe }}>
                No designs match "{q}".<br />
                <button onClick={() => { setMode("new"); setNewCode(q); }} style={{ marginTop: 10, fontFamily: F.ui, fontSize: 13, color: T.royalBurgundy, background: "none", border: "none", cursor: "pointer", fontWeight: 700, textDecoration: "underline" }}>
                  Create "{q}" as new design code →
                </button>
              </div>
            )}
          </div>
          <div style={{ padding: "16px 24px 24px", display: "flex", gap: 10 }}>
            <motion.button onClick={() => { if (sel) onSelect(sel); }} disabled={!sel} whileHover={sel ? { scale: 1.02 } : undefined}
              style={{ flex: 2, height: 46, background: sel ? T.royalBurgundy : T.taupe, opacity: sel ? 1 : 0.5, color: "#fff", border: "none", borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: sel ? "pointer" : "not-allowed" }}>
              Assign Design Code
            </motion.button>
            <button onClick={onClose} style={{ flex: 1, height: 46, background: "transparent", border: `1.5px solid ${T.borderDef}`, borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.taupe, cursor: "pointer" }}>Cancel</button>
          </div>
        </>
      ) : (
        <div style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={lbl}>Design Code <span style={{ color: T.royalBurgundy }}>*</span></label>
            <input value={newCode} onChange={e => setNewCode(e.target.value)} style={fld} placeholder="e.g. BKB-099" autoFocus />
          </div>
          <div>
            <label style={lbl}>Weaver Name <span style={{ fontWeight: 400, color: T.taupe }}>(optional)</span></label>
            <input value={newWeaver} onChange={e => setNewWeaver(e.target.value)} style={fld} placeholder="Assign a weaver later if needed" />
          </div>
          <div>
            <label style={lbl}>Notes for Weaver <span style={{ fontWeight: 400, color: T.taupe }}>(optional)</span></label>
            <textarea value={newNotes} onChange={e => setNewNotes(e.target.value)} rows={2} placeholder="Instructions to appear in the Design Library…"
              style={{ width: "100%", padding: "12px 14px", fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, background: T.warmIvory, border: `1.5px solid ${T.borderDef}`, borderRadius: 10, outline: "none", resize: "none", lineHeight: 1.6, boxSizing: "border-box" }} />
          </div>
          <div style={{ background: "rgba(200,155,71,0.09)", border: "1px solid rgba(200,155,71,0.28)", borderRadius: 10, padding: "11px 14px", display: "flex", alignItems: "flex-start", gap: 8 }}>
            <WarningCircle size={15} color={T.antiqueGold} weight="fill" style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontFamily: F.ui, fontSize: 12, color: "#8B6018", lineHeight: 1.5 }}>
              This design code will be saved to the master Design Library immediately and will appear there with full detail.
            </span>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <motion.button onClick={handleSaveNew} disabled={!newCode.trim()} whileHover={newCode.trim() ? { scale: 1.02 } : undefined}
              style={{ flex: 2, height: 46, background: newCode.trim() ? T.green : T.taupe, opacity: newCode.trim() ? 1 : 0.5, color: "#fff", border: "none", borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: newCode.trim() ? "pointer" : "not-allowed" }}>
              Save to Library & Assign
            </motion.button>
            <button onClick={() => setMode("search")} style={{ flex: 1, height: 46, background: "transparent", border: `1.5px solid ${T.borderDef}`, borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.taupe, cursor: "pointer" }}>Back</button>
          </div>
        </div>
      )}
    </PickerShell>
  );
}

// ── Saree Type Picker ─────────────────────────────────────────────────────────
function SareeTypePickerModal({ onClose, onSelect }: { onClose: () => void; onSelect: (code: string, name: string) => void }) {
  const [sel, setSel] = useState<string | null>(null);
  return (
    <PickerShell title="Assign Saree Type" onClose={onClose}>
      <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: 8 }}>
        {SAREE_TYPES_BRIEF.map(t => (
          <button key={t.code} onClick={() => setSel(t.code)}
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 16px", border: `2px solid ${sel === t.code ? T.royalBurgundy : T.borderDef}`, borderRadius: 12, background: sel === t.code ? "rgba(110,15,45,0.05)" : T.warmIvory, cursor: "pointer", textAlign: "left" }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: "rgba(110,15,45,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 700, color: T.royalBurgundy }}>{t.code}</span>
            </div>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>{t.name}</div>
              <div style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>{t.code}</div>
            </div>
          </button>
        ))}
      </div>
      <div style={{ padding: "16px 24px 24px", display: "flex", gap: 10 }}>
        <motion.button onClick={() => { const t = SAREE_TYPES_BRIEF.find(x => x.code === sel); if (t) onSelect(t.code, t.name); }} disabled={!sel} whileHover={sel ? { scale: 1.02 } : undefined}
          style={{ flex: 2, height: 46, background: sel ? T.royalBurgundy : T.taupe, opacity: sel ? 1 : 0.5, color: "#fff", border: "none", borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: sel ? "pointer" : "not-allowed" }}>
          Assign Saree Type
        </motion.button>
        <button onClick={onClose} style={{ flex: 1, height: 46, background: "transparent", border: `1.5px solid ${T.borderDef}`, borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.taupe, cursor: "pointer" }}>Cancel</button>
      </div>
    </PickerShell>
  );
}

// ── Per-weaver Loom Picker (capped to that weaver's own loom count) ──────────
function WeaverLoomPickerModal({ weaver, current, onClose, onSelect }: {
  weaver: typeof WEAVERS[0]; current: number | null; onClose: () => void; onSelect: (loomNum: number) => void;
}) {
  const [sel, setSel] = useState<number | null>(current);
  const LOOMS = Array.from({ length: weaver.loom }, (_, i) => i + 1);
  return (
    <PickerShell title={`Select Loom for ${weaver.name}`} onClose={onClose} width={400}>
      <div style={{ padding: "0 24px 8px", fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>
        {weaver.name} operates {weaver.loom} loom{weaver.loom !== 1 ? "s" : ""}.
      </div>
      <div style={{ padding: "8px 24px 0", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {LOOMS.map(loom => (
          <button key={loom} onClick={() => setSel(loom)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: "16px 12px",
              border: `2px solid ${sel === loom ? T.royalBurgundy : T.borderDef}`, borderRadius: 12,
              background: sel === loom ? "rgba(110,15,45,0.05)" : T.warmIvory, cursor: "pointer"
            }}>
            <div style={{ fontFamily: F.mono, fontSize: 18, fontWeight: 800, color: sel === loom ? T.royalBurgundy : T.luxuryBrown }}>
              L{loom}
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, fontWeight: 500 }}>
              Loom {loom}
            </div>
          </button>
        ))}
      </div>
      <div style={{ padding: "20px 24px 24px", display: "flex", gap: 10 }}>
        <motion.button onClick={() => { if (sel !== null) onSelect(sel); }} disabled={sel === null} whileHover={sel !== null ? { scale: 1.02 } : undefined}
          style={{ flex: 2, height: 46, background: sel !== null ? T.royalBurgundy : T.taupe, opacity: sel !== null ? 1 : 0.5, color: "#fff", border: "none", borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: sel !== null ? "pointer" : "not-allowed" }}>
          Assign Loom
        </motion.button>
        <button onClick={onClose} style={{ flex: 1, height: 46, background: "transparent", border: `1.5px solid ${T.borderDef}`, borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.taupe, cursor: "pointer" }}>Cancel</button>
      </div>
    </PickerShell>
  );
}

// ── Factory Loom Picker (assigns a factory loom instead of a weaver) ─────────
function FactoryLoomPickerModal({ onClose, onSelect }: { onClose: () => void; onSelect: (loom: typeof FACTORY_LOOMS_LIST[0]) => void }) {
  const [sel, setSel] = useState<string | null>(null);
  const statusColor = (s: string) => s === "active" ? T.green : s === "maintenance" ? T.red : T.taupe;
  return (
    <PickerShell title="Assign Factory Loom" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 24px" }}>
        {FACTORY_LOOMS_LIST.map(l => (
          <button key={l.id} onClick={() => setSel(l.id)}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", border: `2px solid ${sel === l.id ? T.royalBurgundy : T.borderDef}`, borderRadius: 12, background: sel === l.id ? "rgba(110,15,45,0.05)" : T.warmIvory, cursor: "pointer", textAlign: "left" }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(110,15,45,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Factory size={17} color={T.royalBurgundy} weight="duotone" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{l.loomNumber}</div>
              <div style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>{l.id} · {l.location}</div>
            </div>
            <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: statusColor(l.status), textTransform: "capitalize" }}>{l.status}</span>
          </button>
        ))}
      </div>
      <div style={{ padding: "16px 24px 24px", display: "flex", gap: 10 }}>
        <motion.button onClick={() => { const l = FACTORY_LOOMS_LIST.find(x => x.id === sel); if (l) onSelect(l); }} disabled={!sel}
          whileHover={sel ? { scale: 1.02 } : undefined}
          style={{ flex: 2, height: 46, background: sel ? T.royalBurgundy : T.taupe, opacity: sel ? 1 : 0.5, color: "#fff", border: "none", borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: sel ? "pointer" : "not-allowed" }}>
          Assign Factory Loom
        </motion.button>
        <button onClick={onClose} style={{ flex: 1, height: 46, background: "transparent", border: `1.5px solid ${T.borderDef}`, borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.taupe, cursor: "pointer" }}>Cancel</button>
      </div>
    </PickerShell>
  );
}

// ── Generic picker shell ──────────────────────────────────────────────────────
function PickerShell({ title, onClose, children, width = 480 }: { title: string; onClose: () => void; children: React.ReactNode; width?: number }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 800, background: "rgba(30,10,20,0.5)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
      <motion.div onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.94, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
        style={{ background: T.warmIvory, borderRadius: 20, width, maxWidth: "calc(100vw - 48px)", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(44,6,27,0.28)", border: `1px solid ${T.borderDef}` }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: F.display, fontSize: 17, fontWeight: 700, color: T.luxuryBrown }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.taupe, fontSize: 20, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ paddingTop: 16 }}>{children}</div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
type ActivePicker = "weaver" | "bulkorder" | "factoryloom" | "saretype" | "design" | null;

export function BatchCreationPage() {
  const { batches, saveDraft, finalizeBatch, nextBatchId, pendingOpenBatchId, setPendingOpenBatchId } = useBatches();
  const { designs } = useDesignLibrary();

  // ── Tab: "new" or "drafts"
  const [tab, setTab] = useState<"new" | "drafts">("new");

  // ── Editing state: either creating new or editing a draft
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);

  // ── Step 1 form
  const [batchId, setBatchId] = useState(nextBatchId);
  const [totalCount, setTotalCount] = useState<string>("");
  const [dueDate, setDueDate] = useState("");
  const [generated, setGenerated] = useState(false);

  // ── Saree rows
  const [rows, setRows] = useState<SareeRow[]>([]);

  // ── Selection
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // ── Active picker
  const [picker, setPicker] = useState<ActivePicker>(null);

  // ── Card view modals
  const [viewDesign, setViewDesign] = useState<DesignEntry | null>(null);
  const [viewSareeType, setViewSareeType] = useState<SareeTypeRecord | null>(null);
  const [viewWeaver, setViewWeaver] = useState<typeof WEAVERS[0] | null>(null);
  const [viewFactoryLoom, setViewFactoryLoom] = useState<typeof FACTORY_LOOMS_LIST[0] | null>(null);
  const [viewBulkOrder, setViewBulkOrder] = useState<any | null>(null);
  const [viewSareeRow, setViewSareeRow] = useState<SareeRow | null>(null);

  // ── Per-row loom picker (scoped to that row's weaver's own loom count)
  const [loomPickerRow, setLoomPickerRow] = useState<SareeRow | null>(null);

  // ── Sort control
  const [sortBy, setSortBy] = useState<"serial" | "weaver" | "factoryLoom">("serial");

  const { issueRecords } = useMaterialIssue();

  // ── Saved feedback
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  // Keep batchId in sync with next available when not editing a draft
  useEffect(() => {
    if (!editingBatchId) setBatchId(nextBatchId);
  }, [nextBatchId, editingBatchId]);

  // ── Generate rows
  function generateRows() {
    const n = parseInt(totalCount, 10);
    if (!n || n < 1 || n > 500) return;
    setRows(Array.from({ length: n }, (_, i) => ({
      serial: i + 1,
      sareeId: null, recipientType: undefined,
      weaverId: null, weaverName: null, weaverInitials: null, weaverLoom: null,
      factoryLoomId: null, factoryLoomNumber: null,
      designCode: null, sareeTypeCode: null, sareeTypeName: null,
      bulkOrderRef: null, bulkOrderLabel: null,
    })));
    setSelected(new Set());
    setGenerated(true);
  }

  // ── Selection helpers
  const allSelected = rows.length > 0 && selected.size === rows.length;
  function toggleAll() { setSelected(allSelected ? new Set() : new Set(rows.map(r => r.serial))); }
  function toggleRow(serial: number) {
    setSelected(prev => { const n = new Set(prev); n.has(serial) ? n.delete(serial) : n.add(serial); return n; });
  }

  // ── Apply weaver to selected rows
  function applyWeaver(w: typeof WEAVERS[0]) {
    // Per-weaver sequence tracking within this batch
    const seqMap: Record<string, number> = {};
    rows.forEach(r => {
      if (r.weaverId === w.id && r.sareeId) {
        const m = r.sareeId.match(/-(\d+)$/);
        if (m) {
          const n = parseInt(m[1], 10);
          seqMap[w.id] = Math.max(seqMap[w.id] || 0, n);
        }
      }
    });
    let seq = seqMap[w.id] || 0;
    setRows(prev => prev.map(r => {
      if (!selected.has(r.serial)) return r;
      seq++;
      return {
        ...r, recipientType: "weaver" as const,
        weaverId: w.id, weaverName: w.name, weaverInitials: w.initials, weaverLoom: 1,
        factoryLoomId: null, factoryLoomNumber: null,
        sareeId: generateSareeId(w.name, 1, seq),
      };
    }));
    setPicker(null);
  }

  // ── Apply a specific loom (scoped to that weaver's own loom count) to one row
  function applyWeaverLoomToRow(row: SareeRow, loomNum: number) {
    setRows(prev => prev.map(r => {
      if (r.serial !== row.serial) return r;
      const seqMatch = r.sareeId ? r.sareeId.match(/-(\d+)$/) : null;
      const seq = seqMatch ? parseInt(seqMatch[1], 10) : r.serial;
      const newSareeId = r.weaverName ? generateSareeId(r.weaverName, loomNum, seq) : r.sareeId;
      return { ...r, weaverLoom: loomNum, sareeId: newSareeId };
    }));
    setLoomPickerRow(null);
  }

  // ── Apply a factory loom to selected rows (replaces any weaver assignment)
  function applyFactoryLoom(loom: typeof FACTORY_LOOMS_LIST[0]) {
    const seqMap: Record<string, number> = {};
    rows.forEach(r => {
      if (r.factoryLoomId === loom.id && r.sareeId) {
        const m = r.sareeId.match(/-(\d+)$/);
        if (m) {
          const n = parseInt(m[1], 10);
          seqMap[loom.id] = Math.max(seqMap[loom.id] || 0, n);
        }
      }
    });
    let seq = seqMap[loom.id] || 0;
    setRows(prev => prev.map(r => {
      if (!selected.has(r.serial)) return r;
      seq++;
      return {
        ...r, recipientType: "factoryLoom" as const,
        weaverId: null, weaverName: null, weaverInitials: null, weaverLoom: null,
        factoryLoomId: loom.id, factoryLoomNumber: loom.loomNumber,
        sareeId: `${loom.id}-${String(seq).padStart(3, "0")}`,
      };
    }));
    setPicker(null);
  }

  const { bulkOrders } = useBulkOrders();

  // ── Apply bulk order
  function applyBulkOrder(ref: string | null, label: string) {
    const order = bulkOrders.find(o => o.ref === ref);
    let sareeTypeCode = null;
    let sareeTypeName = null;
    let designCode = null;
    if (order) {
      const match = order.sareeType.match(/(.*)\s+·\s+(.*)/) || order.sareeType.match(/(.*)·(.*)/);
      if (match) {
        sareeTypeName = match[1].trim();
        sareeTypeCode = match[2].trim();
      } else {
        sareeTypeName = order.sareeType;
      }
      designCode = order.design;
    }

    setRows(prev => prev.map(r => {
      if (!selected.has(r.serial)) return r;
      return {
        ...r,
        bulkOrderRef: ref,
        bulkOrderLabel: label,
        ...(order ? { sareeTypeCode, sareeTypeName, designCode } : {})
      };
    }));
    setPicker(null);
  }

  // ── Apply design code
  function applyDesign(code: string) {
    setRows(prev => prev.map(r => selected.has(r.serial) ? { ...r, designCode: code } : r));
    setPicker(null);
  }

  // ── Apply saree type
  function applySareeType(code: string, name: string) {
    setRows(prev => prev.map(r => selected.has(r.serial) ? { ...r, sareeTypeCode: code, sareeTypeName: name } : r));
    setPicker(null);
  }

  // ── Remove selected rows
  function removeSelected() {
    setRows(prev => prev.filter(r => !selected.has(r.serial)).map((r, i) => ({ ...r, serial: i + 1 })));
    setSelected(new Set());
  }

  // ── Save as draft
  function handleSaveDraft() {
    const record: BatchRecord = {
      batchId, totalCount: rows.length, dueDate, rows,
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveDraft(record);
    setEditingBatchId(batchId);
    setSavedMsg("Saved as draft.");
    setTimeout(() => setSavedMsg(null), 3000);
  }

  // ── Finalize
  const completeRows = rows.filter(rowComplete);
  const incompleteRows = rows.filter(r => !rowComplete(r));
  const canFinalize = rows.length > 0 && incompleteRows.length === 0;

  function handleFinalize() {
    if (!canFinalize) return;
    const record: BatchRecord = {
      batchId, totalCount: rows.length, dueDate, rows,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveDraft(record);
    finalizeBatch(batchId);
    setSavedMsg(`Batch ${batchId} finalized and active!`);
    
    // Clear and reset the form state so the user can create the next batch
    setTimeout(() => {
      setSavedMsg(null);
      setRows([]);
      setTotalCount("");
      setDueDate("");
      setGenerated(false);
      setSelected(new Set());
      setEditingBatchId(null);
    }, 2000);
  }

  // ── Open a draft for editing
  function openDraft(b: BatchRecord) {
    setEditingBatchId(b.batchId);
    setBatchId(b.batchId);
    setTotalCount(String(b.totalCount));
    setDueDate(b.dueDate);
    setRows(b.rows);
    setGenerated(true);
    setSelected(new Set());
    setTab("new");
  }

  // ── Auto-open batch signaled from another page (e.g. "Open in Batch Creation" from ProductionPage)
  useEffect(() => {
    if (pendingOpenBatchId) {
      const b = batches.find(x => x.batchId === pendingOpenBatchId);
      if (b) openDraft(b);
      setPendingOpenBatchId(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingOpenBatchId]);

  // ── Design/SareeType for card view
  function openDesignCard(code: string) {
    const d = designs.find(x => x.code === code);
    if (d) setViewDesign(d);
  }
  function openSareeTypeCard(code: string) {
    const r = SAREE_TYPE_RECORDS.find(x => x.code === code);
    if (r) setViewSareeType(r);
  }

  // ── Status dot per row
  function StatusDot({ row }: { row: SareeRow }) {
    const complete = rowComplete(row);
    const empty = rowEmpty(row);
    const color = complete ? T.green : empty ? T.taupe : T.amber;
    const title = complete ? "Complete" : empty ? "Not started" : "Partially filled";
    return <div title={title} style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />;
  }

  const drafts = batches.filter(b => b.status === "draft");
  const active = batches.filter(b => b.status === "active");

  // ── Sorted view of rows (does not mutate underlying row order/serials)
  const displayRows = [...rows].sort((a, b) => {
    if (sortBy === "weaver") {
      const an = a.weaverName || "￿", bn = b.weaverName || "￿";
      return an.localeCompare(bn) || a.serial - b.serial;
    }
    if (sortBy === "factoryLoom") {
      const an = a.factoryLoomNumber || "￿", bn = b.factoryLoomNumber || "￿";
      return an.localeCompare(bn) || a.serial - b.serial;
    }
    return a.serial - b.serial;
  });

  // ── Merge "Materials Given" cell across consecutive rows for the same weaver/factory loom
  const materialsCellSpan: Record<number, number> = {}; // serial -> rowSpan (only set for the first row of a run)
  {
    let i = 0;
    while (i < displayRows.length) {
      const key = displayRows[i].weaverId || displayRows[i].factoryLoomId || null;
      let span = 1;
      if (key) {
        while (i + span < displayRows.length && (displayRows[i + span].weaverId || displayRows[i + span].factoryLoomId) === key) {
          span++;
        }
      }
      materialsCellSpan[displayRows[i].serial] = span;
      i += span;
    }
  }

  return (
    <div style={{ background: T.silkCream, minHeight: "100vh", fontFamily: F.ui }}>

      {/* ── Header ── */}
      <div style={{ background: G.header, padding: "32px 56px 64px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -40, bottom: -60, width: 320, height: 320, borderRadius: "50%", border: "1px solid rgba(200,155,71,0.14)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", right: 60, bottom: -10, width: 180, height: 180, borderRadius: "50%", border: "1px solid rgba(200,155,71,0.08)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: "0.14em", color: T.antiqueGold, textTransform: "uppercase", marginBottom: 10 }}>
            Since 1999 · Production
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 38, fontWeight: 700, color: "#fff", margin: "0 0 4px", lineHeight: 1.1 }}>Batch Creation</h1>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontStyle: "italic", color: T.antiqueGold, marginBottom: 12 }}>& Management</div>
          <p style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,255,255,0.55)", maxWidth: 500, margin: 0, lineHeight: 1.6 }}>
            Create a new production batch, assign weavers, design codes, and bulk orders to individual sarees, then finalize or save as draft.
          </p>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div style={{ padding: "0 48px", marginTop: -36, position: "relative", zIndex: 20 }}>
        <div style={{ background: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)", borderRadius: 14, display: "grid", gridTemplateColumns: "1fr 1px 1fr 1px 1fr 1px 1fr", boxShadow: "0 8px 28px rgba(44,6,27,0.22)", overflow: "hidden" }}>
          {[
            { label: "Active Batches",   val: active.length    },
            { label: "Draft Batches",    val: drafts.length    },
            { label: "Total Sarees",     val: [...active, ...drafts].reduce((s, b) => s + b.totalCount, 0) },
            { label: "Weavers Active",   val: WEAVERS.length, gold: true },
          ].flatMap((s, i, arr) => {
            const cell = (
              <div key={s.label} style={{ padding: "20px 28px", background: s.gold ? "linear-gradient(135deg, rgba(200,155,71,0.18) 0%, rgba(200,155,71,0.08) 100%)" : undefined, borderTop: s.gold ? `3px solid ${T.antiqueGold}` : undefined }}>
                <div style={{ fontFamily: F.mono, fontSize: 9, color: s.gold ? T.goldLight : "rgba(255,255,255,0.40)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: s.gold ? T.goldLight : "#fff", lineHeight: 1 }}>{s.val}</div>
              </div>
            );
            return i < arr.length - 1 ? [cell, <div key={`d${i}`} style={{ background: "rgba(255,255,255,0.08)" }} />] : [cell];
          })}
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ padding: "32px 56px 0" }}>
        <div style={{ display: "flex", gap: 4, background: "#fff", borderRadius: 12, padding: 4, width: "fit-content", border: `1px solid ${T.borderDef}` }}>
          {/* New Batch */}
          <button
            onClick={() => {
              if (editingBatchId) {
                setEditingBatchId(null);
                setBatchId(nextBatchId);
                setRows([]);
                setTotalCount("");
                setDueDate("");
                setGenerated(false);
                setSelected(new Set());
              }
              setTab("new");
            }}
            style={{
              padding: "9px 20px",
              borderRadius: 9,
              border: "none",
              background: tab === "new" && !editingBatchId ? T.royalBurgundy : "transparent",
              color: tab === "new" && !editingBatchId ? "#fff" : T.taupe,
              fontFamily: F.ui,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.18s"
            }}
          >
            Create New Batch
          </button>

          {/* Edit Batch (Conditional) */}
          {editingBatchId && (
            <button
              onClick={() => setTab("new")}
              style={{
                padding: "9px 20px",
                borderRadius: 9,
                border: "none",
                background: tab === "new" ? T.royalBurgundy : "transparent",
                color: tab === "new" ? "#fff" : T.taupe,
                fontFamily: F.ui,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.18s"
              }}
            >
              Edit {editingBatchId}
            </button>
          )}

          {/* All Batches */}
          <button
            onClick={() => setTab("drafts")}
            style={{
              padding: "9px 20px",
              borderRadius: 9,
              border: "none",
              background: tab === "drafts" ? T.royalBurgundy : "transparent",
              color: tab === "drafts" ? "#fff" : T.taupe,
              fontFamily: F.ui,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.18s"
            }}
          >
            All Batches ({batches.length})
          </button>
        </div>
      </div>

      {/* ════════════════════ TAB: NEW BATCH ════════════════════ */}
      {tab === "new" && (
        <div style={{ padding: "28px 56px 64px" }}>

          {/* Step 1: Setup form */}
          <div style={{ background: "#fff", borderRadius: 18, border: `1.5px solid ${T.borderDef}`, padding: "28px 32px", marginBottom: 24, boxShadow: "0 2px 12px rgba(74,6,27,0.05)" }}>
            <div style={{ fontFamily: F.display, fontSize: 17, fontWeight: 700, color: T.luxuryBrown, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: T.royalBurgundy, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: "#fff" }}>1</span>
              </div>
              Batch Setup
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 16, alignItems: "end" }}>
              <div>
                <label style={lbl}>Batch ID</label>
                <div style={{ ...fld, display: "flex", alignItems: "center", background: T.warmCream, color: T.taupe, fontFamily: F.mono, fontSize: 14, fontWeight: 700, borderStyle: "dashed", cursor: "default" }}>
                  {batchId}
                </div>
              </div>
              <div>
                <label style={lbl}>Total Saree Count <span style={{ color: T.royalBurgundy }}>*</span></label>
                <input type="number" min={1} max={500} value={totalCount}
                  onChange={e => { setTotalCount(e.target.value); setGenerated(false); }}
                  style={fld} placeholder="e.g. 30" />
              </div>
              <div>
                <label style={lbl}>Due Date</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={fld} />
              </div>
              <motion.button onClick={generateRows} disabled={!totalCount || parseInt(totalCount, 10) < 1}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                style={{ height: 44, padding: "0 24px", background: totalCount && parseInt(totalCount, 10) > 0 ? G.button : T.taupe, color: "#fff", border: "none", borderRadius: 10, fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", opacity: totalCount && parseInt(totalCount, 10) > 0 ? 1 : 0.5 }}>
                Generate Table →
              </motion.button>
            </div>
          </div>

          {/* Step 2+3: Table */}
          {generated && rows.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 18, border: `1.5px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 12px rgba(74,6,27,0.05)", marginBottom: 20 }}>

              {/* Table header + action bar */}
              <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>
                    {rows.length} Sarees
                  </div>
                  <span style={{ fontFamily: F.ui, fontSize: 12, background: "rgba(30,102,64,0.08)", color: T.green, border: "1px solid rgba(30,102,64,0.20)", borderRadius: 20, padding: "3px 10px", fontWeight: 600 }}>
                    {completeRows.length} complete
                  </span>
                  {incompleteRows.length > 0 && (
                    <span style={{ fontFamily: F.ui, fontSize: 12, background: "rgba(183,121,31,0.10)", color: T.amber, border: "1px solid rgba(183,121,31,0.25)", borderRadius: 20, padding: "3px 10px", fontWeight: 600 }}>
                      {incompleteRows.length} incomplete
                    </span>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 8 }}>
                    <SortAscending size={14} color={T.taupe} weight="bold" />
                    <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Sort by</span>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
                      style={{ height: 30, borderRadius: 8, border: `1.5px solid ${T.borderDef}`, padding: "0 8px", fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, background: "#fff", cursor: "pointer" }}>
                      <option value="serial">Default (#)</option>
                      <option value="weaver">Weaver</option>
                      <option value="factoryLoom">Factory Loom</option>
                    </select>
                  </div>
                </div>
                {selected.size > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{selected.size} selected</span>
                    {([
                      { key: "weaver",     icon: <Users size={14} weight="bold" />,       label: "Assign Weaver" },
                      { key: "bulkorder",  icon: <ShoppingBag size={14} weight="bold" />, label: "Assign Bulk Order" },
                      { key: "factoryloom", icon: <Factory size={14} weight="bold" />,     label: "Assign Factory Loom" },
                      { key: "saretype",   icon: <Tag size={14} weight="bold" />,          label: "Assign Saree Type" },
                    ] as const).map(a => (
                      <motion.button key={a.key} onClick={() => setPicker(a.key as ActivePicker)}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        style={{ display: "flex", alignItems: "center", gap: 6, height: 34, padding: "0 14px", background: T.royalBurgundy, color: "#fff", border: "none", borderRadius: 9, fontFamily: F.ui, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                        {a.icon} {a.label}
                      </motion.button>
                    ))}
                    <motion.button onClick={removeSelected} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      style={{ display: "flex", alignItems: "center", gap: 6, height: 34, padding: "0 14px", background: "rgba(192,57,43,0.10)", color: T.red, border: `1px solid rgba(192,57,43,0.25)`, borderRadius: 9, fontFamily: F.ui, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      <Trash size={14} weight="bold" /> Remove Row(s)
                    </motion.button>
                  </div>
                )}
              </div>

              {/* Table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
                  <thead>
                    <tr style={{ background: T.warmCream }}>
                      <th style={th}>
                        <button onClick={toggleAll} style={{ background: "none", border: "none", cursor: "pointer", color: T.royalBurgundy, display: "flex", alignItems: "center" }}>
                          {allSelected ? <CheckSquare size={16} weight="fill" /> : <Square size={16} />}
                        </button>
                      </th>
                      {["#", "Saree ID", "Weaver / Factory Loom", "Loom No.", "Saree Type", "Bulk Order", "Materials Given", ""].map(h => (
                        <th key={h} style={th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayRows.map((row, idx) => {
                      const isSelected = selected.has(row.serial);
                      const complete = rowComplete(row);
                      const weaverForRow = row.weaverId ? WEAVERS.find(x => x.id === row.weaverId) : undefined;
                      const materialsSummary = (row.weaverId || row.factoryLoomId)
                        ? issueRecords
                            .filter(r => r.batchId === batchId && r.status !== "cancelled" && (
                              row.weaverId ? r.weaverId === row.weaverId : r.factoryLoomId === row.factoryLoomId
                            ))
                            .flatMap(r => r.materials)
                            .reduce((acc: Record<string, { qty: number; unit: string }>, m) => {
                              if (!acc[m.materialType]) acc[m.materialType] = { qty: 0, unit: m.unit };
                              acc[m.materialType].qty += m.quantity;
                              return acc;
                            }, {})
                        : null;
                      const materialsText = materialsSummary && Object.keys(materialsSummary).length > 0
                        ? Object.entries(materialsSummary).map(([type, v]) => `${type}: ${v.qty}${v.unit}`).join(", ")
                        : null;
                      return (
                        <tr key={row.serial}
                          style={{ background: isSelected ? "rgba(110,15,45,0.04)" : idx % 2 === 0 ? "#fff" : "rgba(247,242,234,0.5)", borderBottom: `1px solid ${T.borderDef}` }}>
                          <td style={td}>
                            <button onClick={() => toggleRow(row.serial)} style={{ background: "none", border: "none", cursor: "pointer", color: isSelected ? T.royalBurgundy : T.taupe, display: "flex", alignItems: "center" }}>
                              {isSelected ? <CheckSquare size={15} weight="fill" /> : <Square size={15} />}
                            </button>
                          </td>
                          <td style={{ ...td, fontFamily: F.mono, fontSize: 12, color: T.taupe, width: 40 }}>{row.serial}</td>
                          <td style={{ ...td, minWidth: 120 }}>
                            {row.sareeId ? (
                              <button onClick={() => setViewSareeRow(row)}
                                style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.08)", border: "none", borderRadius: 6, padding: "3px 9px", cursor: "pointer" }}>
                                {row.sareeId}
                              </button>
                            ) : (
                              <span style={{ color: "rgba(139,112,96,0.4)", fontSize: 11 }}>— assign weaver</span>
                            )}
                          </td>
                          <td style={{ ...td, minWidth: 150 }}>
                            {row.recipientType === "factoryLoom" && row.factoryLoomId ? (
                              <button onClick={() => {
                                const l = FACTORY_LOOMS_LIST.find(x => x.id === row.factoryLoomId);
                                if (l) setViewFactoryLoom(l);
                              }}
                                style={{ display: "flex", alignItems: "center", gap: 7, border: "none", background: "none", cursor: "pointer", padding: 0 }}>
                                <div style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(110,15,45,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  <Factory size={12} color={T.royalBurgundy} weight="fill" />
                                </div>
                                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, textDecoration: "underline", textDecorationColor: "rgba(110,15,45,0.2)" }}>{row.factoryLoomNumber}</span>
                              </button>
                            ) : row.weaverName ? (
                              <button onClick={() => { if (weaverForRow) setViewWeaver(weaverForRow); }}
                                style={{ display: "flex", alignItems: "center", gap: 7, border: "none", background: "none", cursor: "pointer", padding: 0 }}>
                                <Pip initials={row.weaverInitials!} bg={weaverForRow?.bg || T.taupe} size={22} />
                                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, textDecoration: "underline", textDecorationColor: "rgba(110,15,45,0.2)" }}>{row.weaverName}</span>
                              </button>
                            ) : <EmptyCell />}
                          </td>
                          <td style={{ ...td, minWidth: 90 }}>
                            {row.recipientType === "factoryLoom" ? (
                              <EmptyCell />
                            ) : row.weaverId ? (
                              <button onClick={() => setLoomPickerRow(row)}
                                style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.antiqueGold, background: "rgba(200,155,71,0.08)", border: `1.5px solid ${T.borderGold}`, borderRadius: 6, padding: "3px 9px", cursor: "pointer" }}>
                                {row.weaverLoom ? `Loom ${row.weaverLoom}` : "— select loom"}
                              </button>
                            ) : <EmptyCell />}
                          </td>

                          <td style={{ ...td, minWidth: 110 }}>
                            {row.sareeTypeCode ? (
                              <button onClick={() => openSareeTypeCard(row.sareeTypeCode!)}
                                style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: "#8B6018", background: "rgba(200,155,71,0.12)", border: "1px solid rgba(200,155,71,0.30)", borderRadius: 6, padding: "3px 9px", cursor: "pointer" }}>
                                {row.sareeTypeCode}
                              </button>
                            ) : <EmptyCell />}
                          </td>
                          <td style={{ ...td, minWidth: 140 }}>
                            {row.bulkOrderLabel ? (
                              <button onClick={() => {
                                const bo = bulkOrders.find(x => x.ref === row.bulkOrderRef);
                                if (bo) setViewBulkOrder(bo);
                              }}
                                style={{ border: "none", background: "none", cursor: "pointer", padding: 0, fontFamily: F.ui, fontSize: 12, color: row.bulkOrderRef ? T.royalBurgundy : T.green, fontWeight: 600, textDecoration: "underline", textDecorationColor: "rgba(110,15,45,0.2)" }}>
                                {row.bulkOrderLabel}
                              </button>
                            ) : <EmptyCell />}
                          </td>
                          {materialsCellSpan[row.serial] !== undefined && (
                            <td style={{ ...td, minWidth: 170, verticalAlign: "middle" }} rowSpan={materialsCellSpan[row.serial]}>
                              {materialsText ? (
                                <span style={{ fontFamily: F.ui, fontSize: 11.5, color: T.luxuryBrown }}>{materialsText}</span>
                              ) : <EmptyCell />}
                            </td>
                          )}
                          <td style={{ ...td, width: 24 }}>
                            <StatusDot row={row} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Step 5: Incomplete rows warning */}
          {generated && incompleteRows.length > 0 && (
            <div style={{ background: "rgba(183,121,31,0.08)", border: "1px solid rgba(183,121,31,0.28)", borderRadius: 12, padding: "14px 18px", marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 10 }}>
              <WarningCircle size={17} color={T.amber} weight="fill" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontFamily: F.ui, fontSize: 13, color: "#7A5A10", lineHeight: 1.6 }}>
                <strong>{incompleteRows.length} row(s) are incomplete</strong> — missing weaver or saree type.
                {" "}Rows {incompleteRows.slice(0, 8).map(r => r.serial).join(", ")}{incompleteRows.length > 8 ? "…" : ""} need attention.
                {" "}You can save as draft and complete them later, but <strong>Finalize</strong> will remain disabled until all rows are complete.
              </div>
            </div>
          )}

          {/* Step 5: Save buttons */}
          {generated && rows.length > 0 && (
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <motion.button onClick={handleSaveDraft} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                style={{ display: "flex", alignItems: "center", gap: 8, height: 48, padding: "0 28px", background: "transparent", border: `2px solid ${T.royalBurgundy}`, color: T.royalBurgundy, borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                <FloppyDisk size={17} weight="bold" /> Save as Draft
              </motion.button>
              <motion.button onClick={handleFinalize} disabled={!canFinalize}
                whileHover={canFinalize ? { scale: 1.02 } : undefined} whileTap={canFinalize ? { scale: 0.97 } : undefined}
                style={{ display: "flex", alignItems: "center", gap: 8, height: 48, padding: "0 28px", background: canFinalize ? G.green : T.taupe, color: "#fff", border: "none", borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: canFinalize ? "pointer" : "not-allowed", opacity: canFinalize ? 1 : 0.55 }}>
                <CheckCircle size={17} weight="bold" /> Finalize Batch
              </motion.button>
              {savedMsg && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  style={{ fontFamily: F.ui, fontSize: 13, color: T.green, fontWeight: 600 }}>
                  ✓ {savedMsg}
                </motion.div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════ TAB: DRAFTS ════════════════════ */}
      {tab === "drafts" && (
        <div style={{ padding: "28px 56px 64px" }}>
          {batches.length === 0 ? (
            <div style={{ background: "#fff", borderRadius: 18, border: `1.5px solid ${T.borderDef}`, padding: "56px 24px", textAlign: "center" }}>
              <Stack size={40} color={T.taupe} weight="duotone" style={{ marginBottom: 12 }} />
              <div style={{ fontFamily: F.display, fontSize: 18, color: T.taupe }}>No batches yet.</div>
              <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, marginTop: 6 }}>Create a batch to get started.</div>
              <motion.button onClick={() => setTab("new")} whileHover={{ scale: 1.02 }} style={{ marginTop: 20, height: 44, padding: "0 24px", background: G.button, color: "#fff", border: "none", borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                Create New Batch
              </motion.button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {batches.map(b => {
                const done = b.rows.filter(rowComplete).length;
                const pct = b.totalCount > 0 ? Math.round((done / b.totalCount) * 100) : 0;
                const isDraft = b.status === "draft";
                const isActive = b.status === "active";
                const isCompleted = b.status === "completed";
                const accentColor = isDraft ? T.royalBurgundy : isActive ? T.green : T.taupe;
                const chipBg = isDraft ? "rgba(110,15,45,0.08)" : isActive ? "rgba(30,102,64,0.09)" : "rgba(139,112,96,0.10)";
                const chipLabel = isDraft ? "DRAFT" : isActive ? "ACTIVE" : "COMPLETED";
                return (
                  <div key={b.batchId} style={{ background: "#fff", borderRadius: 16, border: `1.5px solid ${T.borderDef}`, borderLeft: `5px solid ${accentColor}`, padding: "20px 24px", boxShadow: "0 2px 10px rgba(74,6,27,0.05)", display: "flex", alignItems: "center", gap: 20 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: accentColor }}>{b.batchId}</span>
                        <span style={{ fontFamily: F.ui, fontSize: 12, background: chipBg, color: accentColor, borderRadius: 6, padding: "2px 9px", fontWeight: 600 }}>{chipLabel}</span>
                        {b.dueDate && <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Due: {b.dueDate}</span>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10 }}>
                        <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{b.totalCount} sarees total</span>
                        <span style={{ fontFamily: F.ui, fontSize: 13, color: T.green, fontWeight: 600 }}>{done} complete</span>
                        {b.totalCount - done > 0 && <span style={{ fontFamily: F.ui, fontSize: 13, color: T.amber, fontWeight: 600 }}>{b.totalCount - done} incomplete</span>}
                      </div>
                      <div style={{ height: 6, background: "rgba(110,15,45,0.10)", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? T.green : accentColor, borderRadius: 99, transition: "width 0.3s" }} />
                      </div>
                      <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 4 }}>{pct}% complete · Updated {new Date(b.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                    </div>
                    {!isCompleted && (
                      <motion.button onClick={() => openDraft(b)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        style={{ display: "flex", alignItems: "center", gap: 8, height: 42, padding: "0 20px", background: G.button, color: "#fff", border: "none", borderRadius: 11, fontFamily: F.ui, fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
                        {isDraft ? "Continue Editing" : "Open & Edit"} <ArrowRight size={14} weight="bold" />
                      </motion.button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Picker modals ── */}
      <AnimatePresence>
        {picker === "weaver"     && <WeaverPickerModal     key="wp" onClose={() => setPicker(null)} onSelect={applyWeaver} />}
        {picker === "bulkorder"  && <BulkOrderPickerModal  key="bp" onClose={() => setPicker(null)} onSelect={applyBulkOrder} />}
        {picker === "factoryloom" && <FactoryLoomPickerModal key="flp" onClose={() => setPicker(null)} onSelect={applyFactoryLoom} />}
        {picker === "design"     && <DesignCodePickerModal key="dp" onClose={() => setPicker(null)} onSelect={applyDesign} />}
        {picker === "saretype"   && <SareeTypePickerModal  key="sp" onClose={() => setPicker(null)} onSelect={applySareeType} />}
        {loomPickerRow && loomPickerRow.weaverId && (() => {
          const w = WEAVERS.find(x => x.id === loomPickerRow.weaverId);
          return w ? (
            <WeaverLoomPickerModal key="wlp" weaver={w} current={loomPickerRow.weaverLoom}
              onClose={() => setLoomPickerRow(null)}
              onSelect={(loomNum) => applyWeaverLoomToRow(loomPickerRow, loomNum)} />
          ) : null;
        })()}
        {viewDesign    && <DesignCodeCard  key="dc" design={viewDesign}    onClose={() => setViewDesign(null)} />}
        {viewSareeType && <SareeTypeCard   key="sc" sareeType={viewSareeType} onClose={() => setViewSareeType(null)} />}
        {viewWeaver    && <WeaverDetailsModal key="wv" weaver={viewWeaver} onClose={() => setViewWeaver(null)} />}
        {viewFactoryLoom && <FactoryLoomDetailsModal key="fld" loom={viewFactoryLoom} onClose={() => setViewFactoryLoom(null)} />}
        {viewBulkOrder && <BulkOrderDetailsModal key="bo" order={viewBulkOrder} onClose={() => setViewBulkOrder(null)} />}
        {viewSareeRow  && <SareeDetailsModal key="sr" row={viewSareeRow} onClose={() => setViewSareeRow(null)} />}
      </AnimatePresence>
    </div>
  );
}


// ── Detail Modals ────────────────────────────────────────────────────────────
function WeaverDetailsModal({ weaver, onClose }: { weaver: typeof WEAVERS[0]; onClose: () => void }) {
  return (
    <PickerShell title="Weaver Details" onClose={onClose} width={400}>
      <div style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Pip initials={weaver.initials} bg={weaver.bg} size={48} />
          <div>
            <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: T.luxuryBrown }}>{weaver.name}</div>
            <div style={{ fontFamily: F.mono, fontSize: 13, color: T.taupe }}>ID: {weaver.id}</div>
          </div>
        </div>
        <div style={{ height: 1, background: T.borderDef }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, fontWeight: 700, textTransform: "uppercase" }}>Looms Owned</div>
            <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown, marginTop: 2 }}>{weaver.loom} Loom{weaver.loom !== 1 ? "s" : ""}</div>
          </div>
          <div>
            <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, fontWeight: 700, textTransform: "uppercase" }}>Experience</div>
            <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown, marginTop: 2 }}>Master Weaver</div>
          </div>
        </div>
      </div>
    </PickerShell>
  );
}

function FactoryLoomDetailsModal({ loom, onClose }: { loom: typeof FACTORY_LOOMS_LIST[0]; onClose: () => void }) {
  const statusColor = loom.status === "active" ? T.green : loom.status === "maintenance" ? T.red : T.taupe;
  return (
    <PickerShell title="Factory Loom Details" onClose={onClose} width={400}>
      <div style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(110,15,45,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Factory size={24} color={T.royalBurgundy} weight="duotone" />
          </div>
          <div>
            <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: T.luxuryBrown }}>{loom.loomNumber}</div>
            <div style={{ fontFamily: F.mono, fontSize: 13, color: T.taupe }}>ID: {loom.id}</div>
          </div>
        </div>
        <div style={{ height: 1, background: T.borderDef }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, fontWeight: 700, textTransform: "uppercase" }}>Location</div>
            <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown, marginTop: 2 }}>{loom.location}</div>
          </div>
          <div>
            <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, fontWeight: 700, textTransform: "uppercase" }}>Status</div>
            <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: statusColor, marginTop: 2, textTransform: "capitalize" }}>{loom.status}</div>
          </div>
          <div>
            <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, fontWeight: 700, textTransform: "uppercase" }}>Operator</div>
            <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown, marginTop: 2 }}>{loom.operatorName}</div>
          </div>
          <div>
            <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, fontWeight: 700, textTransform: "uppercase" }}>Phone</div>
            <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown, marginTop: 2 }}>{loom.operatorPhone}</div>
          </div>
        </div>
        {loom.notes && (
          <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: "10px 12px", fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>
            {loom.notes}
          </div>
        )}
      </div>
    </PickerShell>
  );
}

function BulkOrderDetailsModal({ order, onClose }: { order: any; onClose: () => void }) {
  return (
    <PickerShell title="Bulk Order Details" onClose={onClose} width={450}>
      <div style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.06)", padding: "4px 10px", borderRadius: 8 }}>
            {order.ref}
          </span>
          <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: order.status === "completed" ? T.green : T.amber }}>
            {order.status}
          </span>
        </div>
        <div>
          <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: T.luxuryBrown }}>{order.customer}</div>
        </div>
        <div style={{ height: 1, background: T.borderDef }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, fontWeight: 700, textTransform: "uppercase" }}>Saree Type</div>
            <div style={{ fontFamily: F.ui, fontSize: 13.5, fontWeight: 600, color: T.luxuryBrown, marginTop: 2 }}>{order.sareeType}</div>
          </div>
          <div>
            <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, fontWeight: 700, textTransform: "uppercase" }}>Design Code</div>
            <div style={{ fontFamily: F.ui, fontSize: 13.5, fontWeight: 600, color: T.luxuryBrown, marginTop: 2 }}>{order.design}</div>
          </div>
          <div>
            <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, fontWeight: 700, textTransform: "uppercase" }}>Progress</div>
            <div style={{ fontFamily: F.ui, fontSize: 13.5, fontWeight: 600, color: T.luxuryBrown, marginTop: 2 }}>{order.done} / {order.total} sarees produced</div>
          </div>
          <div>
            <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, fontWeight: 700, textTransform: "uppercase" }}>Payment Status</div>
            <div style={{ fontFamily: F.ui, fontSize: 13.5, fontWeight: 600, color: T.luxuryBrown, marginTop: 2, textTransform: "capitalize" }}>{order.paymentStatus}</div>
          </div>
        </div>
      </div>
    </PickerShell>
  );
}

function SareeDetailsModal({ row, onClose }: { row: SareeRow; onClose: () => void }) {
  return (
    <PickerShell title="Saree Item Details" onClose={onClose} width={450}>
      <div style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.06)", padding: "4px 10px", borderRadius: 8 }}>
            {row.sareeId || "UNASSIGNED"}
          </span>
          <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.taupe }}>
            Serial #{row.serial}
          </span>
        </div>
        <div style={{ height: 1, background: T.borderDef }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {row.recipientType === "factoryLoom" ? (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Factory Loom</span>
              <span style={{ fontFamily: F.ui, fontSize: 13.5, fontWeight: 600, color: T.luxuryBrown }}>{row.factoryLoomNumber || "Not assigned"}</span>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Weaver Name</span>
                <span style={{ fontFamily: F.ui, fontSize: 13.5, fontWeight: 600, color: T.luxuryBrown }}>{row.weaverName || "Not assigned"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Loom Assigned</span>
                <span style={{ fontFamily: F.ui, fontSize: 13.5, fontWeight: 600, color: T.luxuryBrown }}>{row.weaverLoom ? `Loom ${row.weaverLoom}` : "Not assigned"}</span>
              </div>
            </>
          )}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Saree Type</span>
            <span style={{ fontFamily: F.ui, fontSize: 13.5, fontWeight: 600, color: T.luxuryBrown }}>{row.sareeTypeName || "Not assigned"} ({row.sareeTypeCode || "N/A"})</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Bulk Order Link</span>
            <span style={{ fontFamily: F.ui, fontSize: 13.5, fontWeight: 600, color: T.royalBurgundy }}>{row.bulkOrderLabel || "General Stock"}</span>
          </div>
        </div>
      </div>
    </PickerShell>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────
function EmptyCell() {
  return <span style={{ color: "rgba(139,112,96,0.35)", fontSize: 13, fontFamily: F.mono }}>—</span>;
}

const th: React.CSSProperties = {
  padding: "10px 14px", textAlign: "left", fontFamily: F.ui, fontSize: 11,
  fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px",
  borderBottom: `1px solid ${T.borderDef}`,
};
const td: React.CSSProperties = {
  padding: "11px 14px", verticalAlign: "middle",
};
