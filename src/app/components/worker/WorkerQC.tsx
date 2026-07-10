import React, { useState, useMemo } from "react";
import { useBatches } from "../BatchContext";
import { useFinishing } from "../FinishingContext";
import { useDesignLibrary } from "../DesignLibraryContext";
import { DesignCodeCard } from "../DesignLibraryPage";
import { SareeTypeCard, getSareeTypeByName, getSareeTypeByCode } from "../RatesPricingPage";
import { motion, AnimatePresence } from "motion/react";

// Splits a "CODE · Type Name" combined design string into its parts.
function splitDesignField(design: string): { code: string; typeName: string } {
  const idx = design.indexOf("·");
  if (idx === -1) return { code: design.trim(), typeName: "" };
  return { code: design.slice(0, idx).trim(), typeName: design.slice(idx + 1).trim() };
}
import {
  ChevronLeft, Camera, UploadCloud, CheckCircle2, X, Search,
  Eye, AlertTriangle, ChevronRight, Scissors, Palette, Scale,
  Ruler, HelpCircle, XCircle, Users, Package, Sparkles,
} from "lucide-react";

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:       "#FAFAF8",
  card:     "#FFFFFF",
  burg:     "#6E0F2D",
  wine:     "#4A061B",
  gold:     "#C89B47",
  goldL:    "#E7C983",
  brown:    "#3B2314",
  green:    "#1E6640",
  crim:     "#C0392B",
  muted:    "#8B7060",
  bdr:      "rgba(110,15,45,0.10)",
  bdrMed:   "rgba(110,15,45,0.18)",
  cream:    "#F5E8D0",
  inp:      "#FFF8E7",
  bgGold:   "rgba(200,155,71,0.10)",
  bgGreen:  "rgba(30,102,64,0.09)",
  bgCrim:   "rgba(192,57,43,0.08)",
  gradHero: "linear-gradient(135deg, #4A061B 0%, #6E0F2D 55%, #8B1A30 100%)",
  shadow:   "0 2px 12px rgba(74,6,27,0.07)",
  shadowLg: "0 8px 32px rgba(74,6,27,0.12)",
};

const F = {
  d: "'Plus Jakarta Sans', sans-serif",
  u: "'Inter', sans-serif",
  m: "'JetBrains Mono', monospace",
};

const baseCard: React.CSSProperties = {
  background: T.card,
  border: `1px solid ${T.bdr}`,
  borderRadius: 12,
  boxShadow: T.shadow,
};

// ── Sample data ──────────────────────────────────────────────────────────────
const QUEUE = [
  { id: "PADMA-L1-004", batch: "BATCH-086", source: "outsourced", weaver: "Padma Veni",   wcode: "WV-002", design: "BKB-045 · Self Brocade",     weight: 842,  std: 850, submitted: "2 hrs ago" },
  { id: "RAVI-L2-008",  batch: "BATCH-089", source: "outsourced", weaver: "Ravi Kumar",   wcode: "WV-001", design: "BKB-031 · Heavy Zari",       weight: 918,  std: 900, submitted: "4 hrs ago" },
  { id: "BKB-L3-002",   batch: "BATCH-OWN", source: "own",        weaver: "Loom 3",       wcode: "",       design: "BKB-022 · Kanjivaram",       weight: 774,  std: 800, submitted: "Yesterday" },
  { id: "SURESH-L2-003",batch: "BATCH-081", source: "outsourced", weaver: "Suresh Murti", wcode: "WV-007", design: "BKB-038 · Gadwal Cotton",    weight: 856,  std: 850, submitted: "Yesterday" },
  { id: "PADMA-L1-005", batch: "BATCH-086", source: "outsourced", weaver: "Padma Veni",   wcode: "WV-002", design: "BKB-045 · Self Brocade",     weight: 848,  std: 850, submitted: "Yesterday" },
  { id: "BKB-L1-004",   batch: "BATCH-OWN", source: "own",        weaver: "Loom 1",       wcode: "",       design: "BKB-019 · Mysore Crepe",     weight: 1048, std: 1000, submitted: "2 days ago" },
];

const DEFECTIVE_LOG = [
  { id: "RAVI-L2-005",  weaver: "Ravi Kumar",  defects: ["Thread Break", "Design Error"], date: "12 Jun", deduction: "₹450" },
  { id: "BKB-L2-001",   weaver: "Loom 2",       defects: ["Weight Problem"],               date: "11 Jun", deduction: "₹220" },
  { id: "PADMA-L1-002", weaver: "Padma Veni",   defects: ["Jari Issue"],                   date: "11 Jun", deduction: "₹380" },
];

const DEFECT_TYPES: { label: string; Icon: React.ElementType }[] = [
  { label: "Thread Break",       Icon: Scissors   },
  { label: "Design Error",       Icon: Palette    },
  { label: "Jari Issue",         Icon: Sparkles   },
  { label: "Weight Problem",     Icon: Scale      },
  { label: "Measurement Error",  Icon: Ruler      },
  { label: "Other",              Icon: HelpCircle },
];

type SareeItem = {
  id: string;
  batch: string;
  source: string;
  weaver: string;
  wcode: string;
  design: string;
  weight: number;
  std: number;
  submitted: string;
  bulkOrderLabel?: string;
  bulkOrderRef?: string;
  sareeTypeCode?: string;
};
type InspectionResult = "defective" | null;

// ── Helpers ──────────────────────────────────────────────────────────────────
function variance(w: number, std: number) {
  const d = w - std;
  return { d, ok: Math.abs(d) <= 50 };
}

function initials(name: string) {
  return name.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2);
}

// ── Main Component ────────────────────────────────────────────────────────────
export function WorkerQC({ isDesktop, isTablet }: { isDesktop?: boolean; isTablet?: boolean }) {
  const { batches } = useBatches();
  const { addReadySaree } = useFinishing();
  const { getDesign } = useDesignLibrary();
  const [openDesignCode, setOpenDesignCode] = useState<string | null>(null);
  const [openSareeTypeCode, setOpenSareeTypeCode] = useState<string | null>(null);
  const openDesign = openDesignCode ? getDesign(openDesignCode) : undefined;
  const openSareeType = openSareeTypeCode ? getSareeTypeByCode(openSareeTypeCode) : undefined;

  // Build QC queue items from active BatchContext rows that have a sareeId assigned
  const contextRows = useMemo<SareeItem[]>(() => {
    return batches
      .filter(b => b.status === "active")
      .flatMap(b =>
        b.rows
          .filter(r => r.sareeId && r.weaverName)
          .map(r => ({
            id: r.sareeId!,
            batch: b.batchId,
            source: "outsourced" as const,
            weaver: r.weaverName!,
            wcode: r.weaverId ?? "",
            design: [r.designCode, r.sareeTypeName].filter(Boolean).join(" · "),
            weight: 0,
            std: 850,
            submitted: "Pending weighing",
            bulkOrderLabel: r.bulkOrderLabel ?? undefined,
            bulkOrderRef: r.bulkOrderRef ?? undefined,
            sareeTypeCode: r.sareeTypeCode ?? undefined,
          }))
      );
  }, [batches]);

  // Merge static QUEUE with context rows, avoiding duplicate IDs
  const ALL_QUEUE = useMemo<SareeItem[]>(() => {
    const staticIds = new Set(QUEUE.map(q => q.id));
    return [...QUEUE, ...contextRows.filter(r => !staticIds.has(r.id))];
  }, [contextRows]);

  const [inspecting, setInspecting] = useState<SareeItem | null>(null);
  const [result, setResult] = useState<InspectionResult>(null);
  const [defectTypes, setDefectTypes] = useState<string[]>([]);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [notes, setNotes] = useState("");
  const [defectSubmitted, setDefectSubmitted] = useState(false);
  const [inspected, setInspected] = useState<Set<string>>(new Set());
  const [defLog, setDefLog] = useState(DEFECTIVE_LOG);
  const [defFilter, setDefFilter] = useState("Today");

  // Queue navigation state
  const [qcTab, setQcTab] = useState<"weavers" | "batches">("weavers");
  const [selectedWeaverQC, setSelectedWeaverQC] = useState<string | null>(null);
  const [selectedBatchQC, setSelectedBatchQC] = useState<string | null>(null);
  const [weaverSearch, setWeaverSearch] = useState("");

  const pending = ALL_QUEUE.filter(s => !inspected.has(s.id));

  // Group pending by weaver
  const weaverGroups = Object.values(
    pending.reduce((acc, s) => {
      if (!acc[s.weaver]) acc[s.weaver] = { name: s.weaver, code: s.wcode, source: s.source, sarees: [] as SareeItem[] };
      acc[s.weaver].sarees.push(s);
      return acc;
    }, {} as Record<string, { name: string; code: string; source: string; sarees: SareeItem[] }>)
  );

  // Group pending by batch
  const batchGroups = Object.values(
    pending.reduce((acc, s) => {
      if (!acc[s.batch]) acc[s.batch] = { id: s.batch, sarees: [] as SareeItem[] };
      acc[s.batch].sarees.push(s);
      return acc;
    }, {} as Record<string, { id: string; sarees: SareeItem[] }>)
  );

  const filteredWeavers = weaverSearch
    ? weaverGroups.filter(w => w.name.toLowerCase().includes(weaverSearch.toLowerCase()) || w.code.toLowerCase().includes(weaverSearch.toLowerCase()))
    : weaverGroups;

  const reset = () => {
    setResult(null);
    setDefectTypes([]);
    setHasPhoto(false);
    setNotes("");
    setDefectSubmitted(false);
  };

  const markPassedDirect = (s: SareeItem) => {
    setInspected(p => new Set(p).add(s.id));

    const { code: designCode, typeName } = splitDesignField(s.design);
    const sareeTypeCode = s.sareeTypeCode ?? getSareeTypeByName(typeName)?.code ?? "";
    const qcPassDate = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

    addReadySaree({
      id: s.id,
      weaverId: s.wcode || undefined,
      weaverName: s.weaver,
      designCode,
      sareeTypeCode,
      sareeType: typeName,
      weight: s.weight ? `${s.weight}g` : undefined,
      qcPassDate,
      bulkOrderRef: s.bulkOrderRef,
      status: "qc-passed-pending-finishing",
    });
  };

  const startDefect = (s: SareeItem) => {
    reset();
    setInspecting(s);
    setResult("defective");
  };

  const closeInspect = () => { setInspecting(null); reset(); };

  const confirmDefective = () => {
    if (!inspecting) return;
    setDefLog(p => [{ id: inspecting.id, weaver: inspecting.weaver, defects: defectTypes, date: "13 Jun", deduction: "₹450" }, ...p]);
    setInspected(p => new Set(p).add(inspecting.id));
    setDefectSubmitted(true);
  };

  // ── Inspection / Defect screen ─────────────────────────────────────────────
  if (inspecting) {
    const v = variance(inspecting.weight, inspecting.std);
    return (
      <AnimatePresence mode="wait">
        <motion.div key="inspect" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <div style={{ background: T.gradHero, height: 50, display: "flex", alignItems: "center", padding: "0 16px", gap: 10, borderRadius: isDesktop ? "10px 10px 0 0" : 0 }}>
            <button onClick={closeInspect} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 4 }}>
              <ChevronLeft size={18} color="rgba(255,255,255,0.85)" />
            </button>
            <span style={{ fontFamily: F.u, fontSize: 14, fontWeight: 600, color: "#FFF", flex: 1 }}>
              Mark Defective: {inspecting.id}
            </span>
          </div>

          {/* Defect submitted — confirmation */}
          {defectSubmitted && (
            <div style={{ padding: "20px 16px" }}>
              <div style={{ ...baseCard, padding: 20, border: `1px solid rgba(192,57,43,0.25)` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: T.bgCrim, border: `1.5px solid ${T.crim}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <XCircle size={22} color={T.crim} />
                  </div>
                  <div style={{ fontFamily: F.d, fontSize: 16, fontWeight: 700, color: T.brown }}>{inspecting.id} — DEFECTIVE</div>
                </div>
                <div style={{ fontFamily: F.u, fontSize: 13, color: T.muted, lineHeight: 1.5, marginBottom: 12 }}>
                  Stored in defective inventory. Deduction applied. WhatsApp sent.
                </div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
                  {defectTypes.map(d => <span key={d} style={{ fontFamily: F.u, fontSize: 11, fontWeight: 600, color: "#FFF", background: T.crim, padding: "2px 9px", borderRadius: 999 }}>{d}</span>)}
                </div>
                <div style={{ fontFamily: F.m, fontSize: 15, fontWeight: 700, color: T.crim, marginBottom: 18 }}>₹450 deducted</div>
                <button onClick={closeInspect} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, width: "100%", height: 48, background: T.burg, border: "none", borderRadius: 999, fontFamily: F.u, fontSize: 14, fontWeight: 700, color: "#FFF", cursor: "pointer", marginBottom: 10 }}>
                  <CheckCircle2 size={15} /> Back to Queue
                </button>
              </div>
            </div>
          )}

          {/* Defect entry form */}
          {!defectSubmitted && (
            <div style={{ paddingBottom: 28 }}>
              {/* Saree info strip */}
              <div style={{ margin: "12px 16px" }}>
                <div style={{ ...baseCard, overflow: "hidden" }}>
                  <div style={{ background: T.gradHero, padding: "12px 16px 10px" }}>
                    <div style={{ fontFamily: F.m, fontSize: 16, fontWeight: 700, color: T.goldL, marginBottom: 4 }}>{inspecting.id}</div>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: F.m, fontSize: 10, color: T.goldL, background: "rgba(200,155,71,0.20)", padding: "2px 7px", borderRadius: 999 }}>{inspecting.batch}</span>
                      <span style={{ fontFamily: F.u, fontSize: 10, color: "#FFF", background: inspecting.source === "outsourced" ? "rgba(30,102,64,0.70)" : "rgba(255,255,255,0.20)", padding: "2px 7px", borderRadius: 999 }}>
                        {inspecting.source === "outsourced" ? `Weaver: ${inspecting.weaver}` : `Own: ${inspecting.weaver}`}
                      </span>
                    </div>
                  </div>
                  <div style={{ padding: "10px 16px", display: "flex", gap: 20, alignItems: "center" }}>
                    <div>
                      <div style={{ fontFamily: F.u, fontSize: 10, color: T.muted }}>Recorded</div>
                      <div style={{ fontFamily: F.m, fontSize: 14, fontWeight: 600, color: T.brown }}>{inspecting.weight}g</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: F.u, fontSize: 10, color: T.muted }}>Standard</div>
                      <div style={{ fontFamily: F.m, fontSize: 14, fontWeight: 600, color: T.brown }}>{inspecting.std}g</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      {v.ok ? <CheckCircle2 size={12} color={T.green} /> : <AlertTriangle size={12} color={T.crim} />}
                      <span style={{ fontFamily: F.u, fontSize: 11, color: v.ok ? T.green : T.crim }}>{v.d > 0 ? "+" : ""}{v.d}g {v.ok ? "✓" : "✗"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Defect types */}
              <div style={{ padding: "0 16px" }}>
                <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 700, color: T.brown, marginBottom: 3 }}>What is wrong with this saree?</div>
                <div style={{ fontFamily: F.u, fontSize: 12, color: T.muted, marginBottom: 12 }}>Select all that apply.</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                  {DEFECT_TYPES.map(dt => {
                    const sel = defectTypes.includes(dt.label);
                    return (
                      <button key={dt.label} onClick={() => setDefectTypes(p => p.includes(dt.label) ? p.filter(x => x !== dt.label) : [...p, dt.label])}
                        style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, height: 72, background: sel ? "rgba(110,15,45,0.05)" : T.card, border: sel ? `2px solid ${T.burg}` : `1px solid ${T.bdr}`, borderRadius: 10, cursor: "pointer", position: "relative" }}>
                        {sel && <div style={{ position: "absolute", top: 4, right: 4, width: 14, height: 14, background: T.gold, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><CheckCircle2 size={9} color="#FFF" /></div>}
                        <dt.Icon size={18} color={sel ? T.burg : T.muted} />
                        <span style={{ fontFamily: F.u, fontSize: 10, fontWeight: sel ? 600 : 400, color: sel ? T.brown : T.muted, textAlign: "center", lineHeight: 1.2 }}>{dt.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: T.brown, marginBottom: 8 }}>Photo of defect</div>
                {!hasPhoto ? (
                  <div style={{ border: "1px dashed rgba(110,15,45,0.25)", borderRadius: 10, padding: "14px 12px", marginBottom: 14 }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setHasPhoto(true)} style={{ flex: 1, height: 44, background: T.burg, border: "none", borderRadius: 999, fontFamily: F.u, fontSize: 12, fontWeight: 600, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                        <Camera size={13} /> Take Photo
                      </button>
                      <button onClick={() => setHasPhoto(true)} style={{ flex: 1, height: 44, background: "#FFF", border: `1px solid ${T.burg}`, borderRadius: 999, fontFamily: F.u, fontSize: 12, fontWeight: 600, color: T.burg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                        <UploadCloud size={13} /> Gallery
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 60, height: 60, background: "#F5E8D0", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${T.bdr}`, position: "relative" }}>
                      <Camera size={22} color={T.muted} />
                      <div style={{ position: "absolute", top: -4, right: -4, width: 18, height: 18, background: T.green, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <CheckCircle2 size={10} color="#FFF" />
                      </div>
                    </div>
                    <div>
                      <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 500, color: T.green }}>Defect photo captured</div>
                      <button onClick={() => setHasPhoto(false)} style={{ background: "none", border: "none", fontFamily: F.u, fontSize: 11, color: T.burg, cursor: "pointer", textDecoration: "underline", padding: 0 }}>Retake</button>
                    </div>
                  </div>
                )}

                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes (optional)..."
                  style={{ width: "100%", minHeight: 70, background: T.inp, border: `1px solid ${T.bdrMed}`, borderRadius: 10, padding: "10px 12px", fontFamily: F.u, fontSize: 13, color: T.brown, outline: "none", resize: "none", boxSizing: "border-box", marginBottom: 14 } as React.CSSProperties} />

                <div style={{ background: T.bgCrim, border: `1px solid rgba(192,57,43,0.20)`, borderRadius: 8, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <AlertTriangle size={14} color={T.crim} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontFamily: F.u, fontSize: 11, color: T.crim, lineHeight: 1.5 }}>
                    ₹450 will be deducted from {inspecting.source === "outsourced" ? inspecting.weaver : "this loom"}'s payment. Weaver notified via WhatsApp.
                  </div>
                </div>

                <button onClick={confirmDefective} disabled={defectTypes.length === 0 || !hasPhoto}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, width: "100%", height: 52, background: defectTypes.length > 0 && hasPhoto ? T.crim : "#DDD", border: "none", borderRadius: 999, fontFamily: F.u, fontSize: 14, fontWeight: 700, color: defectTypes.length > 0 && hasPhoto ? "#FFF" : "#999", cursor: defectTypes.length > 0 && hasPhoto ? "pointer" : "not-allowed" }}>
                  <XCircle size={15} /> Confirm — Mark as Defective
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  }

  // ── Queue view ────────────────────────────────────────────────────────────
  const pad = isDesktop ? "0 0" : "0 16px";
  const defCols = isDesktop ? "repeat(4, 1fr)" : isTablet ? "repeat(3, 1fr)" : "1fr 1fr";

  // Saree card renderer (used in weaver view and batch view)
  const renderSareeCard = (s: SareeItem) => {
    const v = variance(s.weight, s.std);
    const btnH = 52; // Pass/Defective buttons — minimum 52px tap target at all sizes
    const idSize = isDesktop ? 13 : 11;
    const labelSize = isDesktop ? 13 : 11;
    const metaSize = isDesktop ? 12 : 10;
    return (
      <div key={s.id} style={{ ...baseCard, borderTop: `3px solid ${T.gold}`, overflow: "hidden" }}>
        <div style={{ padding: isDesktop ? "14px 16px 10px" : "10px 12px 8px" }}>
          <div style={{ fontFamily: F.m, fontSize: idSize, fontWeight: 700, color: T.burg, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.id}</div>
          <div style={{ display: "flex", gap: 4, marginBottom: 5, flexWrap: "wrap" }}>
            <span style={{ fontFamily: F.m, fontSize: metaSize - 1, color: T.goldL, background: "rgba(200,155,71,0.15)", padding: "2px 7px", borderRadius: 999 }}>{s.batch}</span>
            <span style={{ fontFamily: F.u, fontSize: metaSize - 1, color: "#FFF", background: s.source === "outsourced" ? T.green : T.brown, padding: "2px 7px", borderRadius: 999 }}>
              {s.source === "outsourced" ? "Out" : "Own"}
            </span>
            {s.bulkOrderLabel
              ? <span style={{ fontFamily: F.u, fontSize: metaSize - 1, color: T.green, background: T.bgGreen, padding: "2px 7px", borderRadius: 999, border: "1px solid rgba(30,102,64,0.18)" }}>{s.bulkOrderLabel}</span>
              : <span style={{ fontFamily: F.u, fontSize: metaSize - 1, color: T.muted, background: "rgba(139,112,96,0.10)", padding: "2px 7px", borderRadius: 999 }}>General Stock</span>
            }
          </div>
          <div style={{ fontFamily: F.u, fontSize: labelSize, fontWeight: 600, color: T.brown, marginBottom: 2 }}>{s.weaver}</div>
          {s.wcode && <div style={{ fontFamily: F.m, fontSize: metaSize - 1, color: T.muted, marginBottom: 3 }}>{s.wcode}</div>}
          <div style={{ fontFamily: F.u, fontSize: metaSize, color: T.muted, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {(() => {
              const { code, typeName } = splitDesignField(s.design);
              const typeRec = typeName ? getSareeTypeByName(typeName) : undefined;
              return (
                <>
                  <span onClick={e => { e.stopPropagation(); setOpenDesignCode(code); }}
                    style={{ cursor: "pointer" }}
                    onMouseEnter={e => (e.currentTarget as HTMLSpanElement).style.textDecoration = "underline"}
                    onMouseLeave={e => (e.currentTarget as HTMLSpanElement).style.textDecoration = "none"}
                  >{code}</span>
                  {typeName && <> · <span onClick={e => { e.stopPropagation(); if (typeRec) setOpenSareeTypeCode(typeRec.code); }}
                    style={{ cursor: typeRec ? "pointer" : "default" }}
                    onMouseEnter={e => (e.currentTarget as HTMLSpanElement).style.textDecoration = "underline"}
                    onMouseLeave={e => (e.currentTarget as HTMLSpanElement).style.textDecoration = "none"}
                  >{typeName}</span></>}
                </>
              );
            })()}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
            <span style={{ fontFamily: F.m, fontSize: labelSize, fontWeight: 600, color: T.brown }}>{s.weight}g</span>
            <span style={{ fontFamily: F.u, fontSize: metaSize, color: T.muted }}>/ {s.std}g</span>
            {v.ok ? <CheckCircle2 size={11} color={T.green} /> : <AlertTriangle size={11} color={T.crim} />}
          </div>
          <div style={{ fontFamily: F.m, fontSize: metaSize, color: T.muted }}>{s.submitted}</div>
        </div>
        {/* Passed / Defective buttons */}
        <div style={{ display: "flex", borderTop: `1px solid ${T.bdr}` }}>
          <button onClick={() => markPassedDirect(s)} style={{
            flex: 1, height: btnH, background: T.green, border: "none",
            fontFamily: F.u, fontSize: isDesktop ? 12 : 10, fontWeight: 700, color: "#FFF", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
          }}>
            <CheckCircle2 size={isDesktop ? 13 : 11} /> Passed
          </button>
          <div style={{ width: 1, background: "rgba(255,255,255,0.3)" }} />
          <button onClick={() => startDefect(s)} style={{
            flex: 1, height: btnH, background: T.crim, border: "none",
            fontFamily: F.u, fontSize: isDesktop ? 12 : 10, fontWeight: 700, color: "#FFF", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
          }}>
            <XCircle size={isDesktop ? 13 : 11} /> Defective
          </button>
        </div>
      </div>
    );
  };

  // ── Weaver sarees sub-view ────────────────────────────────────────────────
  if (selectedWeaverQC !== null) {
    const wg = weaverGroups.find(w => w.name === selectedWeaverQC);
    const wSarees = wg?.sarees ?? [];
    const cols = isDesktop ? "repeat(4, 1fr)" : isTablet ? "repeat(3, 1fr)" : "1fr 1fr";
    return (
      <div style={{ paddingBottom: 28 }}>
        {/* Header */}
        <div style={{ background: T.gradHero, padding: isDesktop ? "10px 4px" : "10px 16px", marginBottom: 12, borderRadius: isDesktop ? 10 : 0, display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setSelectedWeaverQC(null)} style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <ChevronLeft size={16} color="#FFF" />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: F.u, fontSize: isDesktop ? 15 : 13, fontWeight: 700, color: "#FFF" }}>{selectedWeaverQC}</div>
            <div style={{ fontFamily: F.u, fontSize: isDesktop ? 12 : 10, color: "rgba(255,255,255,0.65)" }}>{wSarees.length} saree{wSarees.length !== 1 ? "s" : ""} pending QC</div>
          </div>
          {wg?.code && <span style={{ fontFamily: F.m, fontSize: 11, color: T.goldL, background: "rgba(200,155,71,0.20)", padding: "3px 9px", borderRadius: 999 }}>{wg.code}</span>}
        </div>

        {wSarees.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <CheckCircle2 size={36} color={T.green} style={{ margin: "0 auto 10px" }} />
            <div style={{ fontFamily: F.u, fontSize: 15, fontWeight: 600, color: T.brown }}>All done for this weaver!</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: cols, gap: isDesktop ? 14 : 10, padding: pad }}>
            {wSarees.map(renderSareeCard)}
          </div>
        )}
      </div>
    );
  }

  // ── Batch sarees sub-view ─────────────────────────────────────────────────
  if (selectedBatchQC !== null) {
    const bg = batchGroups.find(b => b.id === selectedBatchQC);
    const bSarees = bg?.sarees ?? [];
    // Group by weaver within batch
    const bWeaverGroups = Object.values(
      bSarees.reduce((acc, s) => {
        if (!acc[s.weaver]) acc[s.weaver] = { name: s.weaver, sarees: [] as SareeItem[] };
        acc[s.weaver].sarees.push(s);
        return acc;
      }, {} as Record<string, { name: string; sarees: SareeItem[] }>)
    );
    const cols = isDesktop ? "repeat(4, 1fr)" : isTablet ? "repeat(3, 1fr)" : "1fr 1fr";
    return (
      <div style={{ paddingBottom: 28 }}>
        <div style={{ background: T.gradHero, padding: isDesktop ? "10px 4px" : "10px 16px", marginBottom: 16, borderRadius: isDesktop ? 10 : 0, display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setSelectedBatchQC(null)} style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <ChevronLeft size={16} color="#FFF" />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: F.m, fontSize: isDesktop ? 15 : 13, fontWeight: 700, color: T.goldL }}>{selectedBatchQC}</div>
            <div style={{ fontFamily: F.u, fontSize: isDesktop ? 12 : 10, color: "rgba(255,255,255,0.65)" }}>{bSarees.length} saree{bSarees.length !== 1 ? "s" : ""} · {bWeaverGroups.length} weaver{bWeaverGroups.length !== 1 ? "s" : ""}</div>
          </div>
        </div>

        {bWeaverGroups.map(wg => (
          <div key={wg.name} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: isDesktop ? "0 0 8px" : "0 16px 8px" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.burg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 10, color: "#FFF" }}>{initials(wg.name)}</span>
              </div>
              <span style={{ fontFamily: F.u, fontSize: isDesktop ? 14 : 12, fontWeight: 600, color: T.brown }}>{wg.name}</span>
              <span style={{ fontFamily: F.u, fontSize: 10, color: T.muted, background: T.bgGold, border: `1px solid rgba(200,155,71,0.25)`, padding: "2px 8px", borderRadius: 999 }}>{wg.sarees.length} sarees</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: cols, gap: isDesktop ? 14 : 10, padding: pad }}>
              {wg.sarees.map(renderSareeCard)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Main queue view ───────────────────────────────────────────────────────
  return (
    <div style={{ paddingBottom: 28 }}>
      {/* Stats row */}
      <div style={{ display: "flex", gap: 8, padding: isDesktop ? "0 0 12px" : "0 16px 12px", flexWrap: "wrap" }}>
        {[
          { label: `${pending.length} Pending Inspection`, bg: T.bgCrim, color: T.crim, bdr: "rgba(192,57,43,0.20)" },
          { label: "238 Passed This Month", bg: T.bgGreen, color: T.green, bdr: "rgba(30,102,64,0.20)" },
          { label: "10 Rejected", bg: T.bgGold, color: T.gold, bdr: "rgba(200,155,71,0.25)" },
        ].map((s, i) => (
          <div key={i} id={i === 0 ? "wqc-pending" : i === 1 ? "wqc-completed" : undefined} style={{ background: s.bg, border: `1px solid ${s.bdr}`, borderRadius: 999, padding: isDesktop ? "6px 16px" : "5px 12px" }}>
            <span style={{ fontFamily: F.u, fontSize: isDesktop ? 13 : 11, fontWeight: 600, color: s.color }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tab: By Weaver / By Batch */}
      <div id="wqc-in-progress" style={{ display: "flex", margin: isDesktop ? "0 0 12px" : "0 16px 12px", background: "#F5F0F2", borderRadius: 10, padding: 3 }}>
        {[["weavers", "By Weaver"], ["batches", "By Batch"]] .map(([key, label]) => (
          <button key={key} onClick={() => { setQcTab(key as "weavers" | "batches"); setWeaverSearch(""); }}
            style={{ flex: 1, padding: "9px 8px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: F.u, fontSize: 13, fontWeight: 600, background: qcTab === key ? T.burg : "transparent", color: qcTab === key ? "#FFF" : T.muted }}>
            {label}
          </button>
        ))}
      </div>

      {pending.length === 0 ? (
        <div style={{ padding: "40px 20px", textAlign: "center" }}>
          <CheckCircle2 size={36} color={T.green} style={{ margin: "0 auto 10px" }} />
          <div style={{ fontFamily: F.u, fontSize: 15, fontWeight: 600, color: T.brown }}>All sarees inspected!</div>
        </div>
      ) : qcTab === "weavers" ? (
        <>
          {/* Weaver search */}
          <div style={{ padding: isDesktop ? "0 0 12px" : "0 16px 12px", position: "relative" }}>
            <Search size={14} color={T.muted} style={{ position: "absolute", left: isDesktop ? 12 : 28, top: "50%", transform: "translateY(-50%)" }} />
            <input
              value={weaverSearch} onChange={e => setWeaverSearch(e.target.value)}
              placeholder="Search weavers..."
              style={{ width: "100%", height: 42, background: T.inp, border: `1px solid ${T.bdr}`, borderRadius: 10, padding: "0 14px 0 36px", fontFamily: F.u, fontSize: 13, color: T.brown, outline: "none", boxSizing: "border-box" as const }}
            />
          </div>

          {/* Weaver cards */}
          <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(3, 1fr)" : isTablet ? "repeat(2, 1fr)" : "1fr 1fr", gap: isDesktop ? 14 : 10, padding: pad }}>
            {filteredWeavers.map(wg => (
              <button key={wg.name} onClick={() => setSelectedWeaverQC(wg.name)}
                style={{ ...baseCard, padding: isDesktop ? "16px" : "14px 12px", cursor: "pointer", border: `1px solid ${T.bdr}`, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8, textAlign: "left" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: T.gradHero, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 13, color: "#FFF" }}>{initials(wg.name)}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: F.u, fontSize: isDesktop ? 14 : 12, fontWeight: 700, color: T.brown, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{wg.name}</div>
                    {wg.code && <div style={{ fontFamily: F.m, fontSize: 10, color: T.muted, marginTop: 1 }}>{wg.code}</div>}
                  </div>
                  <ChevronRight size={14} color={T.muted} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ background: T.bgCrim, border: `1px solid rgba(192,57,43,0.20)`, borderRadius: 999, padding: "3px 9px" }}>
                    <span style={{ fontFamily: F.u, fontSize: 11, fontWeight: 700, color: T.crim }}>{wg.sarees.length} pending</span>
                  </div>
                  <div style={{ background: wg.source === "outsourced" ? T.bgGreen : T.bgGold, borderRadius: 999, padding: "3px 9px" }}>
                    <span style={{ fontFamily: F.u, fontSize: 10, fontWeight: 600, color: wg.source === "outsourced" ? T.green : T.gold }}>{wg.source === "outsourced" ? "Outsourced" : "Own Factory"}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        /* Batch cards */
        <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(3, 1fr)" : isTablet ? "repeat(2, 1fr)" : "1fr 1fr", gap: isDesktop ? 14 : 10, padding: pad }}>
          {batchGroups.map(bg => {
            const bweavers = Array.from(new Set(bg.sarees.map(s => s.weaver)));
            return (
              <button key={bg.id} onClick={() => setSelectedBatchQC(bg.id)}
                style={{ ...baseCard, padding: isDesktop ? 16 : "14px 12px", cursor: "pointer", border: `1px solid ${T.bdr}`, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8, textAlign: "left" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: T.bgGold, border: `1px solid rgba(200,155,71,0.30)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Package size={18} color={T.gold} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: F.m, fontSize: isDesktop ? 13 : 11, fontWeight: 700, color: T.burg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{bg.id}</div>
                    <div style={{ fontFamily: F.u, fontSize: 10, color: T.muted, marginTop: 1 }}>{bg.sarees.length} sarees</div>
                  </div>
                  <ChevronRight size={14} color={T.muted} />
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {bweavers.slice(0, 3).map(w => (
                    <span key={w} style={{ fontFamily: F.u, fontSize: 10, color: T.brown, background: "rgba(59,35,20,0.07)", padding: "2px 7px", borderRadius: 999 }}>{w}</span>
                  ))}
                  {bweavers.length > 3 && <span style={{ fontFamily: F.u, fontSize: 10, color: T.muted }}>+{bweavers.length - 3} more</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Defective section */}
      <div id="wqc-defective" style={{ margin: isDesktop ? "20px 0 8px" : "20px 16px 8px", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 3, height: 18, background: T.crim, borderRadius: 2 }} />
        <div style={{ fontFamily: F.u, fontSize: isDesktop ? 15 : 14, fontWeight: 700, color: T.brown }}>Defective Sarees</div>
      </div>
      <div style={{ margin: isDesktop ? "2px 0 10px" : "2px 16px 10px", fontFamily: F.u, fontSize: isDesktop ? 13 : 12, color: T.muted }}>
        Failed quality check — stored separately.
      </div>

      <div style={{ display: "flex", gap: 6, padding: isDesktop ? "0 0 10px" : "0 16px 8px" }}>
        {["Today", "This Week", "This Month", "All Time"].map(f => (
          <button key={f} onClick={() => setDefFilter(f)} style={{ flexShrink: 0, padding: isDesktop ? "5px 14px" : "4px 10px", borderRadius: 999, border: `1px solid ${defFilter === f ? T.burg : T.bdr}`, background: defFilter === f ? T.burg : "#FFF", color: defFilter === f ? "#FFF" : T.muted, fontFamily: F.u, fontSize: isDesktop ? 13 : 11, fontWeight: defFilter === f ? 600 : 400, cursor: "pointer" }}>
            {f}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: defCols, gap: isDesktop ? 12 : 8, padding: isDesktop ? "0" : "0 16px" }}>
        {defLog.map((d, i) => (
          <div key={i} style={{ ...baseCard, padding: isDesktop ? "14px 16px" : "12px 12px", borderLeft: `3px solid ${T.crim}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontFamily: F.m, fontSize: isDesktop ? 13 : 10, fontWeight: 700, color: T.burg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{d.id}</span>
              <span style={{ fontFamily: F.m, fontSize: isDesktop ? 13 : 11, fontWeight: 700, color: T.crim, flexShrink: 0, marginLeft: 6 }}>{d.deduction}</span>
            </div>
            <div style={{ fontFamily: F.u, fontSize: isDesktop ? 12 : 10, color: T.muted, marginBottom: 7 }}>{d.weaver} · {d.date}</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
              {d.defects.map(df => (
                <span key={df} style={{ fontFamily: F.u, fontSize: isDesktop ? 11 : 9, fontWeight: 600, color: T.crim, background: T.bgCrim, border: `1px solid rgba(192,57,43,0.15)`, padding: "2px 7px", borderRadius: 999 }}>{df}</span>
              ))}
            </div>
            <button style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: `1px solid ${T.bdr}`, borderRadius: 7, padding: isDesktop ? "5px 10px" : "4px 8px", fontFamily: F.u, fontSize: isDesktop ? 12 : 10, color: T.muted, cursor: "pointer", width: "100%", justifyContent: "center" }}>
              <Eye size={isDesktop ? 12 : 10} /> View Details
            </button>
          </div>
        ))}
      </div>
      <AnimatePresence>
        {openDesign && <DesignCodeCard design={openDesign} onClose={() => setOpenDesignCode(null)} />}
        {openSareeType && <SareeTypeCard sareeType={openSareeType} onClose={() => setOpenSareeTypeCode(null)} />}
      </AnimatePresence>
    </div>
  );
}
