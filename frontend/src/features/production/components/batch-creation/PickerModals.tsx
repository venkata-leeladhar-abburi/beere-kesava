import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Factory, ShoppingBag, WarningCircle, MagnifyingGlass, Package,
} from "@phosphor-icons/react";
import { useBulkOrders } from "../../../bulk-orders/contexts/BulkOrderContext";
import { useDesignLibrary, DesignEntry } from "../../../design-library/contexts/DesignLibraryContext";
import { T, F, SAREE_TYPES_BRIEF, fld, lbl } from "./constants";
import { Pip } from "./constants";
import type { WeaverOption, LoomOption } from "../useBatchFormHandlers";

// Deterministic pip colour from a stable palette, keyed by id, so real
// weavers (fetched from the backend) still get a consistent avatar colour
// without needing a "bg" field the backend doesn't have.
const PIP_PALETTE = ["#6E0F2D", "#C4923A", "#8B7060", "#4A061B", "#A05080", "#1E6640", "#3D0E1A", "#2C4A8B"];
export function pipColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return PIP_PALETTE[hash % PIP_PALETTE.length];
}

// ─── Generic picker shell ──────────────────────────────────────────────────────
export function PickerShell({ title, onClose, children, width = 480 }: { title: string; onClose: () => void; children: React.ReactNode; width?: number }) {
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

// ── Weaver Picker ─────────────────────────────────────────────────────────────
export function WeaverPickerModal({ weavers, onClose, onSelect }: { weavers: WeaverOption[]; onClose: () => void; onSelect: (w: WeaverOption) => void }) {
  const [sel, setSel] = useState<string | null>(null);
  return (
    <PickerShell title="Assign Weaver" onClose={onClose}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 24px" }}>
        {weavers.map(w => (
          <button key={w.id} onClick={() => setSel(w.id)}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", border: `2px solid ${sel === w.id ? T.royalBurgundy : T.borderDef}`, borderRadius: 12, background: sel === w.id ? "rgba(110,15,45,0.05)" : T.warmIvory, cursor: "pointer", textAlign: "left" }}>
            <Pip initials={w.initials} bg={pipColor(w.id)} size={34} />
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{w.name}</div>
              <div style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>{w.looms} loom{w.looms !== 1 ? "s" : ""}</div>
            </div>
          </button>
        ))}
      </div>
      <div style={{ padding: "16px 24px 24px", display: "flex", gap: 10 }}>
        <motion.button onClick={() => { const w = weavers.find(x => x.id === sel); if (w) onSelect(w); }} disabled={!sel}
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
export function BulkOrderPickerModal({ onClose, onSelect }: { onClose: () => void; onSelect: (ref: string | null, label: string) => void }) {
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
export function DesignCodePickerModal({ onClose, onSelect }: { onClose: () => void; onSelect: (code: string) => void }) {
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
      desc: "", color: "", weaverName: newWeaver.trim(), notesForWeaver: newNotes.trim(),
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
export function SareeTypePickerModal({ onClose, onSelect }: { onClose: () => void; onSelect: (code: string, name: string) => void }) {
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
export function WeaverLoomPickerModal({ weaver, current, onClose, onSelect }: {
  weaver: WeaverOption; current: number | null; onClose: () => void; onSelect: (loomNum: number) => void;
}) {
  const [sel, setSel] = useState<number | null>(current);
  const LOOMS = Array.from({ length: weaver.looms }, (_, i) => i + 1);
  return (
    <PickerShell title={`Select Loom for ${weaver.name}`} onClose={onClose} width={400}>
      <div style={{ padding: "0 24px 8px", fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>
        {weaver.name} operates {weaver.looms} loom{weaver.looms !== 1 ? "s" : ""}.
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
export function FactoryLoomPickerModal({ looms, onClose, onSelect }: { looms: LoomOption[]; onClose: () => void; onSelect: (loom: LoomOption) => void }) {
  const [sel, setSel] = useState<string | null>(null);
  const statusColor = (s: string) => s.toLowerCase() === "active" ? T.green : s.toLowerCase() === "maintenance" ? T.red : T.taupe;
  return (
    <PickerShell title="Assign Factory Loom" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 24px" }}>
        {looms.map(l => (
          <button key={l.id} onClick={() => setSel(l.id)}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", border: `2px solid ${sel === l.id ? T.royalBurgundy : T.borderDef}`, borderRadius: 12, background: sel === l.id ? "rgba(110,15,45,0.05)" : T.warmIvory, cursor: "pointer", textAlign: "left" }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(110,15,45,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Factory size={17} color={T.royalBurgundy} weight="duotone" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{l.loomNumber}</div>
              <div style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>{l.location}</div>
            </div>
            <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: statusColor(l.status), textTransform: "capitalize" }}>{l.status.toLowerCase()}</span>
          </button>
        ))}
      </div>
      <div style={{ padding: "16px 24px 24px", display: "flex", gap: 10 }}>
        <motion.button onClick={() => { const l = looms.find(x => x.id === sel); if (l) onSelect(l); }} disabled={!sel}
          whileHover={sel ? { scale: 1.02 } : undefined}
          style={{ flex: 2, height: 46, background: sel ? T.royalBurgundy : T.taupe, opacity: sel ? 1 : 0.5, color: "#fff", border: "none", borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: sel ? "pointer" : "not-allowed" }}>
          Assign Factory Loom
        </motion.button>
        <button onClick={onClose} style={{ flex: 1, height: 46, background: "transparent", border: `1.5px solid ${T.borderDef}`, borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.taupe, cursor: "pointer" }}>Cancel</button>
      </div>
    </PickerShell>
  );
}
