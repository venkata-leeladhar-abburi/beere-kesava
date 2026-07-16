import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, ChevronDown, X, Check, Plus, Trash2, QrCode, Send, PenLine,
  CheckCircle2, Clock, AlertTriangle, Package, Layers, Sparkles, Eye,
} from "lucide-react";
import { useMaterialIssue, MaterialIssueRecord, IssuedMaterialItem } from "./MaterialIssueContext";

// ── Design Tokens (matches MaterialsPage.tsx / WeaversPage.tsx) ─────────────
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

// ── Local weaver directory (mirrors WeaversPage.tsx) ─────────────────────────
interface WeaverLite { id: string; name: string; village: string; initials: string; bg: string; status: "active" | "qc" | "idle"; looms: number; phone: string; }
const WEAVERS: WeaverLite[] = [
  { id: "WV-001", name: "Ravi Kumar",   village: "Dharmavaram, AP",        initials: "RK", bg: "#5A3E6B", status: "active", looms: 3, phone: "98765 43210" },
  { id: "WV-002", name: "Padma Veni",   village: "Pochampally, Telangana", initials: "PV", bg: "#9B6B8A", status: "active", looms: 2, phone: "87654 38834" },
  { id: "WV-007", name: "Suresh Murti", village: "Venkatagiri, AP",        initials: "SM", bg: "#2D6B6B", status: "qc",     looms: 2, phone: "76549 99982" },
  { id: "WV-005", name: "Anand K.",     village: "Pochampally, Telangana", initials: "AK", bg: "#4A6B4A", status: "active", looms: 2, phone: "65438 77723" },
  { id: "WV-012", name: "Meena R.",     village: "Siddipet, Telangana",    initials: "MR", bg: "#9B6B8A", status: "active", looms: 1, phone: "54327 66614" },
  { id: "WV-018", name: "Lakshmi D.",   village: "Dharmavaram, AP",        initials: "LD", bg: "#2D7D6B", status: "qc",     looms: 2, phone: "43216 33341" },
  { id: "WV-024", name: "Venkat Rao",   village: "Venkatagiri, AP",        initials: "VR", bg: "#4A5E7A", status: "idle",   looms: 4, phone: "32105 11122" },
  { id: "WV-031", name: "Kamala B.",    village: "Pochampally, Telangana", initials: "KB", bg: "#7A2040", status: "active", looms: 3, phone: "21098 55589" },
];
const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Active",   color: T.green,   bg: "rgba(30,102,64,0.10)" },
  qc:     { label: "In QC",    color: T.antiqueGold, bg: "rgba(200,155,71,0.14)" },
  idle:   { label: "Idle",     color: T.taupe,    bg: "rgba(139,112,96,0.10)" },
};

// ── Local GRN batch directory (mirrors WorkerGRN.tsx format GRN-YYYY-MMM-###) ─
interface GrnBatch { grnBatchId: string; vendor: string; dateReceived: string; materialType: "Warp" | "Resham" | "Jari"; availableQty: number; unit: string; }
const INITIAL_GRN_BATCHES: GrnBatch[] = [
  { grnBatchId: "GRN-2026-JUN-001", vendor: "Sri Venkateswara Textiles", dateReceived: "01 Jun 2026", materialType: "Warp",   availableQty: 48, unit: "kg" },
  { grnBatchId: "GRN-2026-JUN-002", vendor: "Kanchipuram Silks",         dateReceived: "02 Jun 2026", materialType: "Resham", availableQty: 22, unit: "kg" },
  { grnBatchId: "GRN-2026-JUN-003", vendor: "Surat Zari Works",          dateReceived: "03 Jun 2026", materialType: "Jari",   availableQty: 40, unit: "Reels" },
  { grnBatchId: "GRN-2026-MAY-014", vendor: "Surat Zari Works",          dateReceived: "20 May 2026", materialType: "Jari",   availableQty: 12, unit: "Buns" },
  { grnBatchId: "GRN-2026-MAY-011", vendor: "Kanchipuram Silks",         dateReceived: "17 May 2026", materialType: "Resham", availableQty: 14, unit: "kg" },
  { grnBatchId: "GRN-2026-MAY-006", vendor: "Sri Venkateswara Textiles", dateReceived: "12 May 2026", materialType: "Warp",   availableQty: 30, unit: "kg" },
];

const RESHAM_COLORS = [
  { name: "Gold",         hex: "#C4923A" },
  { name: "Silver/White", hex: "#D8D2C4" },
  { name: "Red",          hex: "#B22222" },
  { name: "Maroon",       hex: "#6E0F2D" },
  { name: "Green",        hex: "#1E6640" },
  { name: "Blue",         hex: "#1565C0" },
];
const JARI_COLORS = [
  { name: "Gold",   hex: "#C4923A" },
  { name: "Silver", hex: "#9E9E9E" },
  { name: "Copper", hex: "#B87333" },
  { name: "Pink",   hex: "#E91E8C" },
  { name: "Blue",   hex: "#1565C0" },
  { name: "Green",  hex: "#1E6640" },
];

interface MaterialRowState {
  uid: string;
  materialType: "Warp" | "Resham" | "Jari";
  warpSubtype: "Resham Warp" | "Jari Warp";
  description: string;
  quantity: string;
  quantityGm: string;
  jariType: "Polyester" | "Silk Fast";
  jariGrade: "1G" | "2G" | "3G" | "4G" | "5G";
  jariColor: string;
  jariUnit: "Reels" | "Buns";
  warpReshamUnit: "kg" | "g";
  grnBatchId: string;
}

function emptyRow(): MaterialRowState {
  return {
    uid: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    materialType: "Warp",
    warpSubtype: "Resham Warp",
    description: "",
    quantity: "",
    quantityGm: "",
    jariType: "Polyester",
    jariGrade: "2G",
    jariColor: "Gold",
    jariUnit: "Reels",
    warpReshamUnit: "kg",
    grnBatchId: "",
  };
}

// ── Shared small UI helpers ───────────────────────────────────────────────────
function SectionPill({ label }: { label: string }) {
  return <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, letterSpacing: "1.2px", textTransform: "uppercase" as const, marginBottom: 10 }}>{label}</div>;
}

function PillTab({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
      {options.map(opt => (
        <button key={opt} onClick={() => onChange(opt)} style={{
          padding: "8px 18px", borderRadius: 999, cursor: "pointer",
          border: `1.5px solid ${value === opt ? T.royalBurgundy : T.borderDef}`,
          background: value === opt ? T.royalBurgundy : "#FFF",
          color: value === opt ? "#FFF" : T.luxuryBrown,
          fontFamily: F.ui, fontSize: 13, fontWeight: 600,
        }}>{opt}</button>
      ))}
    </div>
  );
}

function ColorSwatchPicker({ colors, value, onChange }: { colors: { name: string; hex: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const }}>
      {colors.map(c => (
        <button key={c.name} title={c.name} onClick={() => onChange(c.name)} style={{
          width: 32, height: 32, borderRadius: "50%", background: c.hex, cursor: "pointer",
          border: value === c.name ? `3px solid ${T.luxuryBrown}` : "3px solid transparent",
          boxShadow: "0 1px 4px rgba(0,0,0,0.18)", flexShrink: 0,
        }} />
      ))}
      {value && <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, alignSelf: "center", marginLeft: 4 }}>{value}</span>}
    </div>
  );
}

// ── GRN batch selector (searchable + scan simulation) ─────────────────────────
function GrnBatchSelector({ grnBatches, materialType, value, onChange }: {
  grnBatches: GrnBatch[]; materialType: "Warp" | "Resham" | "Jari"; value: string; onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const filtered = grnBatches.filter(g => g.materialType === materialType && (q.length < 1 || g.grnBatchId.toLowerCase().includes(q.toLowerCase()) || g.vendor.toLowerCase().includes(q.toLowerCase())));
  const selected = grnBatches.find(g => g.grnBatchId === value);

  const handleScan = () => {
    // Simulated barcode scan — auto-select the first available batch of this material type
    const first = grnBatches.find(g => g.materialType === materialType);
    if (first) onChange(first.grnBatchId);
  };

  return (
    <div style={{ position: "relative" as const }}>
      <label style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.taupe, display: "block", marginBottom: 6 }}>GRN Batch</label>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1, position: "relative" as const }}>
          <button onClick={() => setOpen(o => !o)} style={{
            width: "100%", height: 44, borderRadius: 10, border: `1.5px solid ${open ? T.royalBurgundy : T.borderDef}`,
            background: "#FFF", padding: "0 14px", display: "flex", alignItems: "center", justifyContent: "space-between",
            cursor: "pointer", fontFamily: selected ? F.mono : F.ui, fontSize: 13, color: selected ? T.royalBurgundy : T.taupe,
          }}>
            {selected ? selected.grnBatchId : "Select GRN batch…"}
            <ChevronDown size={14} color={T.taupe} />
          </button>
          {open && (
            <div style={{ position: "absolute" as const, top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50, background: "#FFF", border: `1px solid ${T.royalBurgundy}`, borderRadius: 12, boxShadow: "0 8px 28px rgba(74,6,27,0.16)", overflow: "hidden" }}>
              <div style={{ padding: 8, borderBottom: `1px solid ${T.borderDef}` }}>
                <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search batch ID or vendor…"
                  style={{ width: "100%", height: 34, borderRadius: 8, border: `1px solid ${T.borderDef}`, padding: "0 10px", fontFamily: F.ui, fontSize: 12.5, outline: "none", boxSizing: "border-box" as const }} />
              </div>
              <div style={{ maxHeight: 220, overflowY: "auto" as const }}>
                {filtered.length === 0 ? (
                  <div style={{ padding: 14, textAlign: "center" as const, fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>No {materialType} batches found</div>
                ) : filtered.map(g => (
                  <button key={g.grnBatchId} onClick={() => { onChange(g.grnBatchId); setOpen(false); setQ(""); }} style={{
                    width: "100%", textAlign: "left" as const, padding: "10px 14px", border: "none", borderBottom: `1px solid ${T.borderDef}`,
                    background: value === g.grnBatchId ? "rgba(110,15,45,0.05)" : "#FFF", cursor: "pointer",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                      <span style={{ fontFamily: F.mono, fontSize: 12.5, color: T.royalBurgundy, fontWeight: 700 }}>{g.grnBatchId}</span>
                      <span style={{ fontFamily: F.ui, fontSize: 11.5, color: T.green }}>{g.availableQty} {g.unit} left</span>
                    </div>
                    <div style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe }}>{g.vendor} · {g.dateReceived}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <button onClick={handleScan} title="Scan GRN Batch Barcode" style={{
          height: 44, width: 44, borderRadius: 10, border: `1.5px solid ${T.borderGold}`, background: T.warmCream,
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
        }}><QrCode size={17} color={T.royalBurgundy} /></button>
      </div>
      {selected && (
        <div style={{ marginTop: 6, fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
          Available in {selected.grnBatchId}: <strong style={{ color: T.luxuryBrown }}>{selected.availableQty} {selected.unit} remaining</strong>
        </div>
      )}
    </div>
  );
}

// ── One material row editor ──────────────────────────────────────────────────
function MaterialRowEditor({ row, grnBatches, onChange, onRemove, showRemove }: {
  row: MaterialRowState; grnBatches: GrnBatch[]; onChange: (r: MaterialRowState) => void; onRemove: () => void; showRemove: boolean;
}) {
  const patch = (p: Partial<MaterialRowState>) => onChange({ ...row, ...p });
  const selectedGrn = grnBatches.find(g => g.grnBatchId === row.grnBatchId);
  const qtyNum = parseFloat(row.quantity) || 0;
  const overAvailable = selectedGrn && qtyNum > selectedGrn.availableQty;
  const reelsToBuns = row.jariUnit === "Reels" ? (qtyNum / 4) : (qtyNum * 4);

  return (
    <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 16, padding: 20, marginBottom: 16, position: "relative" as const }}>
      {showRemove && (
        <button onClick={onRemove} title="Remove" style={{ position: "absolute" as const, top: 14, right: 14, background: "rgba(192,57,43,0.08)", border: "none", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Trash2 size={14} color={T.crimson} />
        </button>
      )}

      {/* Material Type */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.taupe, display: "block", marginBottom: 8 }}>Material Type</label>
        <PillTab options={["Warp", "Resham", "Jari"]} value={row.materialType} onChange={v => patch({ materialType: v as any, grnBatchId: "", description: "", quantity: "" })} />
      </div>

      {/* Description + Quantity */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 16 }}>
        <div>
          <label style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.taupe, display: "block", marginBottom: 6 }}>
            Description
          </label>
          <input
            value={row.description}
            onChange={e => patch({ description: e.target.value })}
            placeholder={
              row.materialType === "Warp"   ? "e.g. Cotton/Silk blend warp" :
              row.materialType === "Resham" ? "e.g. Red Resham" :
                                             "e.g. Polyester Gold Jari"
            }
            style={{ width: "100%", height: 44, borderRadius: 10, border: `1.5px solid ${T.borderDef}`, padding: "0 14px", fontFamily: F.ui, fontSize: 13, outline: "none", boxSizing: "border-box" as const }}
          />
        </div>
        <div>
          <label style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.taupe, display: "block", marginBottom: 6 }}>
            Quantity {row.materialType === "Jari" ? "(Reels / Buns)" : `(${row.warpReshamUnit || "kg"})`}
          </label>
          {row.materialType === "Jari" ? (
            <>
              <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                {["Reels", "Buns"].map(u => (
                  <button key={u} onClick={() => patch({ jariUnit: u as any })} style={{
                    flex: 1, padding: "8px 4px", borderRadius: 8, cursor: "pointer", fontFamily: F.ui, fontSize: 12, fontWeight: 600,
                    border: `1.5px solid ${row.jariUnit === u ? T.royalBurgundy : T.borderDef}`,
                    background: row.jariUnit === u ? T.royalBurgundy : "#FFF",
                    color: row.jariUnit === u ? "#FFF" : T.luxuryBrown,
                  }}>{u}</button>
                ))}
              </div>
              <div style={{ position: "relative" as const }}>
                <input
                  type="number"
                  value={row.quantity}
                  onChange={e => patch({ quantity: e.target.value })}
                  placeholder="0"
                  style={{ width: "100%", height: 44, borderRadius: 10, border: `1.5px solid ${T.borderDef}`, padding: "0 52px 0 14px", fontFamily: F.mono, fontSize: 14, outline: "none", boxSizing: "border-box" as const }}
                />
                <span style={{ position: "absolute" as const, right: 10, top: "50%", transform: "translateY(-50%)", fontFamily: F.ui, fontSize: 11.5, fontWeight: 700, color: T.royalBurgundy }}>{row.jariUnit}</span>
              </div>
              {row.quantity && (
                <div style={{ fontFamily: F.mono, fontSize: 11, color: T.antiqueGold, marginTop: 4 }}>
                  = {reelsToBuns.toFixed(reelsToBuns % 1 === 0 ? 0 : 1)} {row.jariUnit === "Reels" ? "Buns" : "Reels"} <span style={{ color: T.taupe }}>(1 Bun = 4 Reels)</span>
                </div>
              )}
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                {["kg", "g"].map(u => (
                  <button key={u} onClick={() => patch({ warpReshamUnit: u as any })} style={{
                    flex: 1, padding: "8px 4px", borderRadius: 8, cursor: "pointer", fontFamily: F.ui, fontSize: 12, fontWeight: 600,
                    border: `1.5px solid ${(row.warpReshamUnit || "kg") === u ? T.royalBurgundy : T.borderDef}`,
                    background: (row.warpReshamUnit || "kg") === u ? T.royalBurgundy : "#FFF",
                    color: (row.warpReshamUnit || "kg") === u ? "#FFF" : T.luxuryBrown,
                  }}>{u}</button>
                ))}
              </div>
              <div style={{ position: "relative" as const }}>
                <input
                  type="number"
                  value={row.quantity}
                  onChange={e => patch({ quantity: e.target.value })}
                  placeholder="0"
                  style={{ width: "100%", height: 42, borderRadius: 10, border: `1.5px solid ${T.borderDef}`, padding: "0 38px 0 14px", fontFamily: F.mono, fontSize: 14, outline: "none", boxSizing: "border-box" as const }}
                />
                <span style={{ position: "absolute" as const, right: 10, top: "50%", transform: "translateY(-50%)", fontFamily: F.ui, fontSize: 11.5, fontWeight: 700, color: T.royalBurgundy }}>{row.warpReshamUnit || "kg"}</span>
              </div>
              {row.quantity && (
                <div style={{ fontFamily: F.mono, fontSize: 11, color: T.antiqueGold }}>
                  = {(row.warpReshamUnit || "kg") === "kg" ? `${(parseFloat(row.quantity) * 1000).toFixed(0)} g` : `${(parseFloat(row.quantity) / 1000).toFixed(3)} kg`}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* GRN Batch Selector */}
      <div>
        <GrnBatchSelector grnBatches={grnBatches} materialType={row.materialType} value={row.grnBatchId} onChange={v => patch({ grnBatchId: v })} />
        {overAvailable && (
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 7, background: "rgba(196,146,58,0.14)", border: `1px solid ${T.antiqueGold}`, borderRadius: 8, padding: "8px 12px" }}>
            <AlertTriangle size={14} color="#8B6018" />
            <span style={{ fontFamily: F.ui, fontSize: 12, color: "#8B6018" }}>Only {selectedGrn!.availableQty} {selectedGrn!.unit} available — you entered {qtyNum} {selectedGrn!.unit}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Signature capture block (mirrors WorkerWeavers WeaverSigBlock, T/F tokens) ─
function SignatureBlock({ weaverName, weaverPhone, sigMethod, setSigMethod, signed, setSigned, remoteSent, setRemoteSent, remoteConfirmed, setRemoteConfirmed }: {
  weaverName: string; weaverPhone: string;
  sigMethod: "none" | "here" | "remote"; setSigMethod: (m: "none" | "here" | "remote") => void;
  signed: boolean; setSigned: (v: boolean) => void;
  remoteSent: boolean; setRemoteSent: (v: boolean) => void;
  remoteConfirmed: boolean; setRemoteConfirmed: (v: boolean) => void;
}) {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 4 }}>
        <button onClick={() => setSigMethod("here")} style={{
          padding: "18px 16px", borderRadius: 14, cursor: "pointer", textAlign: "center" as const, position: "relative" as const,
          background: sigMethod === "here" ? "rgba(110,15,45,0.05)" : "#FFF",
          border: `${sigMethod === "here" ? 2 : 1}px solid ${sigMethod === "here" ? T.royalBurgundy : T.borderDef}`,
        }}>
          {sigMethod === "here" && <div style={{ position: "absolute" as const, top: 8, right: 8, width: 16, height: 16, background: T.antiqueGold, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><CheckCircle2 size={10} color="#FFF" /></div>}
          <div style={{ width: 44, height: 44, borderRadius: 12, background: sigMethod === "here" ? "rgba(110,15,45,0.10)" : "rgba(110,15,45,0.05)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
            <PenLine size={20} color={sigMethod === "here" ? T.royalBurgundy : T.taupe} />
          </div>
          <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown }}>Sign Here on This Screen</div>
          <div style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe, marginTop: 3 }}>Weaver signs on this device</div>
        </button>
        <button onClick={() => setSigMethod("remote")} style={{
          padding: "18px 16px", borderRadius: 14, cursor: "pointer", textAlign: "center" as const, position: "relative" as const,
          background: sigMethod === "remote" ? "rgba(110,15,45,0.05)" : "#FFF",
          border: `${sigMethod === "remote" ? 2 : 1}px solid ${sigMethod === "remote" ? T.royalBurgundy : T.borderDef}`,
        }}>
          {sigMethod === "remote" && <div style={{ position: "absolute" as const, top: 8, right: 8, width: 16, height: 16, background: T.antiqueGold, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><CheckCircle2 size={10} color="#FFF" /></div>}
          <div style={{ width: 44, height: 44, borderRadius: 12, background: sigMethod === "remote" ? "rgba(110,15,45,0.10)" : "rgba(110,15,45,0.05)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
            <Send size={20} color={sigMethod === "remote" ? T.royalBurgundy : T.taupe} />
          </div>
          <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown }}>Send to Weaver's Phone</div>
          <div style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe, marginTop: 3 }}>Weaver signs remotely</div>
        </button>
      </div>

      {sigMethod === "here" && (
        <div style={{ marginTop: 14 }}>
          <div onClick={() => setSigned(true)} style={{
            background: "#FFF", border: `1.5px solid ${signed ? "rgba(30,102,64,0.35)" : T.borderDef}`, borderRadius: 14,
            height: 150, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center",
            cursor: "crosshair", position: "relative" as const,
          }}>
            {!signed ? (
              <>
                <PenLine size={30} color={T.taupe} style={{ marginBottom: 10, opacity: 0.6 }} />
                <span style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>Tap to sign as {weaverName}</span>
              </>
            ) : (
              <div style={{ textAlign: "center" as const }}>
                <div style={{ fontFamily: "'Dancing Script', cursive", fontSize: 30, color: T.darkBurgundy }}>{weaverName}</div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.green, marginTop: 6, display: "flex", alignItems: "center", gap: 5, justifyContent: "center" }}>
                  <CheckCircle2 size={13} /> Signature captured
                </div>
              </div>
            )}
            {signed && (
              <button onClick={e => { e.stopPropagation(); setSigned(false); }} style={{ position: "absolute" as const, bottom: 10, right: 14, background: "none", border: "none", fontFamily: F.ui, fontSize: 12, color: T.antiqueGold, cursor: "pointer" }}>Clear</button>
            )}
          </div>
        </div>
      )}

      {sigMethod === "remote" && (
        <div style={{ marginTop: 14, background: "#FFF", border: `1px solid ${T.borderDef}`, borderRadius: 14, padding: 18 }}>
          {remoteConfirmed ? (
            <div style={{ background: "rgba(30,102,64,0.10)", border: `1px solid ${T.green}`, borderRadius: 12, padding: 18, textAlign: "center" as const }}>
              <CheckCircle2 size={26} color={T.green} style={{ margin: "0 auto 8px" }} />
              <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.green, marginBottom: 4 }}>Signature Received!</div>
              <div style={{ fontFamily: F.mono, fontSize: 11.5, color: T.taupe }}>Signed by {weaverName} · Just now</div>
            </div>
          ) : remoteSent ? (
            <div style={{ background: "rgba(196,146,58,0.12)", border: `1px solid ${T.antiqueGold}`, borderRadius: 12, padding: 18, textAlign: "center" as const }}>
              <Clock size={24} color={T.antiqueGold} style={{ margin: "0 auto 8px" }} />
              <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown, marginBottom: 3 }}>Waiting for signature…</div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 12 }}>Request sent to {weaverName}'s mobile (+91 {weaverPhone})</div>
              <button onClick={() => setRemoteConfirmed(true)} style={{ background: "none", border: "none", fontFamily: F.ui, fontSize: 12.5, color: T.taupe, cursor: "pointer", textDecoration: "underline" }}>Demo: Signed →</button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe, marginBottom: 3 }}>Sending to</div>
                <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 15, color: T.luxuryBrown }}>+91 {weaverPhone}</div>
              </div>
              <button onClick={() => setRemoteSent(true)} style={{ width: "100%", height: 48, borderRadius: 12, background: T.royalBurgundy, border: "none", color: "#FFF", fontFamily: F.ui, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Send size={15} /> Send Signature Request
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Materials summary formatter (shared by history table + modal) ────────────
function summarizeMaterials(items: IssuedMaterialItem[]): string {
  return items.map(m => {
    if (m.materialType === "Warp") return `Warp (${m.warpSubtype ?? "—"}) ${m.quantity}${m.unit}`;
    if (m.materialType === "Resham") return `Resham${m.jariColor ? ` ${m.jariColor}` : ""} ${m.quantity}${m.unit}`;
    return `Jari ${m.jariType ?? ""} ${m.jariGrade ?? ""} ${m.jariColor ?? ""} ${m.quantity} ${m.unit}`.replace(/\s+/g, " ").trim();
  }).join(" · ");
}

function renderIssuedMaterials(items: IssuedMaterialItem[]) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {items.map((m, idx) => {
        let desc = "";
        if (m.materialType === "Warp") {
          desc = m.warpSubtype || "";
          if (m.description) desc += desc ? ` (${m.description})` : m.description;
        } else if (m.materialType === "Resham") {
          desc = m.description || m.jariColor || "";
        } else if (m.materialType === "Jari") {
          desc = `${m.jariType || ""} ${m.jariGrade || ""} ${m.jariColor || ""}`.replace(/\s+/g, " ").trim();
        }

        return (
          <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ 
              fontFamily: F.mono, fontSize: 9.5, fontWeight: 700,
              color: m.materialType === "Warp" ? "#7A5010" : m.materialType === "Resham" ? "#7A5E1C" : T.royalBurgundy, 
              background: m.materialType === "Warp" ? "rgba(196,146,58,0.14)" : m.materialType === "Resham" ? "rgba(200,155,71,0.13)" : "rgba(110,15,45,0.08)",
              padding: "2px 6px", borderRadius: 4 
            }}>{m.materialType}</span>
            {desc && <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{desc}</span>}
            <span style={{ fontFamily: F.mono, fontSize: 11.5, fontWeight: 700, color: T.royalBurgundy }}>{m.quantity} {m.unit}</span>
          </div>
        );
      })}
    </div>
  );
}

function materialIcon(type: string) {
  if (type === "Warp") return <Package size={14} color={T.royalBurgundy} />;
  if (type === "Resham") return <Layers size={14} color={T.royalBurgundy} />;
  return <Sparkles size={14} color={T.antiqueGold} />;
}

// ── View Details Modal ────────────────────────────────────────────────────────
function RecordDetailsModal({ record, onClose }: { record: MaterialIssueRecord; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: "fixed" as const, inset: 0, zIndex: 1000, background: "rgba(30,10,20,0.55)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
      <motion.div onClick={e => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2, ease: EASE }}
        style={{ background: T.warmIvory, borderRadius: 20, width: 620, maxWidth: "calc(100vw - 48px)", maxHeight: "88vh", overflowY: "auto" as const, boxShadow: "0 24px 80px rgba(44,6,27,0.28)", border: `1px solid ${T.borderDef}` }}>
        <div style={{ background: T.darkBurgundy, padding: "22px 26px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: F.mono, fontSize: 16, color: T.goldLight, fontWeight: 700, marginBottom: 4 }}>{record.id}</div>
            <div style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,255,255,0.65)" }}>{record.weaverName} · {record.weaverId}{record.loomNumber ? ` · Loom ${record.loomNumber}` : ""}</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.10)", border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={16} color="#FFF" /></button>
        </div>
        <div style={{ padding: "22px 26px", display: "flex", flexDirection: "column" as const, gap: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Issued By", val: record.issuedBy },
              { label: "Issued At", val: new Date(record.issuedAt).toLocaleString("en-IN") },
              { label: "Signature Method", val: record.signatureMethod === "here" ? "Signed on Admin device" : "Sent to weaver's phone" },
              { label: "Status", val: record.status.replace("-", " ") },
            ].map(r => (
              <div key={r.label} style={{ background: "#FFF", borderRadius: 10, padding: "10px 14px", border: `1px solid ${T.borderDef}` }}>
                <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.6px", marginBottom: 3 }}>{r.label}</div>
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown, textTransform: "capitalize" as const }}>{r.val}</div>
              </div>
            ))}
          </div>

          <div>
            <SectionPill label="Material Breakdown" />
            <div style={{ background: "#FFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
                <thead style={{ background: T.warmCream }}>
                  <tr>
                    {["Type", "Details", "Qty", "GRN Batch"].map(h => (
                      <th key={h} style={{ padding: "9px 14px", textAlign: "left" as const, fontFamily: F.mono, fontSize: 10.5, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.6px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {record.materials.map((m, i) => (
                    <tr key={i} style={{ borderTop: `1px solid ${T.borderDef}` }}>
                      <td style={{ padding: "10px 14px", fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, display: "flex", alignItems: "center", gap: 7 }}>{materialIcon(m.materialType)} {m.materialType}</td>
                      <td style={{ padding: "10px 14px", fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>
                        {m.materialType === "Warp" ? m.warpSubtype : m.materialType === "Jari" ? `${m.jariType} · ${m.jariGrade} · ${m.jariColor}` : (m.description || m.jariColor || "—")}
                      </td>
                      <td style={{ padding: "10px 14px", fontFamily: F.mono, fontSize: 13, color: T.luxuryBrown }}>{m.quantity} {m.unit}</td>
                      <td style={{ padding: "10px 14px", fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy }}>{m.grnBatchId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {record.notes && (
            <div>
              <SectionPill label="Notes" />
              <div style={{ background: "#FFF", borderRadius: 10, border: `1px solid ${T.borderDef}`, padding: "12px 14px", fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>{record.notes}</div>
            </div>
          )}

          <div>
            <SectionPill label="Stock Impact" />
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
              {record.materials.map((m, i) => (
                <div key={i} style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe, display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircle2 size={13} color={T.green} /> Reduced {m.quantity} {m.unit} from <span style={{ fontFamily: F.mono, color: T.royalBurgundy }}>{m.grnBatchId}</span>
                </div>
              ))}
            </div>
          </div>

          {record.signatureCaptured && record.signatureTimestamp && (
            <div style={{ background: "rgba(30,102,64,0.08)", border: `1px solid rgba(30,102,64,0.20)`, borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle2 size={14} color={T.green} />
              <span style={{ fontFamily: F.ui, fontSize: 12.5, color: T.green }}>Signed on {new Date(record.signatureTimestamp).toLocaleString("en-IN")}</span>
            </div>
          )}

          <button onClick={onClose} style={{ height: 46, borderRadius: 12, border: "none", background: T.royalBurgundy, color: "#FFF", fontFamily: F.ui, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Close</button>
        </div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export function IssueMaterialPage() {
  const { issueRecords, addIssueRecord } = useMaterialIssue();
  const [grnBatches, setGrnBatches] = useState<GrnBatch[]>(INITIAL_GRN_BATCHES);

  // Step 1 — weaver
  const [weaverSearch, setWeaverSearch] = useState("");
  const [showWeaverList, setShowWeaverList] = useState(false);
  const [selectedWeaverId, setSelectedWeaverId] = useState<string | null>(null);

  // Step 2 — materials
  const [rows, setRows] = useState<MaterialRowState[]>([emptyRow()]);

  // Step 4 — notes
  const [notes, setNotes] = useState("");

  // Step 5 — signature
  const [sigMethod, setSigMethod] = useState<"none" | "here" | "remote">("none");
  const [signed, setSigned] = useState(false);
  const [remoteSent, setRemoteSent] = useState(false);
  const [remoteConfirmed, setRemoteConfirmed] = useState(false);

  // Success state
  const [successRecord, setSuccessRecord] = useState<MaterialIssueRecord | null>(null);

  // History section state
  const [histSearch, setHistSearch] = useState("");
  const [histWeaverFilter, setHistWeaverFilter] = useState("All Weavers");
  const [histDateFrom, setHistDateFrom] = useState("");
  const [histDateTo, setHistDateTo] = useState("");
  const [histPage, setHistPage] = useState(1);
  const [viewRecord, setViewRecord] = useState<MaterialIssueRecord | null>(null);
  const ROWS_PER_PAGE = 15;

  const [selectedLoom, setSelectedLoom] = useState<number | "">("");

  const selectedWeaver = WEAVERS.find(w => w.id === selectedWeaverId) || null;

  const filteredWeavers = weaverSearch.length >= 1
    ? WEAVERS.filter(w => w.name.toLowerCase().includes(weaverSearch.toLowerCase()) || w.id.toLowerCase().includes(weaverSearch.toLowerCase()))
    : WEAVERS;

  const isSigned = (sigMethod === "here" && signed) || (sigMethod === "remote" && remoteConfirmed);

  const validRows = rows.filter(r => r.materialType && r.quantity && parseFloat(r.quantity) > 0 && r.grnBatchId);
  const canConfirm = !!selectedWeaver && selectedLoom !== "" && validRows.length > 0 && isSigned;

  function updateRow(uid: string, updated: MaterialRowState) {
    setRows(prev => prev.map(r => r.uid === uid ? updated : r));
  }
  function removeRow(uid: string) {
    setRows(prev => prev.filter(r => r.uid !== uid));
  }
  function addRow() {
    setRows(prev => [...prev, emptyRow()]);
  }

  function resetForm() {
    setWeaverSearch(""); setSelectedWeaverId(null); setShowWeaverList(false);
    setSelectedLoom("");
    setRows([emptyRow()]); setNotes("");
    setSigMethod("none"); setSigned(false); setRemoteSent(false); setRemoteConfirmed(false);
  }

  function handleConfirm() {
    if (!canConfirm || !selectedWeaver) return;

    const materials: IssuedMaterialItem[] = validRows.map(r => {
      const base: IssuedMaterialItem = {
        materialType: r.materialType,
        quantity: parseFloat(r.quantity),
        unit: r.materialType === "Jari" ? r.jariUnit : (r.warpReshamUnit || "kg"),
        grnBatchId: r.grnBatchId,
      };
      if (r.materialType === "Warp") { base.warpSubtype = r.warpSubtype; if (r.description) base.description = r.description; }
      if (r.materialType === "Resham") { if (r.description) base.description = r.description; if (r.jariColor) base.jariColor = r.jariColor; }
      if (r.materialType === "Jari") { base.jariType = r.jariType; base.jariGrade = r.jariGrade; base.jariColor = r.jariColor; }
      return base;
    });

    const record = addIssueRecord({
      weaverId: selectedWeaver.id,
      weaverName: selectedWeaver.name,
      loomNumber: selectedLoom || undefined,
      issuedBy: "Admin (Kesava Rao)",
      issuedAt: new Date().toISOString(),
      materials,
      signatureMethod: sigMethod === "remote" ? "remote" : "here",
      signatureCaptured: true,
      signatureTimestamp: new Date().toISOString(),
      notes: notes || undefined,
      status: "signed",
    });

    // Reduce GRN batch remaining quantities
    setGrnBatches(prev => prev.map(g => {
      const used = materials.filter(m => m.grnBatchId === g.grnBatchId).reduce((s, m) => s + m.quantity, 0);
      return used > 0 ? { ...g, availableQty: Math.max(0, g.availableQty - used) } : g;
    }));

    setSuccessRecord(record);
    resetForm();
  }

  // History filtering
  const weaverNames = ["All Weavers", ...Array.from(new Set(issueRecords.map(r => r.weaverName)))];
  const filteredHistory = issueRecords.filter(r => {
    const matchSearch = !histSearch ||
      r.weaverName.toLowerCase().includes(histSearch.toLowerCase()) ||
      r.id.toLowerCase().includes(histSearch.toLowerCase()) ||
      r.materials.some(m => m.grnBatchId.toLowerCase().includes(histSearch.toLowerCase()));
    const matchWeaver = histWeaverFilter === "All Weavers" || r.weaverName === histWeaverFilter;
    const issuedDate = r.issuedAt.slice(0, 10);
    const matchFrom = !histDateFrom || issuedDate >= histDateFrom;
    const matchTo = !histDateTo || issuedDate <= histDateTo;
    return matchSearch && matchWeaver && matchFrom && matchTo;
  });
  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / ROWS_PER_PAGE));
  const pagedHistory = filteredHistory.slice((histPage - 1) * ROWS_PER_PAGE, histPage * ROWS_PER_PAGE);

  const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
    signed: { label: "Signed", color: T.green, bg: "rgba(30,102,64,0.10)" },
    "pending-signature": { label: "Pending Signature", color: "#8B6018", bg: "rgba(196,146,58,0.14)" },
    cancelled: { label: "Cancelled", color: T.crimson, bg: "rgba(192,57,43,0.09)" },
  };

  return (
    <div style={{ fontFamily: F.ui, background: T.silkCream, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: T.darkBurgundy, position: "relative" as const, overflow: "hidden", minHeight: 190, display: "flex", alignItems: "stretch" }}>
        <div style={{ flex: 1, padding: "44px 56px 44px", zIndex: 10, position: "relative" as const }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <div style={{ width: 28, height: 1, background: T.antiqueGold }} />
            <span style={{ fontFamily: F.mono, fontSize: 9, color: `${T.antiqueGold}80`, letterSpacing: "1.5px", textTransform: "uppercase" as const }}>SINCE 1999 · MATERIAL ISSUANCE</span>
          </div>
          <h1 style={{ fontFamily: F.display, fontWeight: 700, fontSize: 42, color: "#fff", margin: "0 0 8px", lineHeight: 1.1 }}>Issue Raw Materials to Weaver</h1>
          <p style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,255,255,0.60)", maxWidth: 560, margin: 0, lineHeight: 1.65 }}>
            Record material handover, link GRN batch, and collect weaver's digital signature
          </p>
        </div>
        {[300, 440].map((sz, i) => (
          <div key={i} style={{ position: "absolute" as const, right: -sz * 0.3, bottom: -sz * 0.4, width: sz, height: sz, borderRadius: "50%", border: `1px solid rgba(200,155,71,${0.10 - i * 0.03})`, pointerEvents: "none" as const }} />
        ))}
      </div>

      <div style={{ padding: "40px 56px 80px", maxWidth: 1200, margin: "0 auto" }}>

        {/* Success banner */}
        <AnimatePresence>
          {successRecord && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ marginBottom: 28 }}>
              <div style={{ background: "rgba(30,102,64,0.10)", border: `1.5px solid ${T.green}`, borderRadius: 16, padding: 24, display: "flex", alignItems: "center", gap: 18 }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(30,102,64,0.16)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <CheckCircle2 size={26} color={T.green} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 19, color: T.green, marginBottom: 4 }}>Materials Issued Successfully</div>
                  <div style={{ fontFamily: F.ui, fontSize: 13.5, color: T.luxuryBrown }}>
                    <span style={{ fontFamily: F.mono, color: T.royalBurgundy, fontWeight: 700 }}>{successRecord.id}</span> · Given to {successRecord.weaverName} {successRecord.loomNumber ? `(Loom ${successRecord.loomNumber})` : ""} · {summarizeMaterials(successRecord.materials)}
                  </div>
                </div>
                <button onClick={() => setSuccessRecord(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} color={T.green} /></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ SECTION A — ISSUE MATERIAL FORM ═══ */}
        <div style={{ background: "#FFFFFF", borderRadius: 20, border: `1px solid ${T.borderDef}`, boxShadow: "0 4px 20px rgba(44,24,16,0.06)", padding: 28, marginBottom: 48 }}>

          {/* STEP 1 — Weaver */}
          <SectionPill label="Step 1 · Select Weaver" />
          {!selectedWeaver ? (
            <div style={{ position: "relative" as const, marginBottom: 8 }}>
              <div style={{ position: "relative" as const }}>
                <Search size={16} color={T.taupe} style={{ position: "absolute" as const, left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input value={weaverSearch} onChange={e => { setWeaverSearch(e.target.value); setShowWeaverList(true); }} onFocus={() => setShowWeaverList(true)}
                  placeholder="Search weaver by name or ID…"
                  style={{ width: "100%", height: 48, borderRadius: 12, border: `1.5px solid ${showWeaverList ? T.royalBurgundy : T.borderDef}`, padding: "0 14px 0 42px", fontFamily: F.ui, fontSize: 14, outline: "none", boxSizing: "border-box" as const }} />
              </div>
              {showWeaverList && (
                <div style={{ position: "absolute" as const, top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 40, background: "#FFF", border: `1px solid ${T.royalBurgundy}`, borderRadius: 14, boxShadow: "0 8px 28px rgba(74,6,27,0.16)", maxHeight: 320, overflowY: "auto" as const }}>
                  {filteredWeavers.length === 0 ? (
                    <div style={{ padding: 16, textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>No weavers found</div>
                  ) : filteredWeavers.map(w => (
                    <button key={w.id} onClick={() => { setSelectedWeaverId(w.id); setShowWeaverList(false); setWeaverSearch(""); }} style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", border: "none",
                      borderBottom: `1px solid ${T.borderDef}`, background: "#FFF", cursor: "pointer", textAlign: "left" as const,
                    }}>
                      <div style={{ width: 38, height: 38, borderRadius: "50%", background: w.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 12, color: "#FFF" }}>{w.initials}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13.5, color: T.luxuryBrown }}>{w.name} <span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, fontWeight: 400 }}>· {w.id}</span></div>
                        <div style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe }}>{w.village} · {w.looms} active loom{w.looms !== 1 ? "s" : ""}</div>
                      </div>
                      <span style={{ background: STATUS_CFG[w.status].bg, color: STATUS_CFG[w.status].color, borderRadius: 999, padding: "3px 10px", fontFamily: F.ui, fontSize: 11, fontWeight: 600 }}>{STATUS_CFG[w.status].label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 14, padding: 16, display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                <div style={{ width: 46, height: 46, borderRadius: "50%", background: selectedWeaver.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: "#FFF" }}>{selectedWeaver.initials}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 15, color: T.luxuryBrown }}>{selectedWeaver.name} <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, fontWeight: 400 }}>· {selectedWeaver.id}</span></div>
                  <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe, marginTop: 2 }}>{selectedWeaver.village} · {selectedWeaver.looms} active looms</div>
                </div>
                <span style={{ background: STATUS_CFG[selectedWeaver.status].bg, color: STATUS_CFG[selectedWeaver.status].color, borderRadius: 999, padding: "4px 12px", fontFamily: F.ui, fontSize: 12, fontWeight: 600 }}>{STATUS_CFG[selectedWeaver.status].label}</span>
                <button onClick={() => { setSelectedWeaverId(null); setSelectedLoom(""); }} style={{ background: "none", border: "none", fontFamily: F.ui, fontSize: 12.5, color: T.royalBurgundy, cursor: "pointer", textDecoration: "underline" }}>Change</button>
              </div>

              {/* Loom selector */}
              <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 14, padding: "16px 20px" }}>
                <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown, marginBottom: 10 }}>Select Loom Number *</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {Array.from({ length: selectedWeaver.looms }, (_, idx) => idx + 1).map(loom => (
                    <button
                      key={loom}
                      onClick={() => setSelectedLoom(loom)}
                      style={{
                        padding: "8px 20px", borderRadius: 8, cursor: "pointer",
                        border: `1.5px solid ${selectedLoom === loom ? T.royalBurgundy : T.borderDef}`,
                        background: selectedLoom === loom ? T.royalBurgundy : "#FFF",
                        color: selectedLoom === loom ? "#FFF" : T.luxuryBrown,
                        fontFamily: F.mono, fontSize: 13, fontWeight: 700,
                        transition: "all 0.15s ease",
                      }}
                    >
                      Loom {loom}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* STEP 2 — Materials */}
          <div style={{ marginTop: 32 }}>
            <SectionPill label="Step 2 · Add Materials Being Given" />
            {rows.map(row => (
              <MaterialRowEditor key={row.uid} row={row} grnBatches={grnBatches} onChange={r => updateRow(row.uid, r)} onRemove={() => removeRow(row.uid)} showRemove={rows.length > 1} />
            ))}
            <button onClick={addRow} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: `1.5px dashed ${T.borderGold}`, borderRadius: 12, padding: "12px 18px", width: "100%", justifyContent: "center", cursor: "pointer", fontFamily: F.ui, fontWeight: 600, fontSize: 13.5, color: T.royalBurgundy }}>
              <Plus size={15} /> Add Another Material
            </button>
          </div>

          {/* STEP 4 — Notes */}
          <div style={{ marginTop: 32 }}>
            <SectionPill label="Step 3 · Notes (Optional)" />
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Any special instructions, batch references, or remarks"
              style={{ width: "100%", borderRadius: 12, border: `1.5px solid ${T.borderDef}`, padding: "12px 14px", fontFamily: F.ui, fontSize: 13.5, outline: "none", resize: "vertical" as const, boxSizing: "border-box" as const }} />
          </div>

          {/* STEP 5 — Signature */}
          <div style={{ marginTop: 32 }}>
            <SectionPill label="Step 4 · Collect Weaver Signature" />
            <SignatureBlock
              weaverName={selectedWeaver?.name ?? "the weaver"} weaverPhone={selectedWeaver?.phone ?? "—"}
              sigMethod={sigMethod} setSigMethod={setSigMethod}
              signed={signed} setSigned={setSigned}
              remoteSent={remoteSent} setRemoteSent={setRemoteSent}
              remoteConfirmed={remoteConfirmed} setRemoteConfirmed={setRemoteConfirmed}
            />
          </div>

          {/* Confirm */}
          <button onClick={handleConfirm} disabled={!canConfirm} style={{
            marginTop: 32, width: "100%", height: 56, borderRadius: 14, border: "none",
            background: canConfirm ? T.green : "#C0C0C0", color: "#FFF",
            fontFamily: F.ui, fontWeight: 700, fontSize: 16, cursor: canConfirm ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          }}>
            <Check size={20} /> Confirm Issuance
          </button>
        </div>

        {/* ═══ SECTION B — ISSUANCE HISTORY ═══ */}
        <div>
          <SectionPill label="Material Issuance History" />
          <h2 style={{ fontFamily: F.display, fontWeight: 700, fontSize: 26, color: T.luxuryBrown, margin: "0 0 20px" }}>Material Issuance History</h2>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const, marginBottom: 20 }}>
            <div style={{ position: "relative" as const, flex: "1 1 260px" }}>
              <Search size={15} color={T.taupe} style={{ position: "absolute" as const, left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <input value={histSearch} onChange={e => { setHistSearch(e.target.value); setHistPage(1); }} placeholder="Search weaver, MIR ID, or GRN batch…"
                style={{ width: "100%", height: 42, borderRadius: 10, border: `1.5px solid ${T.borderDef}`, padding: "0 12px 0 36px", fontFamily: F.ui, fontSize: 13, outline: "none", boxSizing: "border-box" as const }} />
            </div>
            <select value={histWeaverFilter} onChange={e => { setHistWeaverFilter(e.target.value); setHistPage(1); }}
              style={{ height: 42, borderRadius: 10, border: `1.5px solid ${T.borderDef}`, padding: "0 12px", fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, background: "#FFF" }}>
              {weaverNames.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <input type="date" value={histDateFrom} onChange={e => { setHistDateFrom(e.target.value); setHistPage(1); }} style={{ height: 42, borderRadius: 10, border: `1.5px solid ${T.borderDef}`, padding: "0 10px", fontFamily: F.ui, fontSize: 12.5 }} />
            <span style={{ alignSelf: "center", color: T.taupe, fontFamily: F.ui, fontSize: 12.5 }}>to</span>
            <input type="date" value={histDateTo} onChange={e => { setHistDateTo(e.target.value); setHistPage(1); }} style={{ height: 42, borderRadius: 10, border: `1.5px solid ${T.borderDef}`, padding: "0 10px", fontFamily: F.ui, fontSize: 12.5 }} />
          </div>

          <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, overflow: "hidden", overflowX: "auto" as const }}>
            <table style={{ width: "100%", borderCollapse: "collapse" as const, minWidth: 900 }}>
              <thead style={{ background: T.warmCream }}>
                <tr>
                  {["MIR ID", "Date", "Weaver Name", "Weaver ID", "Materials Summary", "GRN Batch IDs", "Issued By", "Signature", "Status", ""].map(h => (
                    <th key={h} style={{ padding: "12px 14px", textAlign: "left" as const, fontFamily: F.mono, fontSize: 10.5, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.6px", whiteSpace: "nowrap" as const }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedHistory.length === 0 ? (
                  <tr><td colSpan={10} style={{ padding: 32, textAlign: "center" as const, fontFamily: F.ui, fontSize: 13.5, color: T.taupe }}>No issuance records match your filters.</td></tr>
                ) : pagedHistory.map(r => {
                  const badge = STATUS_BADGE[r.status];
                  const grnIds = Array.from(new Set(r.materials.map(m => m.grnBatchId)));
                  return (
                    <tr key={r.id} style={{ borderTop: `1px solid ${T.borderDef}` }}>
                      <td style={{ padding: "12px 14px" }}><span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", borderRadius: 6, padding: "3px 8px" }}>{r.id}</span></td>
                      <td style={{ padding: "12px 14px", fontFamily: F.ui, fontSize: 12.5, color: T.taupe, whiteSpace: "nowrap" as const }}>{new Date(r.issuedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                      <td style={{ padding: "12px 14px", whiteSpace: "nowrap" as const }}>
                        <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: T.luxuryBrown }}>{r.weaverName}</div>
                        {r.loomNumber && <div style={{ fontFamily: F.mono, fontSize: 11, color: T.antiqueGold, fontWeight: 700, marginTop: 2 }}>Loom {r.loomNumber}</div>}
                      </td>
                      <td style={{ padding: "12px 14px", fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{r.weaverId}</td>
                      <td style={{ padding: "12px 14px" }}>{renderIssuedMaterials(r.materials)}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" as const }}>
                          {grnIds.map(g => <span key={g} style={{ fontFamily: F.mono, fontSize: 10.5, color: T.royalBurgundy, background: "rgba(110,15,45,0.06)", borderRadius: 5, padding: "2px 7px" }}>{g}</span>)}
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px", fontFamily: F.ui, fontSize: 12.5, color: T.taupe, whiteSpace: "nowrap" as const }}>{r.issuedBy}</td>
                      <td style={{ padding: "12px 14px", whiteSpace: "nowrap" as const }}>
                        {r.signatureCaptured ? (
                          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.green, display: "flex", alignItems: "center", gap: 5 }}><CheckCircle2 size={13} /> Signed — {r.signatureMethod === "here" ? "On screen" : "Remote"}</span>
                        ) : (
                          <span style={{ fontFamily: F.ui, fontSize: 12, color: "#8B6018", display: "flex", alignItems: "center", gap: 5 }}><Clock size={13} /> Pending</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ background: badge.bg, color: badge.color, borderRadius: 999, padding: "4px 10px", fontFamily: F.ui, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" as const }}>{badge.label}</span>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <button onClick={() => setViewRecord(r)} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: `1px solid ${T.borderGold}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontFamily: F.ui, fontSize: 11.5, color: T.royalBurgundy, whiteSpace: "nowrap" as const }}>
                          <Eye size={12} /> View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, marginTop: 20 }}>
              <button disabled={histPage === 1} onClick={() => setHistPage(p => p - 1)} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${T.borderDef}`, background: "#FFF", cursor: histPage === 1 ? "not-allowed" : "pointer", fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, opacity: histPage === 1 ? 0.5 : 1 }}>← Prev</button>
              <span style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>Page {histPage} of {totalPages}</span>
              <button disabled={histPage === totalPages} onClick={() => setHistPage(p => p + 1)} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${T.borderDef}`, background: "#FFF", cursor: histPage === totalPages ? "not-allowed" : "pointer", fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, opacity: histPage === totalPages ? 0.5 : 1 }}>Next →</button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {viewRecord && <RecordDetailsModal record={viewRecord} onClose={() => setViewRecord(null)} />}
      </AnimatePresence>
    </div>
  );
}
