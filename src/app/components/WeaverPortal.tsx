import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useResponsive } from "./useResponsive";
import { useBatches, SareeRow } from "./BatchContext";
import { useDesignLibrary, DesignEntry } from "./DesignLibraryContext";
import { DesignCodeCard } from "./DesignLibraryPage";
import { useMaterialIssue, MaterialIssueRecord } from "./MaterialIssueContext";
import { useWeaverPayments } from "./WeaverPaymentsContext";
import { motion, AnimatePresence, useInView } from "motion/react";
import {
  Bell, ClipboardList, CheckSquare, Palette, ArrowUpRight,
  Wallet, Shield, Send, ChevronRight, X, ChevronLeft,
  Package, Check, Eye, LogOut, Search, RotateCcw,
  AlertCircle, Clock, Flower2, Layers, Info, Pencil,
  Scissors, LayoutGrid, CreditCard, ClipboardCheck,
  TrendingUp, ArrowRight, Sparkles, UserRound,
  CheckCircle2, History, ListChecks,
  AlertTriangle, Inbox, Zap,
} from "lucide-react";

// ─── Design Tokens ─────────────────────────────────────────────────────────
const C = {
  burg: "#6B1A2A",
  dark: "#3D0E1A",
  gold: "#C4923A",
  green: "#1E6640",
  crim: "#C0392B",
  text: "#1A0A0F",
  muted: "#8B7060",
  bdr: "rgba(139,26,46,0.12)",
  cream: "#F0E8D0",
  inp: "#FFF8E7",
  white: "#FFFFFF",
};
const F = {
  d: "'Plus Jakarta Sans', sans-serif",
  u: "'Inter', sans-serif",
  m: "'JetBrains Mono', monospace",
};

type PageId = "batches" | "confirm" | "designs" | "warp" | "payments" | "notifications";

// ─── Saree type rates (mirrors RatesPricingPage data) ───────────────────────
const SAREE_TYPE_RATES: Record<string, { type: string; description: string; charge: string; retail: string; wholesale: string; stdWeight: string; warpWeight: string; reshamWeight: string; jariWeight: string }> = {
  "SB-001": { type: "Self Brocade",   description: "Traditional brocade with self-woven patterns",     charge: "450",  retail: "8500",  wholesale: "7200",  stdWeight: "850", warpWeight: "480", reshamWeight: "240", jariWeight: "6"  },
  "HZ-003": { type: "Heavy Zari",     description: "Rich gold zari work with heavy metallic detailing", charge: "680",  retail: "12000", wholesale: "10500", stdWeight: "920", warpWeight: "500", reshamWeight: "280", jariWeight: "10" },
  "PS-002": { type: "Plain Silk",     description: "Classic plain silk with minimal ornamentation",     charge: "280",  retail: "5500",  wholesale: "4800",  stdWeight: "780", warpWeight: "450", reshamWeight: "200", jariWeight: "0"  },
  "BS-004": { type: "Bridal Special", description: "Elaborate bridal weave with gold pallu and border", charge: "820",  retail: "15000", wholesale: "13200", stdWeight: "980", warpWeight: "520", reshamWeight: "300", jariWeight: "14" },
};

// ─── Inline design detail card (shown in dashboard, not modal) ───────────────
function DesignDetailCard({ designCode, onClose }: { designCode: string; onClose: () => void }) {
  const { getDesign } = useDesignLibrary();
  const d = getDesign(designCode);
  const BG = "https://images.unsplash.com/photo-1619239635762-8132f6dba51c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800";

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      style={{ background: "#FFF", borderRadius: 16, border: `1px solid ${C.bdr}`, overflow: "hidden", marginTop: 10, boxShadow: "0 4px 24px rgba(44,24,16,0.12)" }}>

      {/* Banner */}
      <div style={{ position: "relative" as const, height: 110, background: `url(${BG}) center/cover`, display: "flex", alignItems: "flex-end", padding: "0 16px 12px" }}>
        <div style={{ position: "absolute" as const, inset: 0, background: "linear-gradient(to top, rgba(26,5,12,0.70) 0%, transparent 60%)" }} />
        <div style={{ position: "relative" as const, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: F.m, fontWeight: 700, fontSize: 16, color: C.gold }}>{designCode}</span>
          {d && <span style={{ fontFamily: F.u, fontSize: 12, color: "rgba(255,255,255,0.70)" }}>{d.name}</span>}
        </div>
        <button onClick={onClose} style={{ position: "absolute" as const, top: 10, right: 10, width: 28, height: 28, borderRadius: 999, background: "rgba(0,0,0,0.45)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X size={13} color="#FFF" />
        </button>
      </div>

      <div style={{ padding: "14px 16px 16px" }}>
        {/* Info grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
          {[
            { label: "DESIGN CODE",    val: designCode },
            { label: "SAREE TYPE",     val: d?.typeName ?? "—" },
            { label: "TYPE CODE",      val: d?.typeCode ?? "—" },
            { label: "TOTAL PRODUCED", val: d ? `${d.total} sarees` : "—" },
          ].map(x => (
            <div key={x.label} style={{ background: C.cream, borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontFamily: F.m, fontSize: 9, color: C.muted, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 3 }}>{x.label}</div>
              <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 13, color: C.text }}>{x.val}</div>
            </div>
          ))}
        </div>

        {d?.desc && (
          <div style={{ background: "#FAFAF8", border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
            <div style={{ fontFamily: F.m, fontSize: 9, color: C.muted, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 4 }}>DESCRIPTION</div>
            <div style={{ fontFamily: F.u, fontSize: 13, color: C.text, lineHeight: 1.5 }}>{d.desc}</div>
          </div>
        )}

        {d?.notesForWeaver && (
          <div style={{ background: "rgba(196,146,58,0.08)", border: `1px solid rgba(196,146,58,0.25)`, borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
            <div style={{ fontFamily: F.m, fontSize: 9, color: C.gold, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 4 }}>NOTES FOR YOU</div>
            <div style={{ fontFamily: F.u, fontSize: 13, color: C.text, lineHeight: 1.5 }}>{d.notesForWeaver}</div>
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1, background: d?.hasGraph ? "rgba(30,102,64,0.08)" : C.cream, border: `1px solid ${d?.hasGraph ? "rgba(30,102,64,0.20)" : C.bdr}`, borderRadius: 10, padding: "8px 12px", display: "flex", alignItems: "center", gap: 7 }}>
            <Layers size={13} color={d?.hasGraph ? C.green : C.muted} />
            <div>
              <div style={{ fontFamily: F.m, fontSize: 9, color: C.muted, letterSpacing: "0.8px", textTransform: "uppercase" as const }}>DESIGN GRAPH</div>
              <div style={{ fontFamily: F.u, fontSize: 12, color: d?.hasGraph ? C.green : C.muted, fontWeight: 600 }}>{d?.hasGraph ? "Uploaded ✓" : "Not uploaded"}</div>
            </div>
          </div>
          <div style={{ flex: 1, background: d?.hasColorSlip ? "rgba(30,102,64,0.08)" : C.cream, border: `1px solid ${d?.hasColorSlip ? "rgba(30,102,64,0.20)" : C.bdr}`, borderRadius: 10, padding: "8px 12px", display: "flex", alignItems: "center", gap: 7 }}>
            <Palette size={13} color={d?.hasColorSlip ? C.green : C.muted} />
            <div>
              <div style={{ fontFamily: F.m, fontSize: 9, color: C.muted, letterSpacing: "0.8px", textTransform: "uppercase" as const }}>COLOR SLIP</div>
              <div style={{ fontFamily: F.u, fontSize: 12, color: d?.hasColorSlip ? C.green : C.muted, fontWeight: 600 }}>{d?.hasColorSlip ? "Uploaded ✓" : "Not uploaded"}</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Inline saree type detail card ───────────────────────────────────────────
function SareeTypeDetailCard({ typeCode, typeName, onClose }: { typeCode: string; typeName: string; onClose: () => void }) {
  const r = SAREE_TYPE_RATES[typeCode];
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      style={{ background: "#FFF", borderRadius: 16, border: `1px solid ${C.bdr}`, overflow: "hidden", marginTop: 10, boxShadow: "0 4px 24px rgba(44,24,16,0.12)" }}>

      {/* Header */}
      <div style={{ background: C.dark, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: F.m, fontSize: 11, color: "rgba(255,255,255,0.55)", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 6, padding: "3px 9px" }}>{typeCode}</span>
          <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 15, color: "#FFF" }}>{typeName}</span>
        </div>
        <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 999, background: "rgba(255,255,255,0.10)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X size={13} color="#FFF" />
        </button>
      </div>

      <div style={{ padding: "14px 16px 16px" }}>
        {r?.description && <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginBottom: 14, lineHeight: 1.5 }}>{r.description}</div>}

        {/* Making charge + weight */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div style={{ background: "rgba(196,146,58,0.08)", border: `1px solid rgba(196,146,58,0.22)`, borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontFamily: F.m, fontSize: 9, color: C.gold, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 4 }}>MAKING CHARGE</div>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 24, color: C.gold }}>₹{r?.charge ?? "—"}</div>
            <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted, marginTop: 2 }}>per saree</div>
          </div>
          <div style={{ background: C.cream, borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontFamily: F.m, fontSize: 9, color: C.muted, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 4 }}>STANDARD WEIGHT</div>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 24, color: C.text }}>{r?.stdWeight ?? "—"}g</div>
            <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted, marginTop: 2 }}>grams</div>
          </div>
        </div>

        {/* Prices */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
          <div style={{ background: "#FAFAF8", border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontFamily: F.m, fontSize: 9, color: C.muted, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 3 }}>RETAIL PRICE</div>
            <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.text }}>₹{r ? Number(r.retail).toLocaleString("en-IN") : "—"}</div>
          </div>
          <div style={{ background: "#FAFAF8", border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontFamily: F.m, fontSize: 9, color: C.muted, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 3 }}>WHOLESALE PRICE</div>
            <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.text }}>₹{r ? Number(r.wholesale).toLocaleString("en-IN") : "—"}</div>
          </div>
        </div>

        {/* Material breakdown */}
        {r && (
          <div>
            <div style={{ fontFamily: F.m, fontSize: 9, color: C.muted, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 8 }}>MATERIAL WEIGHT BREAKDOWN</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[
                { label: "WARP",   val: `${r.warpWeight}g` },
                { label: "RESHAM", val: `${r.reshamWeight}g` },
                { label: "JARI",   val: `${r.jariWeight} reels` },
              ].map(m => (
                <div key={m.label} style={{ background: C.cream, borderRadius: 10, padding: "10px 12px", textAlign: "center" as const }}>
                  <div style={{ fontFamily: F.m, fontSize: 9, color: C.muted, letterSpacing: "0.8px", textTransform: "uppercase" as const, marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 13, color: C.text }}>{m.val}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Shared Components ──────────────────────────────────────────────────────
function SectionTitle({ title, link, onLink }: { title: string; link?: string; onLink?: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", margin: "20px 20px 12px", gap: 10 }}>
      <div style={{ width: 4, height: 20, background: C.burg, borderRadius: 2, flexShrink: 0 }} />
      <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 16, color: C.text, flex: 1 }}>{title}</span>
      {link && (
        <button onClick={onLink} style={{ background: "none", border: "none", fontFamily: F.u, fontSize: 13, color: C.gold, cursor: "pointer", padding: 0 }}>
          {link}
        </button>
      )}
    </div>
  );
}

function Card({ children, style, leftBorder }: { children: React.ReactNode; style?: React.CSSProperties; leftBorder?: string }) {
  return (
    <div style={{
      background: C.white, borderRadius: 16, border: `1px solid ${C.bdr}`,
      boxShadow: "0 2px 16px rgba(44,24,16,0.08)", padding: 20,
      ...(leftBorder ? { borderLeft: `4px solid ${leftBorder}` } : {}),
      ...style,
    }}>
      {children}
    </div>
  );
}

function ProgressBar({ pct, height = 10 }: { pct: number; height?: number }) {
  return (
    <div style={{ width: "100%", height, background: "rgba(139,26,46,0.10)", borderRadius: 999, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(100, pct)}%`, height: "100%", background: C.gold, borderRadius: 999, transition: "width 0.6s ease" }} />
    </div>
  );
}

function StatusBadge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{ background: bg, color, borderRadius: 999, padding: "3px 10px", fontFamily: F.u, fontSize: 12, fontWeight: 500 }}>
      {label}
    </span>
  );
}

function SignatureCanvas({ onSigned }: { onSigned?: (hasData: boolean) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasSig, setHasSig] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setDrawing(true);
    lastPos.current = getPos(e);
  };
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!drawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d")!;
    const pos = getPos(e);
    ctx.strokeStyle = C.burg;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(lastPos.current!.x, lastPos.current!.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
    setHasSig(true);
    onSigned?.(true);
  };
  const endDraw = () => { setDrawing(false); lastPos.current = null; };

  const clear = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && canvasRef.current) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasSig(false);
    onSigned?.(false);
  };

  return (
    <div style={{ margin: "0 20px" }}>
      <div style={{ position: "relative", border: `1px solid rgba(139,26,42,0.25)`, borderRadius: 14, overflow: "hidden", background: "#FFF" }}>
        <canvas
          ref={canvasRef} width={350} height={160}
          style={{ display: "block", width: "100%", height: 160, touchAction: "none", cursor: "crosshair" }}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
        />
        {!hasSig && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none", gap: 8 }}>
            <Pencil size={28} color={C.muted} style={{ opacity: 0.5 }} />
            <span style={{ fontFamily: F.u, fontSize: 14, color: C.muted }}>Sign here with your finger</span>
          </div>
        )}
        {hasSig && (
          <button onClick={clear} style={{ position: "absolute", bottom: 8, right: 12, background: "none", border: "none", fontFamily: F.u, fontSize: 12, color: C.gold, cursor: "pointer" }}>
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Hero Header ────────────────────────────────────────────────────────────

function HeroHeader({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) {
  return (
    <div style={{ background: C.dark, padding: "24px 20px 22px" }}>
      <div style={{ fontFamily: F.m, fontSize: 9, letterSpacing: 3, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", marginBottom: 6 }}>{eyebrow}</div>
      <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 32, color: "#FFF", lineHeight: 1.15, marginBottom: 4 }}>{title}</div>
      <div style={{ fontFamily: F.d, fontStyle: "italic", fontWeight: 500, fontSize: 18, color: C.gold }}>{sub}</div>
    </div>
  );
}

// ─── Design Code Tile Grid (reusable — assigned designs only) ────────────────
function DesignCodeTileGrid({ codes, onOpen }: { codes: string[]; onOpen: (code: string) => void }) {
  const { getDesign } = useDesignLibrary();

  if (codes.length === 0) {
    return (
      <div style={{ margin: "0 20px 14px", background: C.cream, borderRadius: 14, padding: "28px 20px", textAlign: "center" as const }}>
        <Palette size={26} color={C.muted} style={{ margin: "0 auto 10px" }} />
        <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted }}>No designs assigned yet. Check with your supervisor.</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 12, padding: "0 20px 4px", overflowX: "auto" }}>
      {codes.map(code => {
        const d = getDesign(code);
        return (
          <button key={code} onClick={() => onOpen(code)} style={{ flexShrink: 0, width: 120, background: C.white, borderRadius: 12, border: `1px solid ${C.bdr}`, overflow: "hidden", cursor: "pointer", padding: 0, textAlign: "left" as const }}>
            {d?.colorSlipPhoto ? (
              <div style={{ height: 80, backgroundImage: `url(${d.colorSlipPhoto})`, backgroundSize: "cover", backgroundPosition: "center" }} />
            ) : (
              <div style={{ height: 80, background: C.cream, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Flower2 size={30} color={C.muted} />
              </div>
            )}
            <div style={{ padding: "8px 10px" }}>
              <div style={{ fontFamily: F.m, fontSize: 10, color: C.burg, marginBottom: 2 }}>{code}</div>
              <div style={{ fontFamily: F.u, fontSize: 12, color: C.text, lineHeight: 1.3 }}>{d?.name || "—"}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Design Library Strip — only designs assigned to this weaver's active batches ──
function DesignLibrarySection() {
  const { batches } = useBatches();
  const { getDesign } = useDesignLibrary();
  const [viewDesign, setViewDesign] = useState<DesignEntry | null>(null);

  const myDesignCodes = Array.from(new Set(
    batches
      .filter(b => b.status === "active" || b.status === "draft")
      .flatMap(b => b.rows)
      .filter(r => r.weaverId === CURRENT_WEAVER_ID)
      .map(r => r.designCode)
      .filter((c): c is string => Boolean(c))
  ));

  return (
    <>
      <SectionTitle title="Design Library" />
      <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, margin: "-4px 20px 12px" }}>Design instructions assigned to your active batches. Tap a design to view full details.</div>
      <DesignCodeTileGrid codes={myDesignCodes} onOpen={code => { const d = getDesign(code); if (d) setViewDesign(d); }} />
      <AnimatePresence>
        {viewDesign && <DesignCodeCard design={viewDesign} onClose={() => setViewDesign(null)} />}
      </AnimatePresence>
    </>
  );
}

// ─── PAGE 01 — MY BATCHES ──────────────────────────────────────────────────
type MyBatchEntry = { batchId: string; status: string; dueDate: string; rows: SareeRow[]; myRows: SareeRow[]; totalCount: number; createdAt: string; updatedAt: string; };

// Active batch card with inline design/type expand (no modal)
function MobileBatchCard({ b, idx }: { b: MyBatchEntry; idx: number }) {
  const [expandedDesign, setExpandedDesign] = useState<string | null>(null);
  const [expandedType, setExpandedType] = useState<string | null>(null);

  const isActive = b.status === "active";
  const borderColor = idx % 2 === 0 ? C.burg : C.gold;
  const myCount = b.myRows.length;
  const readyCount = b.myRows.filter(r => r.sareeId).length;
  const pendingCount = myCount - readyCount;
  const qcPassedCount = b.myRows.filter(r => r.qcPassed === true).length;
  const designCodes = Array.from(new Set(b.myRows.map(r => r.designCode).filter(Boolean))) as string[];
  const sareeTypePairs = Array.from(new Map(b.myRows.filter(r => r.sareeTypeCode && r.sareeTypeName).map(r => [r.sareeTypeCode!, r.sareeTypeName!])).entries());
  const bulkOrders    = Array.from(new Set(b.myRows.map(r => r.bulkOrderLabel).filter(Boolean))) as string[];
  const generalStock  = b.myRows.filter(r => !r.bulkOrderLabel).length;

  return (
    <div style={{ margin: "0 20px 14px" }}>
      <Card leftBorder={borderColor} style={{ padding: 18 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <span style={{ fontFamily: F.m, fontWeight: 700, fontSize: 17, color: C.burg }}>{b.batchId}</span>
          <StatusBadge
            label={isActive ? "🟢 Open — Weaving" : "🟡 Draft"}
            color={isActive ? C.green : C.gold}
            bg={isActive ? "rgba(30,102,64,0.10)" : "rgba(196,146,58,0.15)"}
          />
        </div>

        {/* Saree count */}
        <div style={{ background: C.cream, borderRadius: 12, padding: "12px 16px", marginBottom: 12, textAlign: "center" as const }}>
          <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted, marginBottom: 3 }}>Sarees assigned to you</div>
          <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 28, color: C.text, lineHeight: 1 }}>{myCount}</div>
          {pendingCount > 0 && (
            <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted, marginTop: 3 }}>
              {readyCount} with ID · {pendingCount} pending setup
            </div>
          )}
        </div>

        {/* QC progress indicator */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>QC: {qcPassedCount} of {myCount} passed</span>
            <span style={{ fontFamily: F.m, fontSize: 12, color: C.text, fontWeight: 600 }}>{Math.round((qcPassedCount / myCount) * 100)}%</span>
          </div>
          <ProgressBar pct={(qcPassedCount / myCount) * 100} height={7} />
        </div>

        {/* Clickable design code chips */}
        {designCodes.length > 0 && (
          <div style={{ marginBottom: 6 }}>
            <div style={{ fontFamily: F.m, fontSize: 9, color: C.muted, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 6 }}>TAP TO VIEW DESIGN DETAILS</div>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
              {designCodes.map(dc => (
                <button key={dc} onClick={() => setExpandedDesign(expandedDesign === dc ? null : dc)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, background: expandedDesign === dc ? C.burg : "rgba(107,26,42,0.07)", border: `1.5px solid ${expandedDesign === dc ? C.burg : C.bdr}`, borderRadius: 8, padding: "5px 12px", cursor: "pointer" }}>
                  <Palette size={11} color={expandedDesign === dc ? "#FFF" : C.burg} />
                  <span style={{ fontFamily: F.m, fontSize: 12, color: expandedDesign === dc ? "#FFF" : C.burg, fontWeight: 700 }}>{dc}</span>
                </button>
              ))}
            </div>
            <AnimatePresence>
              {expandedDesign && designCodes.includes(expandedDesign) && (
                <DesignDetailCard key={expandedDesign} designCode={expandedDesign} onClose={() => setExpandedDesign(null)} />
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Clickable saree type chips */}
        {sareeTypePairs.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontFamily: F.m, fontSize: 9, color: C.muted, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 6 }}>TAP TO VIEW SAREE TYPE DETAILS</div>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
              {sareeTypePairs.map(([code, name]) => (
                <button key={code} onClick={() => setExpandedType(expandedType === code ? null : code)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, background: expandedType === code ? C.dark : "rgba(61,14,26,0.04)", border: `1.5px solid ${expandedType === code ? C.dark : C.bdr}`, borderRadius: 8, padding: "5px 12px", cursor: "pointer" }}>
                  <Layers size={11} color={expandedType === code ? "#FFF" : C.text} />
                  <span style={{ fontFamily: F.u, fontSize: 12, color: expandedType === code ? "#FFF" : C.text }}>{name}</span>
                </button>
              ))}
            </div>
            <AnimatePresence>
              {expandedType && (
                <SareeTypeDetailCard
                  key={expandedType}
                  typeCode={expandedType}
                  typeName={sareeTypePairs.find(([c]) => c === expandedType)?.[1] ?? expandedType}
                  onClose={() => setExpandedType(null)}
                />
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Order strips */}
        {bulkOrders.map(label => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(30,102,64,0.07)", border: "1px solid rgba(30,102,64,0.15)", borderRadius: 9, padding: "8px 12px", marginBottom: 8 }}>
            <Package size={13} color={C.green} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted }}>Customer Order</div>
              <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.green }}>{label}</div>
            </div>
          </div>
        ))}
        {generalStock > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(139,112,96,0.07)", border: "1px solid rgba(139,112,96,0.15)", borderRadius: 9, padding: "8px 12px", marginBottom: 8 }}>
            <Package size={13} color={C.muted} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted }}>General Stock</div>
              <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.text }}>{generalStock} saree{generalStock !== 1 ? "s" : ""} for stock</div>
            </div>
          </div>
        )}

        {b.dueDate && (
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 4 }}>
            <Clock size={14} color={C.muted} />
            <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>Due by <span style={{ color: C.text, fontWeight: 600 }}>{b.dueDate}</span></span>
          </div>
        )}
      </Card>
    </div>
  );
}

// Completed batch card — shown only once ALL of the weaver's sarees in the batch have passed QC
function CompletedBatchCard({ b, onDesignClick }: { b: MyBatchEntry; onDesignClick?: (code: string) => void }) {
  const designCodes = Array.from(new Set(b.myRows.map(r => r.designCode).filter(Boolean))) as string[];
  const produced = b.myRows.length;
  return (
    <div style={{ margin: "0 16px 12px", background: C.white, borderRadius: 18, border: `1px solid ${C.bdr}`, overflow: "hidden", boxShadow: "0 2px 16px rgba(44,24,16,0.07)" }}>
      {/* Color band + design code */}
      <div style={{ height: 56, background: "linear-gradient(135deg, #1E6640 0%, #2D9640 100%)", display: "flex", alignItems: "center", padding: "0 16px", gap: 10, position: "relative" as const }}>
        <div style={{ position: "absolute" as const, inset: 0, background: "linear-gradient(to right, rgba(26,5,12,0.45) 0%, transparent 70%)" }} />
        <div style={{ position: "relative" as const, display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
          <Flower2 size={18} color="rgba(255,255,255,0.70)" />
          <span style={{ fontFamily: F.m, fontWeight: 700, fontSize: 14, color: "#FFF" }}>{b.batchId}</span>
          {designCodes.map(dc => (
            <span
              key={dc}
              onClick={e => { e.stopPropagation(); onDesignClick?.(dc); }}
              style={{ fontFamily: F.u, fontSize: 11, color: "rgba(255,255,255,0.65)", cursor: onDesignClick ? "pointer" : "default", textDecoration: onDesignClick ? "underline" : "none" }}
            >{dc}</span>
          ))}
        </div>
        <span style={{ position: "relative" as const, fontFamily: F.u, fontSize: 11, color: "#1D4ED8", background: "rgba(255,255,255,0.92)", borderRadius: 999, padding: "3px 10px", fontWeight: 600 }}>✓ Completed</span>
      </div>

      <div style={{ padding: "14px 16px" }}>
        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
          <div style={{ background: C.cream, borderRadius: 10, padding: "10px 10px", textAlign: "center" as const }}>
            <div style={{ fontFamily: F.m, fontSize: 8, color: C.muted, letterSpacing: "0.8px", textTransform: "uppercase" as const, marginBottom: 3 }}>PRODUCED</div>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: C.text }}>{produced}</div>
            <div style={{ fontFamily: F.u, fontSize: 10, color: C.muted }}>sarees</div>
          </div>
          <div style={{ background: "rgba(30,102,64,0.08)", borderRadius: 10, padding: "10px 10px", textAlign: "center" as const }}>
            <div style={{ fontFamily: F.m, fontSize: 8, color: C.muted, letterSpacing: "0.8px", textTransform: "uppercase" as const, marginBottom: 3 }}>QC PASS</div>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: C.green }}>100%</div>
            <div style={{ fontFamily: F.u, fontSize: 10, color: C.muted }}>all passed</div>
          </div>
        </div>

        {b.dueDate && (
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Clock size={13} color={C.muted} />
            <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>Due by <span style={{ color: C.text, fontWeight: 600 }}>{b.dueDate}</span></span>
          </div>
        )}
      </div>
    </div>
  );
}

type BatchQuickFilter = "all" | "active" | "qc-pending" | "completed" | "draft";
const BATCH_QUICK_FILTERS: { id: BatchQuickFilter; label: string }[] = [
  { id: "all",        label: "All" },
  { id: "active",     label: "Active" },
  { id: "qc-pending", label: "QC Pending" },
  { id: "completed",  label: "Completed" },
  { id: "draft",      label: "Draft" },
];

function BatchQuickFilterPills({ value, onChange }: { value: BatchQuickFilter; onChange: (v: BatchQuickFilter) => void }) {
  return (
    <div style={{ position: "relative" as const }}>
      <div className="wp-filter-scroll" style={{ display: "flex", gap: 8, padding: "12px 20px 4px", overflowX: "auto", scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}>
        <style>{`.wp-filter-scroll::-webkit-scrollbar { display: none; }`}</style>
        {BATCH_QUICK_FILTERS.map(f => {
          const isActive = value === f.id;
          return (
            <button key={f.id} onClick={() => onChange(f.id)} style={{
              flexShrink: 0, padding: "8px 16px", borderRadius: 999,
              border: isActive ? "none" : `1px solid ${C.bdr}`,
              background: isActive ? C.burg : "#FFFFFF",
              color: isActive ? "#FFFFFF" : C.text,
              fontFamily: F.u, fontSize: 13, fontWeight: isActive ? 600 : 400,
              cursor: "pointer", whiteSpace: "nowrap" as const,
            }}>
              {f.label}
            </button>
          );
        })}
      </div>
      {/* Fade hint — signals there are more pills to scroll to, so the last one
          never looks like it's simply been cut off by the screen edge. */}
      <div style={{ position: "absolute" as const, top: 0, right: 0, bottom: 4, width: 28, background: "linear-gradient(to right, rgba(255,255,255,0), #FAFAFA)", pointerEvents: "none" as const }} />
    </div>
  );
}

function MyBatchesPage() {
  const { isMobile, cols } = useResponsive();
  const { batches } = useBatches();
  const [viewDesignCode, setViewDesignCode] = useState<string | null>(null);
  const [quickFilter, setQuickFilter] = useState<BatchQuickFilter>("all");

  const myWeaverBatches: MyBatchEntry[] = batches
    .map(b => ({ ...b, myRows: b.rows.filter(r => r.weaverId === CURRENT_WEAVER_ID) }))
    .filter(b => b.myRows.length > 0);

  // Completed: every saree row assigned to this weaver in the batch has passed QC
  const completedBatches: MyBatchEntry[] = myWeaverBatches.filter(b => b.myRows.every(r => r.qcPassed === true));
  // Active: anything not yet fully QC-passed stays here, with a "X of Y passed" progress indicator
  const myActiveBatches: MyBatchEntry[] = myWeaverBatches.filter(b => !b.myRows.every(r => r.qcPassed === true));

  const totalMyActive = myActiveBatches.length;

  // Quick filter — narrows which of the two sections below are shown, and which batches within them
  const showActiveSection = quickFilter === "all" || quickFilter === "active" || quickFilter === "qc-pending" || quickFilter === "draft";
  const showCompletedSection = quickFilter === "all" || quickFilter === "completed";
  const visibleActiveBatches = myActiveBatches.filter(b => {
    if (quickFilter === "draft") return b.status === "draft";
    if (quickFilter === "active") return b.status === "active";
    if (quickFilter === "qc-pending") return b.myRows.some(r => r.qcPassed !== true);
    return true;
  });

  return (
    <div style={{ paddingBottom: 32 }}>
      <HeroHeader eyebrow="SINCE 1999 · MY WORK" title="My Batches" sub="Active and completed work" />
      <BatchQuickFilterPills value={quickFilter} onChange={setQuickFilter} />

      {/* Weaver Identity */}
      <div style={{ background: C.dark, padding: "4px 20px 18px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.burg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 19, color: "#FFF" }}>RK</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 19, color: "#FFF" }}>Ravi Kumar</div>
          <div style={{ fontFamily: F.m, fontSize: 12, color: "rgba(255,255,255,0.60)", marginTop: 3 }}>WVR-014 · Handloom Weaver</div>
        </div>
        <div style={{ border: `1px solid ${C.gold}`, color: C.gold, borderRadius: 999, padding: "6px 14px", fontFamily: F.m, fontSize: 11.5, flexShrink: 0, whiteSpace: "nowrap" as const }}>{totalMyActive} Active {totalMyActive === 1 ? "Batch" : "Batches"}</div>
      </div>

      {/* Stats Strip — spacious, clearly readable */}
      <div style={{ background: C.dark, borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex" }}>
        {[
          { label: "Produced", val: "18" },
          { label: "QC Pass", val: "97%", highlight: true },
          { label: "Earned", val: "₹8,100" },
        ].map((s, i) => (
          <div key={i} style={{
            flex: 1, padding: "16px 10px", textAlign: "center" as const,
            borderRight: i < 2 ? "1px solid rgba(255,255,255,0.08)" : "none",
          }}>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 24, color: s.highlight ? C.gold : "#FFF", lineHeight: 1 }}>{s.val}</div>
            <div style={{ fontFamily: F.u, fontSize: 12.5, color: "rgba(255,255,255,0.60)", marginTop: 5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Active Batches */}
      {showActiveSection && (
      <>
      <SectionTitle title="Active Batches" link="View All History →" onLink={() => {}} />
      <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, margin: "-4px 20px 12px" }}>
        You can have a maximum of 2 active batches at a time.
      </div>

      {visibleActiveBatches.length === 0 ? (
        <div style={{ margin: "0 20px 14px", background: C.cream, borderRadius: 14, padding: "28px 20px", textAlign: "center" as const }}>
          <Package size={28} color={C.muted} style={{ margin: "0 auto 10px" }} />
          <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted }}>No active batches assigned to you yet.</div>
          <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 4 }}>Check back once your supervisor assigns a batch.</div>
        </div>
      ) : isMobile ? (
        visibleActiveBatches.map((b, idx) => <MobileBatchCard key={b.batchId} b={b} idx={idx} />)
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: cols(1, 2, 2), gap: 4 }}>
          {visibleActiveBatches.map((b, idx) => <MobileBatchCard key={b.batchId} b={b} idx={idx} />)}
        </div>
      )}

      {totalMyActive >= 2 && (
        <div style={{ margin: "0 20px 20px", background: C.cream, borderRadius: 12, padding: "12px 16px" }}>
          <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>
            ⚠ You have 2 active batches — the maximum allowed. Complete one before a new one can be assigned.
          </span>
        </div>
      )}
      </>
      )}

      {/* Completed Batches */}
      {showCompletedSection && (
      <>
      <SectionTitle title="Completed Batches" link="See All →" onLink={() => {}} />
      {completedBatches.length === 0 ? (
        <div style={{ margin: "0 20px 14px", background: C.cream, borderRadius: 14, padding: "28px 20px", textAlign: "center" as const }}>
          <CheckCircle2 size={28} color={C.muted} style={{ margin: "0 auto 10px" }} />
          <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted }}>No completed batches yet.</div>
          <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 4 }}>A batch moves here once QC has passed on every saree you wove.</div>
        </div>
      ) : isMobile ? (
        completedBatches.slice(0, 3).map(b => (
          <CompletedBatchCard key={b.batchId} b={b} onDesignClick={setViewDesignCode} />
        ))
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: cols(1, 2, 2), gap: 4 }}>
          {completedBatches.slice(0, 4).map(b => (
            <CompletedBatchCard key={b.batchId} b={b} onDesignClick={setViewDesignCode} />
          ))}
        </div>
      )}
      </>
      )}

      {/* Design Library */}
      <div style={{ marginTop: 8 }}>
        <DesignLibrarySection />
      </div>
      <AnimatePresence>
        {viewDesignCode && <DesignDetailCard designCode={viewDesignCode} onClose={() => setViewDesignCode(null)} />}
      </AnimatePresence>
    </div>
  );
}

// ─── PAGE 02 — CONFIRM MATERIAL RECEIPT ────────────────────────────────────
function materialTypeIcon(type: string) {
  if (type === "Warp") return <Package size={18} color={C.burg} />;
  if (type === "Resham") return <Layers size={18} color={C.burg} />;
  return <span style={{ fontSize: 18 }}>✨</span>;
}

function ConfirmMaterialPage({ onGoToBatches }: { onGoToBatches?: () => void } = {}) {
  const { isMobile, isTablet, cols } = useResponsive();
  const { getRecordsForWeaver, updateSignatureStatus } = useMaterialIssue();
  const { batches } = useBatches();
  const { getDesign } = useDesignLibrary();

  const [sigMethod, setSigMethod] = useState<"none" | "here" | "remote">("none");
  const [hasSig, setHasSig] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmedRecord, setConfirmedRecord] = useState<MaterialIssueRecord | null>(null);
  const [requestSent, setRequestSent] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [viewDesign, setViewDesign] = useState<DesignEntry | null>(null);

  const weaverRecords = getRecordsForWeaver(CURRENT_WEAVER_ID);
  const pendingRecords = weaverRecords.filter(r => r.status === "pending-signature");
  const signedRecords = weaverRecords.filter(r => r.status === "signed");
  const pending = pendingRecords[0] ?? null;

  const myDesignCodes = Array.from(new Set(
    batches
      .filter(b => b.status === "active")
      .flatMap(b => b.rows)
      .filter(r => r.weaverId === CURRENT_WEAVER_ID)
      .map(r => r.designCode)
      .filter((c): c is string => Boolean(c))
  ));

  const canConfirm = (sigMethod === "here" && hasSig) || (sigMethod === "remote" && requestSent);

  const handleConfirm = () => {
    if (!pending || !canConfirm) return;
    updateSignatureStatus(pending.id, sigMethod === "remote" ? "remote" : "here");
    setConfirmedRecord(pending);
    setConfirmed(true);
  };

  const resetToPending = () => {
    setConfirmed(false); setConfirmedRecord(null);
    setSigMethod("none"); setHasSig(false); setRequestSent(false);
  };

  if (confirmed && confirmedRecord) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center" as const }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(30,102,64,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <Check size={36} color={C.green} />
        </div>
        <div style={{ fontFamily: F.d, fontWeight: 600, fontSize: 22, color: C.text, marginBottom: 12 }}>Materials Confirmed!</div>
        <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 16 }}>You have confirmed receipt of all materials in {confirmedRecord.id}. Good luck with your weaving!</div>
        <div style={{ display: "inline-block", background: "rgba(107,26,42,0.08)", color: C.burg, borderRadius: 999, padding: "6px 16px", fontFamily: F.m, fontSize: 14, marginBottom: 28 }}>{confirmedRecord.id}</div>
        <button onClick={resetToPending} style={{ display: "block", width: "100%", height: 52, background: C.burg, border: "none", borderRadius: 999, fontFamily: F.u, fontWeight: 600, fontSize: 16, color: "#FFF", cursor: "pointer", marginBottom: 10 }}>
          View More Pending Receipts
        </button>
        <button onClick={onGoToBatches} style={{ display: "block", width: "100%", height: 48, background: "none", border: `1px solid ${C.bdr}`, borderRadius: 999, fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.muted, cursor: "pointer" }}>
          ← Go to My Batches
        </button>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 32 }}>
      <HeroHeader eyebrow="SINCE 1999 · MATERIAL RECEIPT" title="Confirm Materials" sub="Sign to confirm receipt" />

      {pending ? (
        <>
          {/* Alert card */}
          <div style={{ margin: "16px 20px", background: "rgba(196,146,58,0.15)", border: `2px solid ${C.gold}`, borderRadius: 16, padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <Bell size={24} color={C.gold} />
              <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 16, color: C.text }}>Material Handover Pending Confirmation</span>
            </div>
            <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 12 }}>
              Your materials have been issued. Please review the list below and sign to confirm receipt.
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              <span style={{ fontFamily: F.m, fontSize: 14, color: C.burg }}>{pending.id}</span>
              <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>Issued {new Date(pending.issuedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
            </div>
          </div>

          {/* Materials List */}
          <SectionTitle title="Materials You Are Receiving" />
          <div style={{ display: "grid", gridTemplateColumns: cols(1, 2, 2), gap: 10, margin: "0 20px 10px" }}>
            {pending.materials.map((m, i) => (
              <div key={i} style={{ background: C.white, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, justifyContent: "center" }}>
                  {materialTypeIcon(m.materialType)}
                  <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 16, color: C.text }}>
                    {m.materialType}{m.materialType === "Warp" && m.warpSubtype ? ` — ${m.warpSubtype}` : ""}
                  </span>
                </div>
                <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 22, color: C.gold, textAlign: "center" as const, marginBottom: 4 }}>
                  {m.quantity} {m.unit}{m.materialType === "Jari" ? ` (${m.jariType} · ${m.jariGrade} · ${m.jariColor})` : ""}
                </div>
                {m.description && <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, textAlign: "center" as const, marginBottom: 4 }}>{m.description}</div>}
                <div style={{ fontFamily: F.m, fontSize: 11, color: C.muted, textAlign: "center" as const }}>From batch: {m.grnBatchId}</div>
              </div>
            ))}
          </div>

          {/* Design Codes */}
          <SectionTitle title="Your Design Instructions" />
          <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, margin: "-4px 20px 12px" }}>
            Tap a design code to view full weaving instructions.
          </div>
          {myDesignCodes.length === 0 ? (
            <div style={{ margin: "0 20px 16px", background: C.cream, borderRadius: 12, padding: "18px 16px", textAlign: "center" as const }}>
              <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>Design codes will appear here once assigned by Admin.</div>
            </div>
          ) : (
            <div style={{ marginBottom: 16 }}>
              <DesignCodeTileGrid codes={myDesignCodes} onOpen={code => { const d = getDesign(code); if (d) setViewDesign(d); }} />
            </div>
          )}
          <AnimatePresence>
            {viewDesign && <DesignCodeCard design={viewDesign} onClose={() => setViewDesign(null)} />}
          </AnimatePresence>

          {/* Signature Section */}
          <SectionTitle title="Your Signature" />
          <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, margin: "-4px 20px 14px", lineHeight: 1.5 }}>
            Sign below to confirm you have received all materials listed above. This creates a permanent record.
          </div>

          {/* Option A + Option B: side by side on tablet/desktop, stacked on mobile */}
          <div style={{ display: "flex", flexDirection: isMobile ? "column" as const : "row" as const, gap: 12, margin: "0 20px 10px" }}>
          <div style={{ flex: 1 }}>
            <button onClick={() => setSigMethod(sigMethod === "here" ? "none" : "here")} style={{
              width: "100%", background: C.white, border: `1px solid ${sigMethod === "here" ? C.burg : C.bdr}`, borderRadius: 12, padding: 16,
              cursor: "pointer", textAlign: "left" as const,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>📱</span>
                <div>
                  <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text }}>Sign here on this phone</div>
                  <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 2 }}>If the worker is with you, sign directly below</div>
                </div>
              </div>
            </button>
          </div>

          {/* Option B */}
          <div style={{ flex: 1 }}>
            <button onClick={() => setSigMethod(sigMethod === "remote" ? "none" : "remote")} style={{
              width: "100%", background: C.white, border: `1px solid ${sigMethod === "remote" ? C.burg : C.bdr}`, borderRadius: 12, padding: 16,
              cursor: "pointer", textAlign: "left" as const, marginBottom: sigMethod === "remote" ? 10 : 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>📲</span>
                <div>
                  <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text }}>Sign on your own phone</div>
                  <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 2 }}>Worker will send you a notification to sign on your own device</div>
                </div>
              </div>
            </button>
            <AnimatePresence>
              {sigMethod === "remote" && (
                <motion.div key="remote" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {requestSent ? (
                    <div style={{ background: "rgba(30,102,64,0.08)", border: `1px solid ${C.green}`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                      <Check size={16} color={C.green} />
                      <span style={{ fontFamily: F.u, fontSize: 14, color: C.green }}>Signature request sent to your phone!</span>
                    </div>
                  ) : (
                    <button onClick={() => setRequestSent(true)} style={{ width: "100%", height: 48, border: `1px solid ${C.gold}`, background: "transparent", borderRadius: 999, fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.gold, cursor: "pointer" }}>
                      Send Signature Request
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          </div>

          {/* Signature Box (Option A) */}
          <AnimatePresence>
            {sigMethod === "here" && (
              <motion.div key="sigbox" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
                <div style={{ padding: "0 0 16px 0", margin: isMobile ? "0" : "0 auto", maxWidth: isMobile ? undefined : isTablet ? "100%" : 560, ...(isMobile ? {} : { paddingLeft: 20, paddingRight: 20 }) }}>
                  <SignatureCanvas onSigned={setHasSig} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Confirm Button */}
          <div style={{ margin: "0 20px" }}>
            <div style={{ background: C.cream, borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
              <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>By signing and confirming, you agree that you have received all the materials listed above. This record is permanent.</span>
            </div>
            <button
              onClick={handleConfirm}
              style={{
                width: "100%", height: 56, background: canConfirm ? C.green : "#C0C0C0",
                border: "none", borderRadius: 999, fontFamily: F.u, fontWeight: 600, fontSize: 16, color: "#FFF",
                cursor: canConfirm ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
              <Check size={20} /> Confirm Material Receipt
            </button>
          </div>
        </>
      ) : (
        /* Empty state */
        <div style={{ margin: 20 }}>
          <Card style={{ padding: 32, textAlign: "center" as const }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(30,102,64,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Check size={28} color={C.green} />
            </div>
            <div style={{ fontFamily: F.d, fontWeight: 600, fontSize: 20, color: C.text, marginBottom: 10 }}>No pending material receipt</div>
            <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 20 }}>All material receipts are confirmed. Nothing pending.</div>
            <button onClick={onGoToBatches} style={{ width: "100%", height: 48, background: C.burg, border: "none", borderRadius: 999, fontFamily: F.u, fontWeight: 600, fontSize: 14, color: "#FFF", cursor: "pointer" }}>Go to My Batches</button>
          </Card>
        </div>
      )}

      {/* Past Material Receipts */}
      <div style={{ marginTop: 20 }}>
        <button onClick={() => setHistoryOpen(v => !v)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <SectionTitle title="Past Material Receipts" />
          <ChevronRight size={18} color={C.muted} style={{ transform: historyOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
        </button>
        <AnimatePresence>
          {historyOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
              {signedRecords.length === 0 ? (
                <div style={{ margin: "0 20px 16px", background: C.cream, borderRadius: 12, padding: "18px 16px", textAlign: "center" as const }}>
                  <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>No confirmed material receipts yet.</div>
                </div>
              ) : isMobile ? (
                signedRecords.map(r => (
                  <div key={r.id} style={{ margin: "0 20px 12px", background: C.white, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: "14px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontFamily: F.m, fontWeight: 700, fontSize: 13, color: C.burg }}>{r.id}</span>
                      <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{new Date(r.issuedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                    </div>
                    <div style={{ fontFamily: F.u, fontSize: 13, color: C.text, marginBottom: 8, lineHeight: 1.5 }}>
                      {r.materials.map(m => `${m.materialType} ${m.quantity}${m.unit}`).join(" · ")}
                    </div>
                    {r.signatureTimestamp && (
                      <div style={{ fontFamily: F.u, fontSize: 12, color: C.green, display: "flex", alignItems: "center", gap: 5 }}>
                        <Check size={12} /> Confirmed by you on {new Date(r.signatureTimestamp).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ margin: "0 20px 16px", background: C.white, border: `1px solid ${C.bdr}`, borderRadius: 12, overflowX: isTablet ? "auto" : "hidden" }}>
                  <div style={{ minWidth: isTablet ? 560 : undefined }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr", padding: "10px 16px", borderBottom: `1px solid ${C.bdr}`, background: C.cream }}>
                      {["Date", "Materials", "MIR ID", "Status"].map(h => (
                        <div key={h} style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.muted }}>{h}</div>
                      ))}
                    </div>
                    {signedRecords.map(r => (
                      <div key={r.id} style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr", padding: "12px 16px", borderBottom: `1px solid rgba(107,26,42,0.06)`, alignItems: "center" }}>
                        <div style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>{new Date(r.issuedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
                        <div style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>{r.materials.map(m => `${m.materialType} ${m.quantity}${m.unit}`).join(" · ")}</div>
                        <div style={{ fontFamily: F.m, fontSize: 12, color: C.burg }}>{r.id}</div>
                        <div style={{ fontFamily: F.u, fontSize: 12, color: C.green, display: "flex", alignItems: "center", gap: 5 }}>
                          <Check size={12} /> Confirmed
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── PAGE 03 — YOUR DESIGNS ────────────────────────────────────────────────
function DesignsPage() {
  return (
    <div style={{ paddingBottom: 32 }}>
      <HeroHeader eyebrow="SINCE 1999 · DESIGN REFERENCE" title="Your Designs" sub="Design instructions assigned to your active batches" />
      <div style={{ marginTop: 8 }}>
        <DesignLibrarySection />
      </div>
    </div>
  );
}

// ─── PAGE 04 — RAISE WARP REQUEST ─────────────────────────────────────────
function WarpRequestPage() {
  const { isMobile, isTablet } = useResponsive();
  const [selectedBatch, setSelectedBatch] = useState<"086" | "089">("086");
  const [materials, setMaterials] = useState({ warp: false, resham: false, jari: false });
  const [amounts, setAmounts] = useState({ warp: "", resham: "", jari: "" });
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showForm, setShowForm] = useState(true);

  // BATCH-086 is 60% (above 50% = unlocked), BATCH-089 is 50% (unlocked)
  const batchProgress = selectedBatch === "086"
    ? { total: 5, done: 3, pct: 60, unlocked: true }
    : { total: 8, done: 4, pct: 50, unlocked: true };

  // Demo: BATCH-086 locked at 37.5% for demonstration; switch logic below
  const isLocked = selectedBatch === "086" ? false : false; // both unlocked per spec

  if (submitted) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center" as const }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(30,102,64,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <Check size={36} color={C.green} />
        </div>
        <div style={{ fontFamily: F.d, fontWeight: 600, fontSize: 20, color: C.text, marginBottom: 12 }}>Request Sent!</div>
        <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 28 }}>Your request has been sent to the worker staff, admin, and superadmin. You will be notified when a decision is made.</div>
        <button onClick={() => { setSubmitted(false); setMaterials({ warp: false, resham: false, jari: false }); setAmounts({ warp: "", resham: "", jari: "" }); setReason(""); }} style={{ width: "100%", height: 52, background: C.burg, border: "none", borderRadius: 999, fontFamily: F.u, fontWeight: 600, fontSize: 16, color: "#FFF", cursor: "pointer" }}>
          ← Back to Warp Requests
        </button>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 32 }}>
      <HeroHeader eyebrow="SINCE 1999 · WARP REQUEST" title="Raise Warp Request" sub="Request additional material" />

      {/* Batch Selector */}
      <div style={{ padding: "16px 20px 8px" }}>
        <div style={{ fontFamily: F.u, fontSize: 14, color: C.text, marginBottom: 10 }}>Which batch?</div>
        <div style={{ display: "flex", gap: 10 }}>
          {(["086", "089"] as const).map(b => (
            <button key={b} onClick={() => setSelectedBatch(b)} style={{
              padding: "8px 20px", borderRadius: 999, border: `1px solid ${C.burg}`,
              background: selectedBatch === b ? C.burg : "transparent",
              color: selectedBatch === b ? "#FFF" : C.burg,
              fontFamily: F.m, fontSize: 12, cursor: "pointer", fontWeight: 600,
            }}>BATCH-{b}</button>
          ))}
        </div>
      </div>

      {isLocked ? (
        /* STATE A — LOCKED */
        <>
          <div style={{ margin: "16px 20px" }}>
            <Card style={{ padding: 28, textAlign: "center" as const }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(139,26,46,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Shield size={32} color={C.burg} />
              </div>
              <div style={{ fontFamily: F.d, fontWeight: 600, fontSize: 20, color: C.text, marginBottom: 12 }}>Warp Request Locked</div>
              <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, lineHeight: 1.6, maxWidth: 300, margin: "0 auto 20px" }}>
                You can raise a warp request only after submitting 50% of your batch. This ensures enough progress before more material is given.
              </div>
              <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, marginBottom: 8 }}>Your current progress:</div>
              <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 24, color: C.text, marginBottom: 12 }}>3 of 8 sarees submitted</div>
              <ProgressBar pct={37.5} height={12} />
              <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, textAlign: "right" as const, marginTop: 4, marginBottom: 16 }}>37.5% complete</div>
              <div style={{ background: C.cream, borderRadius: 10, padding: "12px 16px", textAlign: "left" as const }}>
                <div style={{ fontFamily: F.u, fontSize: 13, color: C.text, lineHeight: 1.5, marginBottom: 8 }}>You need 1 more saree to unlock the warp request (50% = 4 sarees)</div>
                <ProgressBar pct={(37.5 / 50) * 100} height={6} />
              </div>
            </Card>
          </div>
          <div style={{ margin: "0 20px" }}>
            <button disabled style={{ width: "100%", height: 56, background: "#E0D5CC", border: "none", borderRadius: 999, fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.muted, cursor: "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Shield size={18} /> Warp Request — Locked
            </button>
          </div>
        </>
      ) : (
        /* STATE B — UNLOCKED */
        <>
          <div style={{ margin: "16px 20px", background: "rgba(30,102,64,0.10)", border: `1px solid ${C.green}`, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 10 }}>
            <Check size={18} color={C.green} style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.green, marginBottom: 4 }}>Warp Request Unlocked!</div>
              <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>You have submitted 50% of your batch. You can now request additional raw material.</div>
            </div>
          </div>

          {/* Progress */}
          <div style={{ margin: "0 20px 16px", textAlign: "center" as const }}>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 24, color: C.text, marginBottom: 10 }}>
              {batchProgress.done} of {batchProgress.total} sarees submitted
            </div>
            <ProgressBar pct={batchProgress.pct} height={12} />
            <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, textAlign: "right" as const, marginTop: 4 }}>{batchProgress.pct}% complete</div>
          </div>

          {/* Request Form */}
          <SectionTitle title="Request Materials" />
          <div style={{ margin: isMobile ? "0 20px 16px" : "0 auto 16px", maxWidth: isMobile ? undefined : isTablet ? "80%" : 560, padding: isMobile ? undefined : "0 20px" }}>
            <Card style={{ padding: 20 }}>
              {/* Batch Reference */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontFamily: F.u, fontWeight: 500, fontSize: 15, color: C.text, marginBottom: 8 }}>Batch Reference</div>
                <div style={{ display: "inline-block", background: "rgba(107,26,42,0.08)", color: C.burg, borderRadius: 999, padding: "6px 16px", fontFamily: F.m, fontSize: 14 }}>BATCH-{selectedBatch}</div>
              </div>

              {/* Material checkboxes */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontFamily: F.u, fontWeight: 500, fontSize: 15, color: C.text, marginBottom: 12 }}>What material do you need? *</div>
                {(["warp", "resham", "jari"] as const).map(mat => (
                  <label key={mat} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", cursor: "pointer", borderBottom: mat !== "jari" ? `1px solid ${C.bdr}` : "none" }}>
                    <div
                      onClick={() => setMaterials(m => ({ ...m, [mat]: !m[mat] }))}
                      style={{
                        width: 24, height: 24, borderRadius: 6, border: `2px solid ${materials[mat] ? C.burg : C.bdr}`,
                        background: materials[mat] ? C.burg : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer",
                      }}>
                      {materials[mat] && <Check size={14} color="#FFF" />}
                    </div>
                    <span style={{ fontFamily: F.u, fontWeight: 500, fontSize: 15, color: C.text }}>
                      {mat === "warp" ? "More Warp" : mat === "resham" ? "More Resham" : "More Jari"}
                    </span>
                  </label>
                ))}
              </div>

              {/* Amount fields per checked material */}
              {(["warp", "resham", "jari"] as const).filter(m => materials[m]).map(mat => (
                <div key={mat} style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontFamily: F.u, fontWeight: 500, fontSize: 15, color: C.text, marginBottom: 6 }}>
                    {mat === "warp" ? "Warp amount (kg):" : mat === "resham" ? "Resham amount (kg) and color:" : "Jari amount (reels):"}
                  </label>
                  <input
                    value={amounts[mat]} onChange={e => setAmounts(a => ({ ...a, [mat]: e.target.value }))}
                    placeholder={mat === "warp" ? "e.g. 3" : mat === "resham" ? "e.g. 500g Red" : "e.g. 4 reels"}
                    style={{ width: "100%", height: 56, background: C.inp, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: "0 16px", fontFamily: F.m, fontSize: 16, color: C.text, outline: "none", boxSizing: "border-box" as const }}
                  />
                </div>
              ))}

              {/* Reason */}
              <div style={{ marginBottom: 4 }}>
                <label style={{ display: "block", fontFamily: F.u, fontWeight: 500, fontSize: 15, color: C.text, marginBottom: 6 }}>Why do you need more material?</label>
                <textarea
                  value={reason} onChange={e => setReason(e.target.value)}
                  placeholder="Example: Extra sarees needed for a big order"
                  rows={3}
                  style={{ width: "100%", minHeight: 100, background: C.inp, border: `1px solid ${C.bdr}`, borderRadius: 14, padding: "12px 16px", fontFamily: F.u, fontSize: 15, color: C.text, outline: "none", resize: "none", boxSizing: "border-box" as const }}
                />
              </div>
            </Card>
          </div>

          <div style={{ margin: isMobile ? "0 20px" : "0 auto", maxWidth: isMobile ? undefined : isTablet ? "80%" : 560, padding: isMobile ? undefined : "0 20px", display: "flex", justifyContent: isMobile ? undefined : "flex-end" }}>
            <button
              onClick={() => (materials.warp || materials.resham || materials.jari) ? setSubmitted(true) : undefined}
              style={{ width: isMobile ? "100%" : 200, height: 56, background: C.burg, border: "none", borderRadius: 999, fontFamily: F.u, fontWeight: 600, fontSize: 15, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Send size={18} /> Send Warp Request
            </button>
          </div>
        </>
      )}

      {/* Previous Requests */}
      <SectionTitle title="Your Previous Requests" />
      {(() => {
        const PREV_REQUESTS = [
          { id: "WR-014-01", material: "3 kg Warp", batch: "BATCH-086", date: "10 Jun 2026", status: "✓ Approved", color: C.green, bg: "rgba(30,102,64,0.10)" },
          { id: "WR-014-02", material: "Resham Red 500g", batch: "BATCH-089", date: "05 Jun 2026", status: "✗ Rejected", color: C.crim, bg: "rgba(192,57,43,0.10)" },
          { id: "WR-014-03", material: "2 kg Warp", batch: "BATCH-086", date: "01 Jun 2026", status: "✓ Approved", color: C.green, bg: "rgba(30,102,64,0.10)" },
        ];
        if (isMobile) {
          return PREV_REQUESTS.map((r, i) => (
            <div key={i} style={{ margin: "0 20px 8px", background: C.white, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontFamily: F.m, fontSize: 11, color: C.muted }}>{r.date}</div>
                <div style={{ fontFamily: F.u, fontSize: 14, color: C.text, marginTop: 2 }}>{r.material}</div>
              </div>
              <StatusBadge label={r.status} color={r.color} bg={r.bg} />
            </div>
          ));
        }
        return (
          <div style={{ margin: "0 20px 8px", background: C.white, border: `1px solid ${C.bdr}`, borderRadius: 12, overflowX: isTablet ? "auto" : "hidden" }}>
            <div style={{ minWidth: isTablet ? 640 : undefined }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr 1fr 1fr 1fr", padding: "10px 16px", borderBottom: `1px solid ${C.bdr}`, background: C.cream }}>
                {["Request ID", "Material", "Batch", "Status", "Date"].map(h => (
                  <div key={h} style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.muted }}>{h}</div>
                ))}
              </div>
              {PREV_REQUESTS.map((r, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr 1fr 1fr 1fr", padding: "12px 16px", borderBottom: i < PREV_REQUESTS.length - 1 ? `1px solid rgba(107,26,42,0.06)` : "none", alignItems: "center" }}>
                  <div style={{ fontFamily: F.m, fontSize: 12, color: C.burg }}>{r.id}</div>
                  <div style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>{r.material}</div>
                  <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted }}>{r.batch}</div>
                  <div><StatusBadge label={r.status} color={r.color} bg={r.bg} /></div>
                  <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{r.date}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── PAGE 05 — PAYMENT LEDGER ─────────────────────────────────────────────
const CURRENT_WEAVER_ID = "WV-001";

// Static month data — charges/deductions are set per-production-cycle
const CURRENT_MONTH_LABEL = "May 2026";
const GROSS_CHARGES = 8100;
const TOTAL_DEDUCTIONS = 450;
const NET_AMOUNT = GROSS_CHARGES - TOTAL_DEDUCTIONS;

// Past months static meta (saree counts); payment details come from context
const PAST_MONTHS: { month: string; sarees: string; utrFallback: string; amtFallback: string }[] = [
  { month: "Apr 2026", sarees: "15 sarees", utrFallback: "UTR202604301122", amtFallback: "₹6,300" },
  { month: "Mar 2026", sarees: "12 sarees", utrFallback: "UTR202603281456", amtFallback: "₹5,040" },
  { month: "Feb 2026", sarees: "18 sarees", utrFallback: "UTR202602271234", amtFallback: "₹7,560" },
];

function PaymentLedgerPage() {
  const { isMobile } = useResponsive();
  const { getPaymentsForWeaver } = useWeaverPayments();
  const myPayments = getPaymentsForWeaver(CURRENT_WEAVER_ID);

  // Determine if the current month has a matched payment
  // A payment is "current month" if its paymentDate or uploadedAt references May/Jun 2026
  // (we treat any record NOT in the seed past-months UTRs as a current-month upload)
  const seedUtrs = new Set(PAST_MONTHS.map(p => p.utrFallback));
  const currentPayment = myPayments.find(p => !seedUtrs.has(p.utrNumber)) ?? null;

  const isPaid = currentPayment !== null;

  const fmtAmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <div style={{ paddingBottom: 32 }}>
      <HeroHeader eyebrow="SINCE 1999 · MY EARNINGS" title="My Payment Ledger" sub="Earnings, deductions, balance" />

      {/* This Month Summary */}
      <div style={{ margin: "16px 20px" }}>
        <Card style={{ padding: 22 }}>
          <div style={{ fontFamily: F.m, fontSize: 12.5, color: C.muted, textAlign: "center" as const, marginBottom: 16 }}>{CURRENT_MONTH_LABEL}</div>
          {[
            { label: "Sarees Produced:", value: "18 sarees · 17 passed QC", color: C.text, size: 18, fw: 600 },
            { label: "Gross Making Charges:", value: fmtAmt(GROSS_CHARGES), color: C.gold, size: 26, fw: 700 },
            { label: "Total Deductions:", value: fmtAmt(TOTAL_DEDUCTIONS), color: C.crim, size: 18, fw: 600 },
          ].map((row, i) => (
            <div key={i} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 14, paddingBottom: i < 2 ? 14 : 0, borderBottom: i < 2 ? `1px solid ${C.bdr}` : "none" }}>
              <span style={{ fontFamily: F.u, fontSize: 15, color: C.muted }}>{row.label}</span>
              <span style={{ fontFamily: F.d, fontWeight: row.fw, fontSize: row.size, color: row.color, textAlign: "right" as const }}>{row.value}</span>
            </div>
          ))}

          {/* Net amount + payment status */}
          <div style={{ borderTop: `1px solid ${C.bdr}`, paddingTop: 16, marginTop: 4, textAlign: "center" as const }}>
            <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 16, color: C.text, marginBottom: 10 }}>Net Amount to Be Paid:</div>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 38, color: C.green, marginBottom: 8 }}>{fmtAmt(NET_AMOUNT)}</div>
            <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, marginBottom: 16 }}>This is what you will receive this month</div>

            {isPaid ? (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(30,102,64,0.12)", color: C.green, borderRadius: 999, padding: "8px 18px", fontFamily: F.m, fontSize: 13, fontWeight: 600 }}>
                <Check size={15} color={C.green} />✓ Paid
              </div>
            ) : (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(196,146,58,0.15)", color: C.gold, borderRadius: 999, padding: "8px 18px", fontFamily: F.m, fontSize: 13 }}>
                <Clock size={14} color={C.gold} />⏳ Payment Pending — Expected by month end
              </div>
            )}
          </div>

          {/* Payment details — shown only when paid */}
          {isPaid && currentPayment && (
            <div style={{ marginTop: 18, background: "rgba(30,102,64,0.06)", border: `1px solid rgba(30,102,64,0.18)`, borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ fontFamily: F.m, fontSize: 11.5, color: C.green, letterSpacing: "1.5px", textTransform: "uppercase" as const, marginBottom: 12 }}>Payment Details</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px" }}>
                {[
                  { label: "Amount Credited", value: fmtAmt(currentPayment.amountPaid), mono: true },
                  { label: "Payment Date",    value: currentPayment.paymentDate,          mono: false },
                  { label: "UTR Number",      value: currentPayment.utrNumber,            mono: true },
                  { label: "Paid By",         value: currentPayment.firmName,             mono: false },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 4 }}>{f.label}</div>
                    <div style={{ fontFamily: f.mono ? F.m : F.u, fontSize: 14, fontWeight: 600, color: C.text, wordBreak: "break-all" as const }}>{f.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* This Month's Payout — highlight card (same info as desktop payout panel) */}
      <div style={{ margin: "0 20px 16px", background: `linear-gradient(135deg, ${C.dark} 0%, #4A061B 100%)`, borderRadius: 18, padding: "24px 22px", boxShadow: "0 6px 24px rgba(61,14,26,0.20)" }}>
        <div style={{ fontFamily: F.u, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)", letterSpacing: 1.2, textTransform: "uppercase" as const, marginBottom: 10 }}>This Month's Payout</div>
        <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 40, color: C.gold, lineHeight: 1, marginBottom: 8 }}>{fmtAmt(NET_AMOUNT)}</div>
        <div style={{ fontFamily: F.u, fontSize: 14, color: "rgba(255,255,255,0.60)", marginBottom: 16 }}>Net amount after deductions</div>
        <div style={{ display: "inline-block", background: "rgba(196,146,58,0.22)", border: `1px solid ${C.gold}`, borderRadius: 999, padding: "7px 16px", fontFamily: F.m, fontSize: 12.5, color: C.gold }}>
          Payment by end of June 2026
        </div>
      </div>

      {/* Deductions Breakdown */}
      <SectionTitle title="Deductions Applied This Month" />
      <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, margin: "-4px 20px 12px", lineHeight: 1.5 }}>These are the amounts deducted from your gross making charges.</div>

      <div style={{ margin: "0 20px 12px", background: C.white, border: `1px solid ${C.bdr}`, borderLeft: `3px solid ${C.crim}`, borderRadius: 14, padding: "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
          <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 15, color: C.crim }}>Defective Saree Deduction</span>
          <span style={{ fontFamily: F.m, fontWeight: 700, fontSize: 18, color: C.crim, flexShrink: 0 }}>₹450</span>
        </div>
        <div style={{ fontFamily: F.m, fontSize: 13, color: C.burg, marginBottom: 8 }}>PADMA-L1-004</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" as const }}>
          <span style={{ background: "rgba(192,57,43,0.10)", color: C.crim, borderRadius: 999, padding: "3px 12px", fontFamily: F.m, fontSize: 12 }}>Thread Break</span>
          <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>QC Date: 10 Jun 2026</span>
        </div>
        <div style={{ fontFamily: F.u, fontStyle: "italic", fontSize: 13, color: C.muted, lineHeight: 1.4 }}>Defect photo was sent to you via WhatsApp</div>
      </div>

      {/* Earning Trend — same 4-month data shown on desktop */}
      <SectionTitle title="Earning Trend" />
      <Card style={{ margin: "0 20px 12px", padding: "20px 20px" }}>
        {[
          { month: "Feb 2026", amt: 7560, pct: 95 },
          { month: "Mar 2026", amt: 5040, pct: 63 },
          { month: "Apr 2026", amt: 6300, pct: 79 },
          { month: "May 2026", amt: 7650, pct: 96 },
        ].map((e, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: i < 3 ? 16 : 0 }}>
            <span style={{ fontFamily: F.m, fontSize: 12.5, color: C.muted, width: 76, flexShrink: 0, whiteSpace: "nowrap" as const }}>{e.month}</span>
            <div style={{ flex: 1, height: 12, background: "rgba(107,26,42,0.08)", borderRadius: 999, overflow: "hidden" }}>
              <div style={{ width: `${e.pct}%`, height: "100%", background: C.gold, borderRadius: 999 }} />
            </div>
            <span style={{ fontFamily: F.m, fontSize: 14, fontWeight: 700, color: C.text, width: 52, textAlign: "right" as const, flexShrink: 0 }}>₹{(e.amt / 1000).toFixed(1)}k</span>
          </div>
        ))}
      </Card>

      {/* Past Months History */}
      <SectionTitle title="Payment History" link="See All →" />
      {isMobile ? (
        PAST_MONTHS.map((p, i) => {
          // Find matching payment record from context (seed data or future uploads)
          const rec = myPayments.find(r => r.utrNumber === p.utrFallback);
          return (
            <div key={i} style={{ margin: "0 20px 10px", background: C.white, border: `1px solid ${C.bdr}`, borderLeft: `3px solid ${C.green}`, borderRadius: 14, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 16, color: C.text }}>{p.month}</div>
                  <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, marginTop: 3 }}>{p.sarees}</div>
                </div>
                <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                  <div style={{ fontFamily: F.m, fontWeight: 700, fontSize: 17, color: C.gold }}>{rec ? fmtAmt(rec.amountPaid) : p.amtFallback}</div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 6, background: "rgba(30,102,64,0.10)", color: C.green, borderRadius: 999, padding: "4px 12px" }}>
                    <Check size={12} color={C.green} />
                    <span style={{ fontFamily: F.m, fontSize: 12, color: C.green, fontWeight: 600 }}>✓ Paid</span>
                  </div>
                </div>
              </div>

              {/* UTR + Firm row from context */}
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.bdr}`, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 14px" }}>
                <div>
                  <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 3 }}>UTR Number</div>
                  <div style={{ fontFamily: F.m, fontSize: 13, color: C.text }}>{rec?.utrNumber ?? p.utrFallback}</div>
                </div>
                <div>
                  <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 3 }}>Paid By</div>
                  <div style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>{rec?.firmName ?? "Beere Kesava & Brothers Silks"}</div>
                </div>
                {rec?.paymentDate && (
                  <div>
                    <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 3 }}>Payment Date</div>
                    <div style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>{rec.paymentDate}</div>
                  </div>
                )}
              </div>
            </div>
          );
        })
      ) : (
        <div style={{ margin: "0 20px 8px", background: C.white, border: `1px solid ${C.bdr}`, borderRadius: 12, overflowX: "auto" }}>
          <div style={{ minWidth: 640 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.4fr 1.2fr 1fr 0.8fr", padding: "10px 16px", borderBottom: `1px solid ${C.bdr}`, background: C.cream }}>
              {["Month", "Amount Paid", "UTR", "Firm", "Date", "Status"].map(h => (
                <div key={h} style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.muted }}>{h}</div>
              ))}
            </div>
            {PAST_MONTHS.map((p, i) => {
              const rec = myPayments.find(r => r.utrNumber === p.utrFallback);
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.4fr 1.2fr 1fr 0.8fr", padding: "12px 16px", borderBottom: i < PAST_MONTHS.length - 1 ? `1px solid rgba(107,26,42,0.06)` : "none", alignItems: "center" }}>
                  <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13, color: C.text }}>{p.month}</div>
                  <div style={{ fontFamily: F.m, fontWeight: 600, fontSize: 13, color: C.gold }}>{rec ? fmtAmt(rec.amountPaid) : p.amtFallback}</div>
                  <div style={{ fontFamily: F.m, fontSize: 12, color: C.text }}>{rec?.utrNumber ?? p.utrFallback}</div>
                  <div style={{ fontFamily: F.u, fontSize: 12, color: C.text }}>{rec?.firmName ?? "Beere Kesava & Brothers Silks"}</div>
                  <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{rec?.paymentDate ?? "—"}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(30,102,64,0.10)", color: C.green, borderRadius: 999, padding: "2px 10px", width: "fit-content" }}>
                    <Check size={10} color={C.green} />
                    <span style={{ fontFamily: F.m, fontSize: 10, fontWeight: 600 }}>Paid</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment Schedule — same info as desktop's schedule card */}
      <div style={{ margin: "12px 20px 0", background: "#F0FFF4", border: `1px solid rgba(30,102,64,0.22)`, borderRadius: 16, padding: "18px 20px" }}>
        <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 15, color: C.green, marginBottom: 8 }}>Payment Schedule</div>
        <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, lineHeight: 1.6 }}>Payments are processed at month end. You'll receive a WhatsApp message and in-app notification when your payment is credited.</div>
      </div>
    </div>
  );
}

// ─── PAGE 06 — NOTIFICATIONS (admin-dashboard style) ──────────────────────
const WN_T = {
  silkCream:     "#F7F2EA",
  warmIvory:     "#FFFDF9",
  royalBurgundy: "#6E0F2D",
  deepWine:      "#4A061B",
  antiqueGold:   "#C89B47",
  goldLight:     "#E7C983",
  luxuryBrown:   "#3B2314",
  taupe:         "#8B7060",
  warmCream:     "#F5E8D0",
  green:         "#1E6640",
  borderDef:     "rgba(110,15,45,0.10)",
};
const WN_G = {
  card:   "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)",
  button: "linear-gradient(135deg, #6E0F2D 0%, #4A061B 100%)",
  gold:   "linear-gradient(135deg, #C89B47 0%, #E7C983 100%)",
};
const WN_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const WN_NUM: React.CSSProperties = { fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum" 1, "lnum" 1' };

type WNPriority = "critical" | "warning" | "info" | "success";
type WNCategory = "batch" | "payment" | "warp";

interface WeaverNotif {
  id: number; priority: WNPriority; category: WNCategory;
  title: string; body: string; time: string; date: string; read: boolean; action?: string;
}

const WN_DATA: WeaverNotif[] = [
  { id: 1, priority: "info",     category: "batch",   title: "New batch assigned — BATCH-086",         body: "Your new batch BATCH-086 has been officially assigned to you. Materials have been issued and are now waiting for your confirmation. Please visit the Confirm page to sign and open your batch.",                       time: "9:00 AM",  date: "Today",     read: false, action: "Confirm Receipt" },
  { id: 2, priority: "info",     category: "batch",   title: "Materials issued — confirm to proceed",   body: "All materials for BATCH-086 have been issued by worker staff — Warp 4.5 kg, Resham Red 800g, Jari 8 Reels. Please confirm receipt by signing. Once confirmed, your batch will be officially opened.",              time: "9:05 AM",  date: "Today",     read: false, action: "Sign & Confirm" },
  { id: 3, priority: "critical", category: "batch",   title: "Defect found — Saree PADMA-L1-004",      body: "Saree PADMA-L1-004 from BATCH-086 has failed quality check inspection. Defect type: Thread break on the border section. A ₹450 deduction will be applied this month. Defect photo has been sent to your WhatsApp.", time: "11:30 AM", date: "10 Jun",    read: false, action: "View Defect" },
  { id: 4, priority: "warning",  category: "batch",   title: "Weight deduction applied — BATCH-072",   body: "A weight deduction of ₹280 has been applied to BATCH-072. Recorded saree weight was 780g against the standard of 850g. This deduction has been recorded in your May 2026 payment ledger.",                          time: "2:15 PM",  date: "05 Jun",    read: true  },
  { id: 5, priority: "success",  category: "payment", title: "Payment credited — ₹6,300",               body: "April 2026 making charges of ₹6,300 have been successfully credited to your bank account. UTR Reference: UTR202604301122. If you have not received the amount, please contact the office.",                        time: "9:02 AM",  date: "01 May",    read: true  },
  { id: 6, priority: "info",     category: "payment", title: "Payment processing — ₹7,650 for May",    body: "Your May 2026 making charges of ₹7,650 (gross ₹8,100 minus ₹450 deductions) are currently being processed. Payment will be credited to your account by end of June 2026.",                                          time: "10:00 AM", date: "25 May",    read: true  },
  { id: 7, priority: "success",  category: "warp",    title: "Warp request approved — BATCH-089",      body: "Your warp request for 3 kg Warp for BATCH-089 has been reviewed and approved by the supervisor. The material will be issued to you by the worker staff within the next 1–2 working days.",                             time: "12:00 PM", date: "10 Jun",    read: true  },
  { id: 8, priority: "warning",  category: "warp",    title: "Warp request rejected — BATCH-086",      body: "Your request for Resham Red 500g for BATCH-086 has been rejected. Reason: Sufficient stock is available from your original issue. If you need clarification, please contact your supervisor directly.",              time: "3:30 PM",  date: "05 Jun",    read: true  },
];

const WN_PRIORITY: Record<WNPriority, { color: string; bg: string; border: string; Icon: React.ElementType; label: string }> = {
  critical: { color: "#B91C1C", bg: "rgba(185,28,28,0.08)", border: "rgba(185,28,28,0.20)", Icon: AlertTriangle, label: "Critical" },
  warning:  { color: "#B45309", bg: "rgba(180,83,9,0.08)",  border: "rgba(180,83,9,0.20)",  Icon: AlertCircle,   label: "Warning"  },
  info:     { color: "#1D4ED8", bg: "rgba(29,78,216,0.07)", border: "rgba(29,78,216,0.18)", Icon: Info,          label: "Info"     },
  success:  { color: "#1E6640", bg: "rgba(30,102,64,0.07)", border: "rgba(30,102,64,0.18)", Icon: CheckCircle2,  label: "Success"  },
};

const WN_CATEGORY: Record<WNCategory, { Icon: React.ElementType; label: string; color: string }> = {
  batch:   { Icon: Package,      label: "Batch & Materials", color: "#6E0F2D" },
  payment: { Icon: Wallet,       label: "Payment",           color: "#1D4ED8" },
  warp:    { Icon: ArrowUpRight, label: "Warp Request",      color: "#7B3F00" },
};

type WNFilter = "all" | WNPriority;
const WN_FILTERS: { key: WNFilter; label: string }[] = [
  { key: "all",      label: "All"      },
  { key: "critical", label: "Critical" },
  { key: "warning",  label: "Warning"  },
  { key: "success",  label: "Success"  },
  { key: "info",     label: "Info"     },
];

function WNFadeUp({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 32, scale: 0.98 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : undefined}
      transition={{ type: "spring", stiffness: 260, damping: 26, delay, opacity: { duration: 0.45 } }}
      style={style}>
      {children}
    </motion.div>
  );
}

function NotificationsPage() {
  const { isMobile, isTablet } = useResponsive();
  const [filter, setFilter]     = useState<WNFilter>("all");
  const [selected, setSelected] = useState<WeaverNotif | null>(null);
  const [readIds, setReadIds]   = useState<Set<number>>(new Set(WN_DATA.filter(n => n.read).map(n => n.id)));

  const markRead    = (id: number) => setReadIds(prev => new Set([...prev, id]));
  const markAllRead = () => setReadIds(new Set(WN_DATA.map(n => n.id)));

  const filtered = filter === "all" ? WN_DATA : WN_DATA.filter(n => n.priority === filter);
  const unread   = WN_DATA.filter(n => !readIds.has(n.id)).length;

  const grouped: Record<string, WeaverNotif[]> = {};
  filtered.forEach(n => { if (!grouped[n.date]) grouped[n.date] = []; grouped[n.date].push(n); });

  const countByPriority = (p: WNPriority) => WN_DATA.filter(n => n.priority === p).length;

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", background: WN_T.silkCream, fontFamily: F.u }}>

      {/* ── HERO ── */}
      <section style={{ background: WN_G.card, padding: isMobile ? "24px 20px 0" : isTablet ? "36px 28px 0" : "56px 56px 0", position: "relative", overflow: "hidden", minHeight: 220 }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(200,155,71,0.025) 60px, rgba(200,155,71,0.025) 61px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 80px, rgba(200,155,71,0.012) 80px, rgba(200,155,71,0.012) 81px)", pointerEvents: "none" }} />
        <div className="gold-bar-shimmer" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2 }} />

        <div style={{ position: "relative", zIndex: 2 }}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: WN_EASE }}
            style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{ width: 20, height: 1, background: WN_T.antiqueGold, opacity: 0.6 }} />
            <span style={{ fontFamily: F.m, fontWeight: 600, fontSize: 9.5, color: "rgba(200,155,71,0.80)", letterSpacing: "3px", textTransform: "uppercase" as const }}>
              Ravi Kumar · WVR-014 · Notifications
            </span>
          </motion.div>

          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 20 }}>
            <div>
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: WN_EASE }}
                style={{ fontFamily: F.d, fontWeight: 400, fontSize: "clamp(32px, 3.5vw, 52px)", color: WN_T.warmCream, margin: 0, lineHeight: 1.1, letterSpacing: "-0.5px" }}>
                Notifications
                {unread > 0 && (
                  <span style={{ marginLeft: 16, display: "inline-flex", alignItems: "center", justifyContent: "center", background: WN_T.antiqueGold, color: WN_T.deepWine, fontFamily: F.m, fontWeight: 700, fontSize: 14, borderRadius: 999, padding: "4px 14px", verticalAlign: "middle", position: "relative", top: -4 }}>
                    {unread} new
                  </span>
                )}
              </motion.h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.25 }}
                style={{ fontFamily: F.u, fontWeight: 400, fontSize: 14, color: "rgba(245,232,208,0.72)", margin: "10px 0 0" }}>
                All updates about your batches, materials, warp requests, and payments.
              </motion.p>
            </div>
            {unread > 0 && (
              <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
                onClick={markAllRead}
                whileHover={{ scale: 1.04, backgroundColor: "rgba(200,155,71,0.18)" }}
                whileTap={{ scale: 0.97 }}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 22px", borderRadius: 12, border: "1px solid rgba(200,155,71,0.30)", background: "rgba(200,155,71,0.09)", color: WN_T.antiqueGold, fontFamily: F.u, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                <Check size={15} /> Mark all read
              </motion.button>
            )}
          </div>

          {/* Metrics row */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.35, ease: WN_EASE }}
            style={{ display: "flex", flexWrap: isMobile ? "wrap" as const : "nowrap" as const, gap: 0, marginTop: isMobile ? 20 : 40, borderTop: "1px solid rgba(245,232,208,0.08)" }}>
            {[
              { label: "Total",    val: WN_DATA.length,                                       Icon: Bell,          hi: false },
              { label: "Unread",   val: unread,                                               Icon: Inbox,         hi: unread > 0 },
              { label: "Critical", val: countByPriority("critical"),                          Icon: AlertTriangle, hi: false, col: "#FCA5A5" },
              { label: "Today",    val: WN_DATA.filter(n => n.date === "Today").length,       Icon: Zap,           hi: false },
              { label: "Resolved", val: readIds.size,                                         Icon: CheckCircle2,  hi: false, col: "#6EE7B7" },
            ].map((m, i) => (
              <div key={m.label} style={{ width: isMobile ? "calc(50% - 1px)" : undefined, flex: isMobile ? undefined : 1, padding: isMobile ? "14px 12px" : "20px 22px", borderRight: isMobile ? (i % 2 === 0 ? "1px solid rgba(245,232,208,0.07)" : "none") : (i < 4 ? "1px solid rgba(245,232,208,0.07)" : "none"), borderTop: isMobile && i >= 2 ? "1px solid rgba(245,232,208,0.07)" : "none", display: "flex", alignItems: "center", gap: isMobile ? 10 : 14, boxSizing: "border-box" as const }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: m.hi ? "rgba(200,155,71,0.18)" : "rgba(245,232,208,0.07)", border: `1px solid ${m.hi ? "rgba(200,155,71,0.35)" : "rgba(245,232,208,0.09)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <m.Icon size={18} color={m.hi ? WN_T.antiqueGold : (m.col || "rgba(245,232,208,0.70)")} />
                </div>
                <div>
                  <div style={{ fontFamily: F.m, fontWeight: 600, fontSize: 9, letterSpacing: "2px", textTransform: "uppercase" as const, color: m.hi ? "rgba(200,155,71,0.90)" : "rgba(245,232,208,0.55)", marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontFamily: F.d, fontWeight: 400, fontSize: 34, color: m.hi ? WN_T.goldLight : (m.col || WN_T.warmCream), lineHeight: 1, ...WN_NUM }}>{m.val}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FILTER BAR ── */}
      <div style={{ background: WN_T.warmIvory, borderBottom: `1px solid ${WN_T.borderDef}`, padding: isMobile ? "0 12px" : isTablet ? "0 28px" : "0 56px", position: "sticky" as const, top: 64, zIndex: 50, boxShadow: "0 4px 24px rgba(74,6,27,0.05)" }}>
        <div className="wp-filter-scroll" style={{ display: "flex", alignItems: "center", gap: 0, height: 58, overflowX: isMobile ? "auto" : "visible", scrollbarWidth: "none" } as React.CSSProperties}>
          {WN_FILTERS.map(f => {
            const isActive = filter === f.key;
            const count = f.key === "all" ? WN_DATA.length : WN_DATA.filter(n => n.priority === f.key).length;
            const cfg = f.key !== "all" ? WN_PRIORITY[f.key] : null;
            return (
              <button key={f.key} onClick={() => setFilter(f.key)}
                style={{ height: "100%", padding: isMobile ? "0 14px" : "0 22px", border: "none", background: "rgba(0,0,0,0)", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, position: "relative" as const, borderBottom: isActive ? `2px solid ${WN_T.royalBurgundy}` : "2px solid transparent", flexShrink: 0, whiteSpace: "nowrap" as const }}>
                {cfg && <cfg.Icon size={14} color={isActive ? WN_T.royalBurgundy : cfg.color} />}
                <span style={{ fontFamily: F.u, fontWeight: isActive ? 600 : 400, fontSize: 13.5, color: isActive ? WN_T.royalBurgundy : WN_T.taupe, whiteSpace: "nowrap" as const }}>{f.label}</span>
                <span style={{ fontFamily: F.m, fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 999, background: isActive ? "rgba(110,15,45,0.08)" : "rgba(139,112,96,0.08)", color: isActive ? WN_T.royalBurgundy : WN_T.taupe }}>{count}</span>
              </button>
            );
          })}
          {!isMobile && (
            <div style={{ marginLeft: "auto", flexShrink: 0 }}>
              <span style={{ fontFamily: F.u, fontSize: 12, color: WN_T.taupe }}>{filtered.length} notification{filtered.length !== 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{
        padding: isMobile ? "20px 16px 48px" : isTablet ? "28px 28px 60px" : "40px 56px 80px",
        display: "flex", flexDirection: isMobile || isTablet ? "column" as const : "row" as const,
        gap: isMobile ? 16 : 28, alignItems: "flex-start",
      }}>

        {/* Left — list */}
        <div style={{ flex: (!isMobile && !isTablet && selected) ? "0 0 520px" : 1, minWidth: 0, width: "100%" }}>
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date} style={{ marginBottom: 40 }}>
              <WNFadeUp>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 3, height: 18, borderRadius: 2, background: WN_G.gold, flexShrink: 0 }} />
                  <span style={{ fontFamily: F.d, fontWeight: 400, fontSize: 22, color: WN_T.luxuryBrown, letterSpacing: "-0.2px" }}>{date}</span>
                  <div style={{ flex: 1, height: 1, background: WN_T.borderDef, marginLeft: 4 }} />
                  <span style={{ fontFamily: F.m, fontSize: 10, color: WN_T.taupe }}>{items.length} item{items.length !== 1 ? "s" : ""}</span>
                </div>
              </WNFadeUp>

              <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
                {items.map((n, i) => {
                  const pcfg   = WN_PRIORITY[n.priority];
                  const catCfg = WN_CATEGORY[n.category];
                  const isRead     = readIds.has(n.id);
                  const isSelected = selected?.id === n.id;
                  const PIcon = pcfg.Icon;
                  const CIcon = catCfg.Icon;
                  return (
                    <WNFadeUp key={n.id} delay={i * 0.05}>
                      <motion.div
                        onClick={() => { setSelected(isSelected ? null : n); markRead(n.id); }}
                        whileHover={{ y: -3, boxShadow: isSelected ? "0 12px 40px rgba(110,15,45,0.14)" : "0 8px 32px rgba(110,15,45,0.10)" }}
                        transition={{ type: "spring", stiffness: 300, damping: 24 }}
                        style={{ background: isSelected ? "#FFFDF9" : WN_T.warmIvory, borderRadius: 20, border: isSelected ? `1.5px solid ${WN_T.royalBurgundy}` : `1px solid ${isRead ? WN_T.borderDef : pcfg.border}`, boxShadow: isSelected ? "0 12px 40px rgba(110,15,45,0.12)" : "0 2px 14px rgba(110,15,45,0.05)", cursor: "pointer", overflow: "hidden", position: "relative" as const }}>
                        {/* Priority top bar */}
                        <div style={{ height: 3, background: `linear-gradient(90deg, ${pcfg.color}, ${pcfg.color}88)`, opacity: isRead ? 0.4 : 1 }} />

                        <div style={{ padding: "22px 24px" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 18 }}>
                            {/* Icon block */}
                            <div style={{ width: 52, height: 52, borderRadius: 16, flexShrink: 0, background: pcfg.bg, border: `1px solid ${pcfg.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <PIcon size={22} color={pcfg.color} />
                            </div>

                            {/* Main content */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" as const }}>
                                {!isRead && <div style={{ width: 8, height: 8, borderRadius: "50%", background: pcfg.color, flexShrink: 0 }} />}
                                <span style={{ fontFamily: F.d, fontWeight: 400, fontSize: 17, color: WN_T.luxuryBrown, lineHeight: 1.3, flex: 1, opacity: isRead ? 0.8 : 1 }}>{n.title}</span>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: F.m, fontSize: 10, fontWeight: 600, color: pcfg.color, background: pcfg.bg, border: `1px solid ${pcfg.border}`, borderRadius: 999, padding: "3px 10px", flexShrink: 0 }}>
                                  <PIcon size={10} /> {pcfg.label}
                                </span>
                              </div>
                              <p style={{ fontFamily: F.u, fontWeight: 400, fontSize: 13.5, color: WN_T.taupe, lineHeight: 1.75, margin: "0 0 14px", display: selected ? "block" : "-webkit-box" as any, WebkitLineClamp: selected ? undefined : 2, WebkitBoxOrient: "vertical" as any, overflow: selected ? "visible" : "hidden" }}>
                                {n.body}
                              </p>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const }}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: F.m, fontSize: 10, fontWeight: 500, color: catCfg.color, background: `${catCfg.color}14`, border: `1px solid ${catCfg.color}2A`, borderRadius: 999, padding: "3px 10px" }}>
                                  <CIcon size={10} /> {catCfg.label}
                                </span>
                                <span style={{ fontFamily: F.m, fontSize: 11, color: WN_T.taupe }}>{n.date} · {n.time}</span>
                                {n.action && (
                                  <motion.button
                                    onClick={e => { e.stopPropagation(); markRead(n.id); }}
                                    whileHover={{ scale: 1.05, backgroundColor: WN_T.royalBurgundy, color: "#FFFDF9" }}
                                    whileTap={{ scale: 0.97 }}
                                    style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 16px", borderRadius: 10, border: `1.5px solid ${WN_T.royalBurgundy}`, background: "rgba(0,0,0,0)", color: WN_T.royalBurgundy, fontFamily: F.u, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" as const }}>
                                    {n.action} <ArrowRight size={12} />
                                  </motion.button>
                                )}
                              </div>
                            </div>

                            {/* Read/unread toggle */}
                            <motion.button
                              onClick={e => { e.stopPropagation(); isRead ? setReadIds(prev => { const s = new Set(prev); s.delete(n.id); return s; }) : markRead(n.id); }}
                              whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.93 }}
                              title={isRead ? "Mark unread" : "Mark read"}
                              style={{ width: 30, height: 30, borderRadius: "50%", border: `1.5px solid ${isRead ? WN_T.borderDef : pcfg.color}`, background: isRead ? "rgba(0,0,0,0)" : pcfg.bg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, marginTop: 2 }}>
                              <Check size={13} color={isRead ? WN_T.taupe : pcfg.color} />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    </WNFadeUp>
                  );
                })}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div style={{ textAlign: "center" as const, padding: "80px 40px" }}>
              <div style={{ width: 72, height: 72, borderRadius: 22, background: "rgba(110,15,45,0.06)", border: `1px solid ${WN_T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <Inbox size={28} color={WN_T.taupe} />
              </div>
              <div style={{ fontFamily: F.d, fontWeight: 400, fontSize: 22, color: WN_T.luxuryBrown, marginBottom: 8 }}>No notifications</div>
              <div style={{ fontFamily: F.u, fontSize: 14, color: WN_T.taupe }}>No notifications match the current filter.</div>
            </div>
          )}
        </div>

        {/* Right — detail panel */}
        <AnimatePresence>
          {selected && (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, x: 32, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 32, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              style={(isMobile || isTablet)
                ? { width: "100%" }
                : { flex: "0 0 380px", position: "sticky" as const, top: 122 }}>
              {(() => {
                const pcfg   = WN_PRIORITY[selected.priority];
                const catCfg = WN_CATEGORY[selected.category];
                const PIcon = pcfg.Icon;
                const CIcon = catCfg.Icon;
                return (
                  <div style={{ background: WN_T.warmIvory, borderRadius: 24, border: `1px solid ${WN_T.borderDef}`, boxShadow: "0 16px 56px rgba(110,15,45,0.10)", overflow: "hidden" }}>
                    <div style={{ height: 4, background: `linear-gradient(90deg, ${pcfg.color}, ${pcfg.color}55)` }} />
                    <div style={{ padding: "20px 24px", borderBottom: `1px solid ${WN_T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: F.m, fontSize: 11, fontWeight: 600, color: pcfg.color, background: pcfg.bg, border: `1px solid ${pcfg.border}`, borderRadius: 999, padding: "4px 12px" }}>
                        <PIcon size={12} /> {pcfg.label}
                      </span>
                      <motion.button onClick={() => setSelected(null)} whileHover={{ scale: 1.1, backgroundColor: "rgba(110,15,45,0.06)" }} whileTap={{ scale: 0.93 }}
                        style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${WN_T.borderDef}`, background: "rgba(0,0,0,0)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <X size={14} color={WN_T.taupe} />
                      </motion.button>
                    </div>
                    <div style={{ padding: "24px 24px 28px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                        <div style={{ width: 56, height: 56, borderRadius: 18, background: catCfg.color + "14", border: `1px solid ${catCfg.color}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <CIcon size={24} color={catCfg.color} />
                        </div>
                        <div>
                          <div style={{ fontFamily: F.m, fontSize: 9.5, fontWeight: 600, letterSpacing: "2px", color: catCfg.color, textTransform: "uppercase" as const, marginBottom: 4 }}>{catCfg.label}</div>
                          <div style={{ fontFamily: F.u, fontSize: 11, color: WN_T.taupe }}>{selected.date} · {selected.time}</div>
                        </div>
                      </div>
                      <div style={{ fontFamily: F.d, fontWeight: 400, fontSize: 20, color: WN_T.luxuryBrown, lineHeight: 1.35, marginBottom: 16, letterSpacing: "-0.2px" }}>{selected.title}</div>
                      <div style={{ background: WN_T.silkCream, borderRadius: 14, border: `1px solid ${WN_T.borderDef}`, padding: "18px 20px", marginBottom: 20 }}>
                        <p style={{ fontFamily: F.u, fontWeight: 400, fontSize: 14, color: WN_T.luxuryBrown, lineHeight: 1.85, margin: 0 }}>{selected.body}</p>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
                        {[
                          { label: "Priority", value: pcfg.label,     color: pcfg.color },
                          { label: "Category", value: catCfg.label,   color: catCfg.color },
                          { label: "Date",     value: selected.date,  color: WN_T.luxuryBrown },
                          { label: "Time",     value: selected.time,  color: WN_T.luxuryBrown },
                        ].map(({ label, value, color }) => (
                          <div key={label} style={{ background: WN_T.warmIvory, border: `1px solid ${WN_T.borderDef}`, borderRadius: 12, padding: "12px 14px" }}>
                            <div style={{ fontFamily: F.m, fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase" as const, color: WN_T.taupe, marginBottom: 5 }}>{label}</div>
                            <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color }}>{value}</div>
                          </div>
                        ))}
                      </div>
                      {selected.action && (
                        <motion.button
                          whileHover={{ scale: 1.02, boxShadow: "0 8px 28px rgba(110,15,45,0.28)" }}
                          whileTap={{ scale: 0.98 }}
                          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "14px", borderRadius: 14, border: "none", background: WN_G.button, color: "#FFFDF9", fontFamily: F.u, fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(110,15,45,0.22)", marginBottom: 10 }}>
                          {selected.action} <ArrowRight size={15} />
                        </motion.button>
                      )}
                      <motion.button onClick={() => markRead(selected.id)}
                        whileHover={{ scale: 1.02, backgroundColor: "rgba(110,15,45,0.06)" }}
                        whileTap={{ scale: 0.98 }}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "12px", borderRadius: 14, border: `1px solid ${WN_T.borderDef}`, background: "rgba(0,0,0,0)", color: WN_T.taupe, fontFamily: F.u, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                        <Check size={14} /> Mark as read
                      </motion.button>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── MOBILE SHELL ──────────────────────────────────────────────────────────
type Tab5 = "batches" | "confirm" | "designs" | "warp" | "payments";

function MobileWeaverPortal({ onBack }: { onBack?: () => void }) {
  const [active, setActive] = useState<Tab5>("batches");
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const { getRecordsForWeaver } = useMaterialIssue();
  const pendingConfirmCount = getRecordsForWeaver(CURRENT_WEAVER_ID).filter(r => r.status === "pending-signature").length;

  const TABS: { id: Tab5; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "batches",   label: "My Batches", icon: <ClipboardList size={20} />, },
    { id: "confirm",   label: "Confirm",    icon: <CheckSquare size={20} />, badge: pendingConfirmCount },
    { id: "designs",   label: "Designs",    icon: <Palette size={20} /> },
    { id: "warp",      label: "Warp",       icon: <ArrowUpRight size={20} /> },
    { id: "payments",  label: "Payments",   icon: <Wallet size={20} /> },
  ];

  const PAGE_TITLES: Record<Tab5, string> = {
    batches: "My Batches", confirm: "Confirm", designs: "Designs",
    warp: "Warp Request", payments: "Payments",
  };

  return (
    <div style={{ width: "100%", maxWidth: "100%", margin: "0 auto", minHeight: "100vh", background: "#FAFAFA", display: "flex", flexDirection: "column", position: "relative" as const }}>
      {/* Global Header */}
      <div style={{ height: 60, background: C.burg, display: "flex", alignItems: "center", padding: "0 16px", flexShrink: 0, position: "sticky" as const, top: 0, zIndex: 100, boxShadow: "0 2px 12px rgba(107,26,42,0.30)" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, width: 32, display: "flex", alignItems: "center" }}>
          <Flower2 size={24} color="rgba(255,255,255,0.90)" />
        </button>
        <div style={{ flex: 1, textAlign: "center" as const, fontFamily: F.d, fontWeight: 600, fontSize: 18, color: "#FFF" }}>
          {showNotifs ? "Notifications" : PAGE_TITLES[active]}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={() => { setShowNotifs(v => !v); setShowProfile(false); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, position: "relative" as const, width: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bell size={21} color="rgba(255,255,255,0.90)" />
            <span style={{ position: "absolute" as const, top: 2, right: 4, width: 8, height: 8, background: "#FF3B30", borderRadius: "50%" }} />
          </button>
          <div style={{ position: "relative" as const }}>
            <button onClick={() => { setShowProfile(v => !v); setShowNotifs(false); }} style={{ width: 30, height: 30, borderRadius: 9, border: "1px solid rgba(255,255,255,0.30)", background: "rgba(255,255,255,0.12)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 11, color: "#FFF" }}>RK</span>
            </button>
            {showProfile && (
              <div style={{ position: "absolute" as const, top: "calc(100% + 8px)", right: 0, zIndex: 300, background: "#FFFDF9", borderRadius: 14, border: `1px solid ${C.bdr}`, boxShadow: "0 8px 32px rgba(44,24,16,0.18)", minWidth: 200, overflow: "hidden" }}>
                <div style={{ padding: "14px 16px", background: "rgba(107,26,42,0.04)", borderBottom: `1px solid ${C.bdr}` }}>
                  <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.text }}>Ravi Kumar</div>
                  <div style={{ fontFamily: F.m, fontSize: 10.5, color: C.muted, marginTop: 2 }}>WVR-014 · Handloom Weaver</div>
                </div>
                <div style={{ padding: "6px 0" }}>
                  <button onClick={() => setShowProfile(false)} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "10px 16px", border: "none", background: "none", cursor: "pointer", fontFamily: F.u, fontSize: 13, color: C.text, textAlign: "left" as const }}>
                    <UserRound size={14} color={C.muted} /> View Profile
                  </button>
                  <button onClick={() => { setShowProfile(false); onBack?.(); }} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "10px 16px", border: "none", background: "none", cursor: "pointer", fontFamily: F.u, fontSize: 13, color: C.text, textAlign: "left" as const }}>
                    <ChevronLeft size={14} color={C.muted} /> Switch Portal
                  </button>
                  <button onClick={() => { setShowProfile(false); onBack?.(); }} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "10px 16px", border: "none", background: "none", cursor: "pointer", fontFamily: F.u, fontSize: 13, color: "#C0392B", textAlign: "left" as const }}>
                    <LogOut size={14} color="#C0392B" /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto" as const, paddingBottom: 68 }}>
        <AnimatePresence mode="wait">
          {showNotifs ? (
            <motion.div key="notifs" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <NotificationsPage />
            </motion.div>
          ) : (
            <motion.div key={active} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              {active === "batches" && (<MyBatchesPage />)}
              {active === "confirm" && (<ConfirmMaterialPage onGoToBatches={() => setActive("batches")} />)}
              {active === "designs" && (<DesignsPage />)}
              {active === "warp"    && (<WarpRequestPage />)}
              {active === "payments" && (<PaymentLedgerPage />)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Tab Bar */}
      {!showNotifs && (
        <div style={{ position: "fixed" as const, bottom: 0, left: 0, width: "100%", height: 66, background: "#FFF", borderTop: `1px solid ${C.bdr}`, display: "flex", zIndex: 100, boxShadow: "0 -4px 20px rgba(107,26,42,0.08)" }}>
          {TABS.map(tab => {
            const isActive = active === tab.id;
            return (
              <button key={tab.id} onClick={() => { setActive(tab.id); setShowNotifs(false); }} style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                background: "none", border: "none", cursor: "pointer", padding: 0,
                position: "relative" as const,
              }}>
                <div style={{ position: "relative" as const, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", gap: 4 }}>
                  {isActive && (
                    <motion.div layoutId="weaver-tab-indicator" transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      style={{ position: "absolute" as const, top: -9, left: "50%", marginLeft: -13, width: 26, height: 3, borderRadius: 4, background: C.burg }} />
                  )}
                  {!!tab.badge && (
                    <span style={{ position: "absolute" as const, top: -3, right: -7, minWidth: 16, height: 16, background: C.crim, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#FFF", fontFamily: F.u, padding: "0 3px" }}>
                      {tab.badge}
                    </span>
                  )}
                  {React.cloneElement(tab.icon as React.ReactElement, { color: isActive ? C.burg : C.muted })}
                  <span style={{ fontFamily: F.u, fontSize: 10.5, fontWeight: isActive ? 600 : 500, color: isActive ? C.burg : C.muted, transition: "color 0.2s" }}>{tab.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── BATCH DATA & CARD (AllWeavers-style) ─────────────────────────────────
interface WeaverBatch {
  id: string; design: string; name: string; status: "active" | "completed" | "qc";
  done: number; total: number; pct: number; passRate: number;
  amount: string | null; month: string;
  gradient: string; accentColor: string;
}

const BATCH_LIST: WeaverBatch[] = [
  { id: "BATCH-086", design: "BKB-045", name: "Cream Zari Border Saree",  status: "active",    done: 3, total: 5,  pct: 60,  passRate: 97,  amount: null,     month: "Jun 2026", gradient: "linear-gradient(135deg, #E8D5B0 0%, #C9A86C 100%)", accentColor: C.burg },
  { id: "BATCH-089", design: "BKB-031", name: "Red Silk Kanjivaram",       status: "active",    done: 4, total: 8,  pct: 50,  passRate: 97,  amount: null,     month: "Jun 2026", gradient: "linear-gradient(135deg, #8B2020 0%, #C0392B 100%)", accentColor: C.gold },
  { id: "BATCH-072", design: "BKB-038", name: "Purple Silk Traditional",   status: "completed", done: 6, total: 6,  pct: 100, passRate: 100, amount: "₹2,700", month: "Apr 2026", gradient: "linear-gradient(135deg, #5A3E6B 0%, #7B5F9B 100%)", accentColor: "#5A3E6B" },
  { id: "BATCH-061", design: "BKB-022", name: "Green Peacock Motif",       status: "completed", done: 4, total: 5,  pct: 80,  passRate: 88,  amount: "₹1,960", month: "Apr 2026", gradient: "linear-gradient(135deg, #1E6640 0%, #2D9640 100%)", accentColor: "#2D6B6B" },
  { id: "BATCH-054", design: "BKB-045", name: "Cream Zari Border Saree",  status: "completed", done: 7, total: 7,  pct: 100, passRate: 100, amount: "₹3,150", month: "Mar 2026", gradient: "linear-gradient(135deg, #E8D5B0 0%, #C9A86C 100%)", accentColor: C.burg },
  { id: "BATCH-046", design: "BKB-012", name: "Blue Silk Plain",           status: "completed", done: 5, total: 5,  pct: 100, passRate: 95,  amount: "₹2,250", month: "Feb 2026", gradient: "linear-gradient(135deg, #1565C0 0%, #1E88E5 100%)", accentColor: "#1565C0" },
  { id: "BATCH-039", design: "BKB-022", name: "Green Peacock Motif",       status: "completed", done: 6, total: 6,  pct: 100, passRate: 100, amount: "₹2,700", month: "Jan 2026", gradient: "linear-gradient(135deg, #1E6640 0%, #2D9640 100%)", accentColor: "#2D6B6B" },
  { id: "BATCH-031", design: "BKB-031", name: "Red Silk Kanjivaram",       status: "completed", done: 7, total: 8,  pct: 87,  passRate: 96,  amount: "₹3,360", month: "Jan 2026", gradient: "linear-gradient(135deg, #8B2020 0%, #C0392B 100%)", accentColor: C.gold },
  { id: "BATCH-024", design: "BKB-045", name: "Cream Zari Border Saree",  status: "completed", done: 8, total: 8,  pct: 100, passRate: 99,  amount: "₹3,600", month: "Dec 2025", gradient: "linear-gradient(135deg, #E8D5B0 0%, #C9A86C 100%)", accentColor: C.burg },
  { id: "BATCH-016", design: "BKB-038", name: "Purple Silk Traditional",   status: "completed", done: 5, total: 6,  pct: 83,  passRate: 92,  amount: "₹2,100", month: "Nov 2025", gradient: "linear-gradient(135deg, #5A3E6B 0%, #7B5F9B 100%)", accentColor: "#5A3E6B" },
  { id: "BATCH-009", design: "BKB-022", name: "Green Peacock Motif",       status: "completed", done: 6, total: 6,  pct: 100, passRate: 98,  amount: "₹2,700", month: "Oct 2025", gradient: "linear-gradient(135deg, #1E6640 0%, #2D9640 100%)", accentColor: "#2D6B6B" },
  { id: "BATCH-003", design: "BKB-031", name: "Red Silk Kanjivaram",       status: "completed", done: 8, total: 8,  pct: 100, passRate: 100, amount: "₹3,840", month: "Sep 2025", gradient: "linear-gradient(135deg, #8B2020 0%, #C0392B 100%)", accentColor: C.gold },
];

const BATCH_STATUS_CFG = {
  active:    { label: "Weaving in Progress", dot: C.green,   textColor: C.green },
  completed: { label: "Completed",           dot: "#1D4ED8", textColor: "#1D4ED8" },
  qc:        { label: "Pending QC",          dot: "#8B6018", textColor: "#8B6018" },
};

function BatchCard({ b }: { b: WeaverBatch }) {
  const cfg = BATCH_STATUS_CFG[b.status];
  const qcColor = b.passRate >= 95 ? C.green : b.passRate >= 85 ? "#8B6018" : C.crim;
  return (
    <motion.div
      whileHover={{ y: -8, boxShadow: "0px 28px 72px rgba(74,6,27,0.16)" }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      style={{ background: "#FFFDF9", borderRadius: 24, border: "1px solid rgba(110,15,45,0.10)", boxShadow: "0px 4px 18px rgba(74,6,27,0.07)", overflow: "hidden", cursor: "pointer", display: "flex", flexDirection: "column" as const }}
    >
      {/* Design preview area */}
      <div style={{ height: 160, flexShrink: 0, overflow: "hidden", position: "relative" as const, background: b.gradient, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Flower2 size={56} color="rgba(255,255,255,0.22)" />
        <div style={{ position: "absolute" as const, top: 0, left: 0, right: 0, height: 3, background: b.accentColor }} />
        <div style={{ position: "absolute" as const, top: 12, right: 12, display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 999, background: "rgba(255,253,249,0.92)", backdropFilter: "blur(8px)", border: "1px solid rgba(110,15,45,0.10)" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot }} />
          <span style={{ fontFamily: F.u, fontWeight: 500, fontSize: 10.5, color: cfg.dot }}>{cfg.label}</span>
        </div>
        <div style={{ position: "absolute" as const, bottom: 10, left: 14, background: "rgba(0,0,0,0.38)", borderRadius: 6, padding: "3px 10px" }}>
          <span style={{ fontFamily: F.m, fontSize: 11, color: "rgba(255,255,255,0.90)" }}>{b.design}</span>
        </div>
      </div>
      {/* Content */}
      <div style={{ padding: "18px 20px 22px", display: "flex", flexDirection: "column" as const, flex: 1, gap: 12 }}>
        <div>
          <div style={{ fontFamily: F.m, fontWeight: 700, fontSize: 17, color: "#6E0F2D", lineHeight: 1.2, marginBottom: 3 }}>{b.id}</div>
          <div style={{ fontFamily: F.u, fontSize: 13, color: "#8B7060" }}>{b.name}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[
            { label: "Sarees",  val: `${b.done} of ${b.total}`, color: "#3B2314" },
            { label: "QC Pass", val: `${b.passRate}%`,           color: qcColor },
            { label: "Month",   val: b.month,                    color: "#3B2314" },
          ].map(stat => (
            <div key={stat.label} style={{ background: "#F7F2EA", borderRadius: 10, padding: "10px 12px", border: "1px solid rgba(110,15,45,0.10)" }}>
              <div style={{ fontFamily: F.m, fontSize: 9, color: "#8B7060", letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 3 }}>{stat.label}</div>
              <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 13, color: stat.color }}>{stat.val}</div>
            </div>
          ))}
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontFamily: F.u, fontSize: 11, color: "#8B7060" }}>Progress</span>
            <span style={{ fontFamily: F.m, fontSize: 11, color: "#3B2314", fontWeight: 600 }}>{b.pct}%</span>
          </div>
          <div style={{ height: 4, borderRadius: 999, background: "rgba(110,15,45,0.07)" }}>
            <div style={{ width: `${b.pct}%`, height: "100%", borderRadius: 999, background: b.accentColor, transition: "width 0.6s ease" }} />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 4, borderTop: "1px solid rgba(110,15,45,0.08)" }}>
          <span style={{ fontFamily: F.u, fontSize: 11, color: "#8B7060" }}>{b.month}</span>
          <motion.div whileHover={{ x: 3 }} style={{ display: "flex", alignItems: "center", gap: 4, color: "#6E0F2D", cursor: "pointer" }}>
            <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600 }}>View</span>
            <ChevronRight size={13} color="#6E0F2D" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function FadeUpBatch({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 32, scale: 0.98 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : undefined}
      transition={{ type: "spring", stiffness: 260, damping: 26, delay, opacity: { duration: 0.45 } }}>
      {children}
    </motion.div>
  );
}

function BatchHistoryPage({ onBack, defaultFilter = "all" }: { onBack: () => void; defaultFilter?: "all" | "active" | "completed" }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">(defaultFilter);

  const filtered = BATCH_LIST.filter(b => {
    const matchSearch = !search || b.id.toLowerCase().includes(search.toLowerCase()) || b.name.toLowerCase().includes(search.toLowerCase()) || b.design.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const activeCount = BATCH_LIST.filter(b => b.status === "active").length;
  const completedCount = BATCH_LIST.filter(b => b.status === "completed").length;
  const totalSarees = BATCH_LIST.reduce((s, b) => s + b.done, 0);

  const T2 = {
    silkCream: "#F7F2EA", warmIvory: "#FFFDF9", royalBurgundy: "#6E0F2D",
    antiqueGold: "#C89B47", goldLight: "#E7C983", luxuryBrown: "#3B2314",
    taupe: "#8B7060", warmCream: "#F5E8D0", green: "#1E6640",
    borderDef: "rgba(110,15,45,0.10)",
  };

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", background: T2.silkCream, fontFamily: F.u }}>
      {/* Hero */}
      <section style={{ background: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)", padding: "56px 48px 0", position: "relative" as const, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(200,155,71,0.025) 60px, rgba(200,155,71,0.025) 61px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 80px, rgba(200,155,71,0.012) 80px, rgba(200,155,71,0.012) 81px)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 2 }}>
          <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 999, padding: "8px 18px", cursor: "pointer", fontFamily: F.u, fontSize: 13, color: "rgba(255,255,255,0.80)", marginBottom: 28, fontWeight: 500 }}>
            <ChevronLeft size={15} color="rgba(255,255,255,0.80)" /> Back to My Batches
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 20, height: 1, background: T2.antiqueGold, opacity: 0.6 }} />
            <span style={{ fontFamily: F.m, fontWeight: 600, fontSize: 9.5, color: "rgba(200,155,71,0.80)", letterSpacing: "3px", textTransform: "uppercase" as const }}>Ravi Kumar · WVR-014 · Weaver History</span>
          </div>
          <h1 style={{ fontFamily: F.d, fontWeight: 400, fontSize: "clamp(32px, 3vw, 52px)", color: T2.warmCream, margin: "0 0 12px", lineHeight: 1.1 }}>
            {defaultFilter === "completed" ? "Completed Batches" : "Batch History"}{" "}
            <span style={{ fontStyle: "italic", color: T2.antiqueGold }}>{defaultFilter === "completed" ? "& Payment Records" : "& All Work"}</span>
          </h1>
          <p style={{ fontFamily: F.u, fontSize: 14, color: "rgba(245,232,208,0.72)", margin: "0 0 24px", maxWidth: 540, lineHeight: 1.7 }}>
            {defaultFilter === "completed"
              ? "A full record of all the batches you have completed — sarees produced, quality results, and amounts earned."
              : "See all your batches — active and completed. A full history of all your weaving work with Beere Kesava."}
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const }}>
            {[
              { label: `${BATCH_LIST.length} Total Batches`, color: T2.antiqueGold, bg: "rgba(200,155,71,0.15)", border: "rgba(200,155,71,0.30)" },
              { label: `${activeCount} Currently Active`, color: T2.warmCream, bg: "rgba(30,102,64,0.18)", border: "rgba(30,102,64,0.35)" },
              { label: `${completedCount} Completed`, color: T2.warmCream, bg: "rgba(29,78,216,0.15)", border: "rgba(29,78,216,0.30)" },
            ].map(p => (
              <span key={p.label} style={{ fontFamily: F.u, fontWeight: 500, fontSize: 13, color: p.color, background: p.bg, border: `1px solid ${p.border}`, borderRadius: 999, padding: "6px 16px" }}>{p.label}</span>
            ))}
          </div>
          {/* Metrics bar */}
          <div style={{ display: "flex", gap: 0, marginTop: 40, borderTop: "1px solid rgba(245,232,208,0.08)" }}>
            {[
              { label: "Total Batches",    val: `${BATCH_LIST.length}`, sub: "All time",             Icon: Layers,       hi: false },
              { label: "Sarees Produced",  val: `${totalSarees}`,       sub: "Across all batches",   Icon: CheckCircle2, hi: true  },
              { label: "Active Now",       val: `${activeCount}`,       sub: "Currently weaving",    Icon: Clock,        hi: false },
              { label: "Completed",        val: `${completedCount}`,    sub: "Fully finished",       Icon: ListChecks,   hi: false },
            ].map((m, i) => (
              <div key={m.label} style={{ flex: 1, padding: "20px 22px", borderRight: i < 3 ? "1px solid rgba(245,232,208,0.07)" : "none", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 13, flexShrink: 0, background: m.hi ? "rgba(200,155,71,0.18)" : "rgba(245,232,208,0.07)", border: `1px solid ${m.hi ? "rgba(200,155,71,0.35)" : "rgba(245,232,208,0.09)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <m.Icon size={19} color={m.hi ? T2.antiqueGold : "rgba(245,232,208,0.70)"} />
                </div>
                <div>
                  <div style={{ fontFamily: F.m, fontWeight: 600, fontSize: 9, letterSpacing: "1.8px", textTransform: "uppercase" as const, color: m.hi ? "rgba(200,155,71,0.85)" : "rgba(245,232,208,0.55)", marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontFamily: F.d, fontWeight: 400, fontSize: 32, color: m.hi ? T2.goldLight : T2.warmCream, lineHeight: 1 }}>{m.val}</div>
                  <div style={{ fontFamily: F.u, fontSize: 11, color: "rgba(245,232,208,0.60)", marginTop: 3 }}>{m.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filter bar */}
      <div style={{ background: T2.warmIvory, borderBottom: `1px solid ${T2.borderDef}`, padding: "0 48px", position: "sticky" as const, top: 64, zIndex: 50, boxShadow: "0 4px 24px rgba(74,6,27,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, height: 60 }}>
          {([
            { key: "all",       label: "All Batches", count: BATCH_LIST.length },
            { key: "active",    label: "Active",      count: activeCount },
            { key: "completed", label: "Completed",   count: completedCount },
          ] as const).map(f => (
            <button key={f.key} onClick={() => setStatusFilter(f.key)}
              style={{ height: "100%", padding: "0 18px", border: "none", background: "rgba(0,0,0,0)", cursor: "pointer", display: "flex", alignItems: "center", gap: 7, borderBottom: statusFilter === f.key ? `2px solid ${T2.royalBurgundy}` : "2px solid transparent" }}>
              <span style={{ fontFamily: F.u, fontWeight: statusFilter === f.key ? 600 : 400, fontSize: 13.5, color: statusFilter === f.key ? T2.royalBurgundy : T2.taupe }}>{f.label}</span>
              <span style={{ fontFamily: F.m, fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 999, background: statusFilter === f.key ? "rgba(110,15,45,0.08)" : "rgba(139,112,96,0.08)", color: statusFilter === f.key ? T2.royalBurgundy : T2.taupe }}>{f.count}</span>
            </button>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, background: T2.silkCream, border: `1px solid ${T2.borderDef}`, borderRadius: 12, padding: "0 14px", height: 38 }}>
            <Search size={14} color={T2.taupe} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search batch ID or design…"
              style={{ border: "none", background: "none", outline: "none", fontFamily: F.u, fontSize: 13, color: T2.luxuryBrown, width: 200 }} />
          </div>
          <span style={{ fontFamily: F.m, fontSize: 11, color: T2.taupe }}>{filtered.length} batch{filtered.length !== 1 ? "es" : ""}</span>
        </div>
      </div>

      {/* Grid */}
      <div style={{ padding: "40px 48px 80px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center" as const, padding: "80px 40px" }}>
            <div style={{ width: 72, height: 72, borderRadius: 22, background: "rgba(110,15,45,0.06)", border: `1px solid ${T2.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Layers size={28} color={T2.taupe} />
            </div>
            <div style={{ fontFamily: F.d, fontWeight: 400, fontSize: 22, color: T2.luxuryBrown, marginBottom: 8 }}>No batches found</div>
            <div style={{ fontFamily: F.u, fontSize: 14, color: T2.taupe }}>Try adjusting your search or filter.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 22 }}>
            {filtered.map((b, i) => (
              <FadeUpBatch key={b.id} delay={i * 0.04}>
                <BatchCard b={b} />
              </FadeUpBatch>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DESKTOP HERO COMPONENT ────────────────────────────────────────────────
const BG_IMAGE = "https://images.unsplash.com/photo-1707978932202-751b08324daf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1400";
const FABRIC_BG = "https://images.unsplash.com/photo-1569909115134-a0426936c879?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1400";

interface HeroStatItem { label: string; val: string; sub: string; highlight?: boolean }
interface HeroPill { text: string; color?: string }
interface DesktopHeroProps {
  breadcrumb: string;
  titleMain: string;
  titleSub: string;
  description: string;
  pills?: HeroPill[];
  alertBadge?: string;
  stats?: HeroStatItem[];
  bgUrl?: string;
  bp?: "tablet" | "desktop";
}

function DesktopHero({ breadcrumb, titleMain, titleSub, description, pills, alertBadge, stats, bgUrl, bp = "desktop" }: DesktopHeroProps) {
  const isTablet = bp === "tablet";
  return (
    <div style={{ position: "relative", overflow: "hidden", background: C.dark }}>
      {/* Background image */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url(${bgUrl || BG_IMAGE})`,
        backgroundSize: "cover", backgroundPosition: "center",
        opacity: 0.22,
      }} />
      {/* Dark gradient overlay */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(61,14,26,0.95) 0%, rgba(61,14,26,0.75) 60%, rgba(61,14,26,0.50) 100%)" }} />

      <div style={{ position: "relative", zIndex: 1, padding: isTablet ? "28px 28px 0" : "40px 48px 0" }}>
        {/* Breadcrumb */}
        <div style={{ fontFamily: F.m, fontSize: 10, letterSpacing: 3, color: "rgba(255,255,255,0.40)", textTransform: "uppercase", marginBottom: 20 }}>{breadcrumb}</div>

        {/* Title row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: isTablet ? 40 : 62, color: "#FFF", lineHeight: 1, marginBottom: 4 }}>
              {titleMain} <span style={{ fontFamily: F.d, fontStyle: "italic", fontWeight: 500, fontSize: isTablet ? 26 : 38, color: C.gold }}>{titleSub}</span>
            </div>
          </div>
          {alertBadge && (
            <div style={{ background: "rgba(196,146,58,0.25)", border: `1px solid ${C.gold}`, borderRadius: 999, padding: "8px 18px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.gold }} />
              <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.gold }}>{alertBadge}</span>
            </div>
          )}
        </div>

        {/* Description */}
        <div style={{ fontFamily: F.u, fontSize: 15, color: "rgba(255,255,255,0.65)", lineHeight: 1.6, maxWidth: 640, marginBottom: 22 }}>{description}</div>

        {/* Pills */}
        {pills && pills.length > 0 && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 32 }}>
            {pills.map((p, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 999, padding: "6px 16px" }}>
                <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: p.color || "#FFF" }}>{p.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats bar */}
      {stats && stats.length > 0 && (
        <div style={{
          position: "relative", zIndex: 1, display: "grid",
          gridTemplateColumns: isTablet ? "repeat(2,1fr)" : `repeat(${stats.length},1fr)`,
          margin: isTablet ? "0 28px" : "0 48px", borderRadius: 0, borderTop: "1px solid rgba(255,255,255,0.08)",
        }}>
          {stats.map((s, i) => (
            <div key={i} style={{
              padding: isTablet ? "18px 20px" : "24px 28px",
              borderRight: isTablet ? (i % 2 === 0 ? "1px solid rgba(255,255,255,0.10)" : "none") : (i < stats.length - 1 ? "1px solid rgba(255,255,255,0.10)" : "none"),
              borderBottom: isTablet && i < stats.length - 2 ? "1px solid rgba(255,255,255,0.10)" : "none",
              background: s.highlight ? "rgba(196,146,58,0.18)" : "transparent",
              borderTop: s.highlight ? `2px solid ${C.gold}` : "none",
            }}>
              <div style={{ fontFamily: F.m, fontSize: 9, letterSpacing: 1.5, color: "rgba(255,255,255,0.38)", textTransform: "uppercase", marginBottom: 10 }}>{s.label}</div>
              <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: isTablet ? 38 : 54, color: s.highlight ? C.gold : "#FFF", lineHeight: 1, marginBottom: 8 }}>{s.val}</div>
              <div style={{ fontFamily: F.u, fontSize: 13, color: "rgba(255,255,255,0.45)" }}>{s.sub}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ position: "relative", zIndex: 1, height: 32 }} />
    </div>
  );
}

// ─── Desktop active batch card (with inline design/type expand) ─────────────
function DesktopActiveBatchCard({ b, idx, bp = "desktop" }: { b: MyBatchEntry; idx: number; bp?: "tablet" | "desktop" }) {
  const [expandedDesign, setExpandedDesign] = useState<string | null>(null);
  const [expandedType,   setExpandedType]   = useState<string | null>(null);
  const isTablet = bp === "tablet";

  const borderColor    = idx % 2 === 0 ? C.burg : C.gold;
  const designCodes    = Array.from(new Set(b.myRows.map(r => r.designCode).filter(Boolean))) as string[];
  const sareeTypePairs = Array.from(new Map(b.myRows.filter(r => r.sareeTypeCode && r.sareeTypeName).map(r => [r.sareeTypeCode!, r.sareeTypeName!])).entries());
  const bulkOrders     = Array.from(new Set(b.myRows.map(r => r.bulkOrderLabel).filter(Boolean))) as string[];
  const generalStock   = b.myRows.filter(r => !r.bulkOrderLabel).length;
  const qcPassedCount  = b.myRows.filter(r => r.qcPassed === true).length;

  return (
    <div style={{ background: "#FFFDF9", borderRadius: 24, border: `1px solid rgba(110,15,45,0.10)`, borderLeft: `4px solid ${borderColor}`, boxShadow: "0px 4px 18px rgba(74,6,27,0.07)", overflow: "hidden", display: "flex", flexDirection: "column" as const }}>
      <div style={{ padding: "22px 24px 20px", display: "flex", flexDirection: "column" as const, gap: 14 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: F.m, fontWeight: 700, fontSize: 18, color: C.burg }}>{b.batchId}</span>
          <span style={{ fontFamily: F.u, fontSize: 11, color: b.status === "active" ? C.green : C.gold, background: b.status === "active" ? "rgba(30,102,64,0.10)" : "rgba(196,146,58,0.15)", borderRadius: 999, padding: "4px 12px", fontWeight: 600 }}>
            {b.status === "active" ? "🟢 Weaving in Progress" : "🟡 Draft"}
          </span>
        </div>

        {/* Saree count + QC progress: side by side on desktop, stacked on tablet */}
        <div style={{ display: "flex", flexDirection: isTablet ? "column" as const : "row" as const, gap: 14, alignItems: isTablet ? "stretch" : "center" }}>
          <div style={{ background: C.cream, borderRadius: 12, padding: "14px 18px", textAlign: "center" as const, flex: isTablet ? undefined : "0 0 auto", minWidth: isTablet ? undefined : 160 }}>
            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 4 }}>Sarees assigned to you</div>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 36, color: C.text, lineHeight: 1 }}>{b.myRows.length}</div>
            {b.dueDate && <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 4 }}>Due by <span style={{ color: C.text, fontWeight: 600 }}>{b.dueDate}</span></div>}
          </div>

          {/* QC progress indicator */}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>QC: {qcPassedCount} of {b.myRows.length} passed</span>
              <span style={{ fontFamily: F.m, fontSize: 13, color: C.text, fontWeight: 600 }}>{Math.round((qcPassedCount / b.myRows.length) * 100)}%</span>
            </div>
            <ProgressBar pct={(qcPassedCount / b.myRows.length) * 100} height={8} />
          </div>
        </div>

        {/* Clickable design code chips */}
        {designCodes.length > 0 && (
          <div>
            <div style={{ fontFamily: F.m, fontSize: 9, color: C.muted, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 7 }}>CLICK TO VIEW DESIGN DETAILS</div>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 7 }}>
              {designCodes.map(dc => (
                <button key={dc} onClick={() => setExpandedDesign(expandedDesign === dc ? null : dc)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, background: expandedDesign === dc ? C.burg : "rgba(107,26,42,0.07)", border: `1.5px solid ${expandedDesign === dc ? C.burg : C.bdr}`, borderRadius: 8, padding: "5px 14px", cursor: "pointer" }}>
                  <Palette size={12} color={expandedDesign === dc ? "#FFF" : C.burg} />
                  <span style={{ fontFamily: F.m, fontSize: 13, color: expandedDesign === dc ? "#FFF" : C.burg, fontWeight: 700 }}>{dc}</span>
                </button>
              ))}
            </div>
            <AnimatePresence>
              {expandedDesign && designCodes.includes(expandedDesign) && (
                <DesignDetailCard key={expandedDesign} designCode={expandedDesign} onClose={() => setExpandedDesign(null)} />
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Clickable saree type chips */}
        {sareeTypePairs.length > 0 && (
          <div>
            <div style={{ fontFamily: F.m, fontSize: 9, color: C.muted, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 7 }}>CLICK TO VIEW SAREE TYPE DETAILS</div>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 7 }}>
              {sareeTypePairs.map(([code, name]) => (
                <button key={code} onClick={() => setExpandedType(expandedType === code ? null : code)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, background: expandedType === code ? C.dark : "rgba(61,14,26,0.04)", border: `1.5px solid ${expandedType === code ? C.dark : C.bdr}`, borderRadius: 8, padding: "5px 14px", cursor: "pointer" }}>
                  <Layers size={12} color={expandedType === code ? "#FFF" : C.text} />
                  <span style={{ fontFamily: F.u, fontSize: 13, color: expandedType === code ? "#FFF" : C.text }}>{name}</span>
                </button>
              ))}
            </div>
            <AnimatePresence>
              {expandedType && (
                <SareeTypeDetailCard
                  key={expandedType}
                  typeCode={expandedType}
                  typeName={sareeTypePairs.find(([c]) => c === expandedType)?.[1] ?? expandedType}
                  onClose={() => setExpandedType(null)}
                />
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Order links */}
        {bulkOrders.map(label => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(30,102,64,0.07)", border: "1px solid rgba(30,102,64,0.15)", borderRadius: 10, padding: "10px 14px" }}>
            <Package size={13} color={C.green} />
            <div>
              <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted }}>Customer Order</div>
              <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.green }}>{label}</div>
            </div>
          </div>
        ))}
        {generalStock > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(139,112,96,0.07)", border: "1px solid rgba(139,112,96,0.15)", borderRadius: 10, padding: "10px 14px" }}>
            <Package size={13} color={C.muted} />
            <div>
              <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted }}>General Stock</div>
              <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.text }}>{generalStock} saree{generalStock !== 1 ? "s" : ""} for stock</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DESKTOP SHELL ─────────────────────────────────────────────────────────

function DesktopWeaverPortal({ onBack, bp = "desktop" }: { onBack?: () => void; bp?: "tablet" | "desktop" }) {
  const isTablet = bp === "tablet";
  const [active, setActive] = useState<Tab5>("batches");
  const [showNotifs, setShowNotifs] = useState(false);
  const [search, setSearch] = useState("");
  const [showProfile, setShowProfile] = useState(false);

  // Batches sub-page navigation
  const [batchesSubPage, setBatchesSubPage] = useState<"main" | "history" | "completed">("main");

  const { batches } = useBatches();
  const { getDesign } = useDesignLibrary();
  const { getRecordsForWeaver, updateSignatureStatus } = useMaterialIssue();
  const weaverMaterialRecords = getRecordsForWeaver(CURRENT_WEAVER_ID);
  const pendingMaterialRecord = weaverMaterialRecords.find(r => r.status === "pending-signature") ?? null;
  const myWeaverBatches: MyBatchEntry[] = batches
    .map(b => ({ ...b, myRows: b.rows.filter(r => r.weaverId === CURRENT_WEAVER_ID) }))
    .filter(b => b.myRows.length > 0);

  // Completed: every saree row assigned to this weaver in the batch has passed QC
  const completedBatches: MyBatchEntry[] = myWeaverBatches.filter(b => b.myRows.every(r => r.qcPassed === true));
  // Active: anything not yet fully QC-passed, with a "X of Y passed" progress indicator
  const myActiveBatches: MyBatchEntry[] = myWeaverBatches.filter(b => !b.myRows.every(r => r.qcPassed === true));

  // Designs assigned to this weaver's active batch saree rows (shared by "Design Library" + "Designs" tab)
  const myDesignCodes = Array.from(new Set(
    batches
      .filter(b => b.status === "active" || b.status === "draft")
      .flatMap(b => b.rows)
      .filter(r => r.weaverId === CURRENT_WEAVER_ID)
      .map(r => r.designCode)
      .filter((c): c is string => Boolean(c))
  ));
  const [viewDesign, setViewDesign] = useState<DesignEntry | null>(null);
  const openDesignCode = (code: string) => { const d = getDesign(code); if (d) setViewDesign(d); };

  // Confirm page state
  const [sigMethod, setSigMethod] = useState<"none" | "here" | "remote">("none");
  const [hasSig, setHasSig] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmedRecord, setConfirmedRecord] = useState<typeof pendingMaterialRecord>(null);
  const [requestSent, setRequestSent] = useState(false);

  // Warp request state
  const [warpBatch, setWarpBatch] = useState<"086" | "089">("086");
  const [materials, setMaterials] = useState({ warp: false, resham: false, jari: false });
  const [amounts, setAmounts] = useState({ warp: "", resham: "", jari: "" });
  const [reason, setReason] = useState("");
  const [warpSubmitted, setWarpSubmitted] = useState(false);

  const NAV: { id: Tab5; label: string; icon: React.ReactNode }[] = [
    { id: "batches",   label: "My Batches",   icon: <Layers size={16} /> },
    { id: "confirm",   label: "Confirm",       icon: <ClipboardCheck size={16} /> },
    { id: "designs",   label: "Designs",       icon: <Palette size={16} /> },
    { id: "warp",      label: "Warp Request",  icon: <Package size={16} /> },
    { id: "payments",  label: "Payments",      icon: <CreditCard size={16} /> },
  ];

  const DSectionHeader = ({ label, link, onLink }: { label: string; link?: string; onLink?: () => void }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 5, height: 28, background: C.burg, borderRadius: 3 }} />
        <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 20, color: C.text }}>{label}</span>
      </div>
      {link && (
        <button onClick={onLink} style={{ background: "none", border: "none", fontFamily: F.u, fontSize: 14, color: C.gold, cursor: "pointer", padding: 0, fontWeight: 500 }}>{link}</button>
      )}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#F8F4F0", fontFamily: F.u }}>
      {/* ── Top Navbar ── */}
      <div style={{ background: "#FFF", borderBottom: `1px solid ${C.bdr}`, position: "sticky" as const, top: 0, zIndex: 200, boxShadow: "0 1px 10px rgba(107,26,42,0.07)" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", padding: isTablet ? "0 24px" : "0 48px", display: "flex", alignItems: "center", height: 64, gap: isTablet ? 16 : 28 }}>
          <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#FFF", border: `1px solid ${C.bdr}`, boxShadow: "0 2px 10px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Flower2 size={24} color={C.burg} />
            </div>
            {!isTablet && (
            <div>
              <div style={{ fontFamily: F.d, fontSize: 18, fontWeight: 700, color: "#2C1810", lineHeight: 1.1 }}>Beere Kesava</div>
              <div style={{ fontFamily: F.d, fontSize: 13, fontWeight: 400, color: "#3B2314", marginTop: 1 }}>& Brothers Silks</div>
              <div style={{ fontFamily: F.u, fontSize: 9, fontWeight: 700, color: C.gold, letterSpacing: 2.5, textTransform: "uppercase" as const, marginTop: 4 }}>WEAVER PORTAL</div>
            </div>
            )}
          </div>
          <nav className="wp-filter-scroll" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: isTablet ? "flex-start" : "center", gap: 2, overflowX: "auto", minWidth: 0, scrollbarWidth: "none" } as React.CSSProperties}>
            {NAV.map(tab => (
              <button key={tab.id} onClick={() => { setActive(tab.id); setShowNotifs(false); }} style={{
                display: "flex", alignItems: "center", gap: 7, flexShrink: 0, padding: isTablet ? "0 10px" : "0 18px", height: 64, border: "none", background: "transparent", cursor: "pointer",
                fontFamily: F.u, fontSize: 14, fontWeight: active === tab.id && !showNotifs ? 600 : 400,
                color: active === tab.id && !showNotifs ? C.text : C.muted,
                borderBottom: active === tab.id && !showNotifs ? `2px solid ${C.burg}` : "2px solid transparent",
                transition: "all 0.15s", whiteSpace: "nowrap" as const,
              }}
              onMouseEnter={e => { if (!(active === tab.id && !showNotifs)) e.currentTarget.style.color = C.text; }}
              onMouseLeave={e => { if (!(active === tab.id && !showNotifs)) e.currentTarget.style.color = C.muted; }}>
                {React.cloneElement(tab.icon as React.ReactElement, { color: active === tab.id && !showNotifs ? C.burg : C.muted })}
                {tab.label}
              </button>
            ))}
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <div style={{ position: "relative" as const }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ width: isTablet ? 140 : 200, height: 38, background: C.inp, border: `1px solid ${C.bdr}`, borderRadius: 999, padding: "0 14px 0 38px", fontFamily: F.u, fontSize: 13, color: C.text, outline: "none" }} />
              <Search size={14} color={C.muted} style={{ position: "absolute" as const, left: 12, top: "50%", transform: "translateY(-50%)" }} />
            </div>
            <button onClick={() => setShowNotifs(v => !v)} style={{ position: "relative" as const, background: showNotifs ? "rgba(107,26,42,0.08)" : "none", border: "none", cursor: "pointer", padding: 8, borderRadius: 8, display: "flex", alignItems: "center" }}>
              <Bell size={20} color={showNotifs ? C.burg : C.muted} />
              <span style={{ position: "absolute" as const, top: 4, right: 4, width: 10, height: 10, background: "#FF3B30", borderRadius: "50%", border: "2px solid #FFF" }} />
            </button>
            <div style={{ position: "relative" as const }}>
              <button onClick={() => setShowProfile(p => !p)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 14px", background: showProfile ? "rgba(107,26,42,0.10)" : "rgba(107,26,42,0.06)", border: `1px solid ${showProfile ? C.burg : C.bdr}`, borderRadius: 999, cursor: "pointer" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.burg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontFamily: F.d, fontSize: 12, fontWeight: 700, color: "#FFF" }}>RK</span>
                </div>
                <div style={{ textAlign: "left" as const }}>
                  <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.2 }}>Ravi Kumar</div>
                  <div style={{ fontFamily: F.u, fontSize: 10, color: C.muted }}>WVR-014 · Handloom</div>
                </div>
                <ChevronLeft size={13} color={C.muted} style={{ transform: showProfile ? "rotate(-90deg)" : "rotate(-90deg)", transition: "transform 0.2s" }} />
              </button>
              {showProfile && (
                <div style={{ position: "absolute" as const, top: "calc(100% + 8px)", right: 0, zIndex: 300, background: "#FFF", borderRadius: 14, border: `1px solid ${C.bdr}`, boxShadow: "0 8px 32px rgba(44,24,16,0.14)", minWidth: 240, overflow: "hidden" }}>
                  <div style={{ padding: "16px 18px", background: "rgba(107,26,42,0.04)", borderBottom: `1px solid ${C.bdr}`, display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: C.burg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 3px 12px rgba(107,26,42,0.28)" }}>
                      <span style={{ fontFamily: F.d, fontSize: 16, fontWeight: 700, color: "#FFF" }}>RK</span>
                    </div>
                    <div>
                      <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 15, color: C.text }}>Ravi Kumar</div>
                      <div style={{ fontFamily: F.m, fontSize: 11, color: C.muted, marginTop: 2 }}>WVR-014 · Handloom Weaver</div>
                    </div>
                  </div>
                  <div style={{ padding: "6px 0" }}>
                    <button onClick={() => setShowProfile(false)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 18px", border: "none", background: "none", cursor: "pointer", fontFamily: F.u, fontSize: 14, color: C.text, textAlign: "left" as const }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(107,26,42,0.04)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                      <UserRound size={15} color={C.muted} /> View Profile
                    </button>
                    <div style={{ height: 1, background: C.bdr, margin: "4px 0" }} />
                    <button onClick={() => { setShowProfile(false); onBack?.(); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 18px", border: "none", background: "none", cursor: "pointer", fontFamily: F.u, fontSize: 14, color: C.text, textAlign: "left" as const }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(107,26,42,0.04)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                      <ChevronLeft size={15} color={C.muted} /> Switch Portal
                    </button>
                    <button onClick={() => { setShowProfile(false); onBack?.(); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 18px", border: "none", background: "none", cursor: "pointer", fontFamily: F.u, fontSize: 14, color: "#C0392B", textAlign: "left" as const }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(192,57,43,0.05)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                      <LogOut size={15} color="#C0392B" /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Page Content ── */}
      <AnimatePresence mode="wait">
        <motion.div key={showNotifs ? "notifs" : active} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>

          {/* ════════ NOTIFICATIONS ════════ */}
          {showNotifs && (<NotificationsPage />)}

          {/* ════════ MY BATCHES ════════ */}
          {!showNotifs && active === "batches" && (
            <>
              {/* Sub-page: History */}
              {batchesSubPage === "history" && (
                <BatchHistoryPage onBack={() => setBatchesSubPage("main")} defaultFilter="all" />
              )}
              {/* Sub-page: Completed */}
              {batchesSubPage === "completed" && (
                <BatchHistoryPage onBack={() => setBatchesSubPage("main")} defaultFilter="completed" />
              )}
              {/* Main batches view */}
              {batchesSubPage === "main" && (
                <>
                  <DesktopHero
                bp={bp}
                    breadcrumb="SINCE 1999 · WEAVER PORTAL"
                    titleMain="My Batches"
                    titleSub="& Active Work"
                    description="Track your active and completed batches, view design references, and manage your materials. You have 2 active batches currently in progress."
                    pills={[
                      { text: "2 Active Batches", color: C.gold },
                      { text: "18 Sarees This Month" },
                      { text: "97% QC Pass Rate" },
                      { text: "₹8,100 Earned" },
                    ]}
                    alertBadge="Ravi Kumar · WVR-014"
                    stats={[
                      { label: "Sarees Produced This Month", val: "18", sub: "↑ 3 more than last month" },
                      { label: "Quality Check Pass Rate", val: "97%", sub: "Only 2 rejected this month", highlight: true },
                      { label: "Total Earned This Month", val: "₹8,100", sub: "After all deductions" },
                      { label: "Active Batches", val: "2", sub: "Maximum allowed — 2 of 2" },
                    ]}
                    bgUrl={BG_IMAGE}
                  />
                  <div style={{ padding: isTablet ? "24px 28px 40px" : "40px 48px 56px" }}>
                    {/* Active Batches */}
                    <div style={{ marginBottom: 40 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 5, height: 28, background: C.burg, borderRadius: 3 }} />
                          <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 20, color: C.text }}>Active Batches</span>
                        </div>
                        <button onClick={() => setBatchesSubPage("history")} style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(107,26,42,0.06)", border: `1px solid ${C.bdr}`, borderRadius: 999, padding: "8px 18px", cursor: "pointer", fontFamily: F.u, fontSize: 14, color: C.burg, fontWeight: 600 }}>
                          <History size={15} color={C.burg} /> View All History
                        </button>
                      </div>
                      <div style={{ fontFamily: F.u, fontSize: 15, color: C.muted, marginBottom: 24 }}>
                        You can have a maximum of 2 active batches at a time. Complete one before a new batch is assigned.
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "1fr 1fr", gap: isTablet ? 18 : 24, marginBottom: 20 }}>
                        {myActiveBatches.map((b, idx) => <DesktopActiveBatchCard key={b.batchId} b={b} idx={idx} bp={bp} />)}
                        {myActiveBatches.length === 0 && (
                          <div style={{ gridColumn: "1 / -1", padding: "40px 20px", textAlign: "center" as const, background: C.cream, borderRadius: 20, border: `1px solid ${C.bdr}` }}>
                            <Package size={32} color={C.muted} style={{ margin: "0 auto 12px" }} />
                            <div style={{ fontFamily: F.u, fontSize: 16, color: C.muted }}>No active batches assigned to you yet.</div>
                          </div>
                        )}
                      </div>
                      <div style={{ background: "#FFF8E8", border: `1px solid rgba(196,146,58,0.30)`, borderRadius: 14, padding: "16px 22px", display: "flex", alignItems: "center", gap: 12 }}>
                        <AlertCircle size={20} color={C.gold} />
                        <span style={{ fontFamily: F.u, fontSize: 15, color: C.muted }}>Maximum 2 active batches reached. Complete one before a new batch can be assigned.</span>
                      </div>
                    </div>

                    {/* Completed Batches */}
                    <div style={{ marginBottom: 40 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 5, height: 28, background: "#1D4ED8", borderRadius: 3 }} />
                          <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 20, color: C.text }}>Completed Batches</span>
                        </div>
                        <button onClick={() => setBatchesSubPage("completed")} style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(29,78,216,0.06)", border: "1px solid rgba(29,78,216,0.20)", borderRadius: 999, padding: "8px 18px", cursor: "pointer", fontFamily: F.u, fontSize: 14, color: "#1D4ED8", fontWeight: 600 }}>
                          <ListChecks size={15} color="#1D4ED8" /> See All Completed
                        </button>
                      </div>
                      <div style={{ fontFamily: F.u, fontSize: 15, color: C.muted, marginBottom: 24 }}>Recent completed batches — your track record of finished work.</div>
                      {completedBatches.length === 0 ? (
                        <div style={{ padding: "40px 20px", textAlign: "center" as const, background: C.cream, borderRadius: 20, border: `1px solid ${C.bdr}` }}>
                          <CheckCircle2 size={32} color={C.muted} style={{ margin: "0 auto 12px" }} />
                          <div style={{ fontFamily: F.u, fontSize: 16, color: C.muted }}>No completed batches yet.</div>
                          <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, marginTop: 4 }}>A batch moves here once QC has passed on every saree you wove.</div>
                        </div>
                      ) : (
                        <div style={{ display: "grid", gridTemplateColumns: isTablet ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 22 }}>
                          {completedBatches.slice(0, 4).map(b => <CompletedBatchCard key={b.batchId} b={b} onDesignClick={openDesignCode} />)}
                        </div>
                      )}
                    </div>

                    {/* Design Library + Quick Actions row */}
                    <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "1fr 400px", gap: 28 }}>
                      {/* Design Library */}
                      <div style={{ background: "#FFF", borderRadius: 20, border: `1px solid ${C.bdr}`, overflow: "hidden", boxShadow: "0 4px 20px rgba(44,24,16,0.08)" }}>
                        <div style={{ padding: "20px 26px", borderBottom: `1px solid ${C.bdr}`, background: "#FAFAF8", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 5, height: 22, background: C.gold, borderRadius: 3 }} />
                            <span style={{ fontFamily: F.u, fontSize: 16, fontWeight: 700, color: C.text }}>Design Library</span>
                          </div>
                          <button onClick={() => setActive("designs")} style={{ background: "none", border: "none", fontFamily: F.u, fontSize: 13, color: C.gold, cursor: "pointer", fontWeight: 500 }}>View All →</button>
                        </div>
                        <div style={{ padding: "20px 26px" }}>
                          <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, marginBottom: 18 }}>Design instructions assigned to your active batches.</div>
                          {myDesignCodes.length === 0 ? (
                            <div style={{ padding: "20px", textAlign: "center" as const, background: "#FAFAF8", borderRadius: 14, border: `1px solid ${C.bdr}` }}>
                              <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted }}>No designs assigned yet. Check with your supervisor.</div>
                            </div>
                          ) : (
                            <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr 1fr" : "1fr 1fr 1fr", gap: 14 }}>
                              {myDesignCodes.map(code => {
                                const d = getDesign(code);
                                return (
                                  <button key={code} onClick={() => openDesignCode(code)} style={{ background: "#FAFAF8", borderRadius: 14, border: `1px solid ${C.bdr}`, overflow: "hidden", cursor: "pointer", textAlign: "left" as const, padding: 0 }}>
                                    {d?.colorSlipPhoto ? (
                                      <div style={{ height: 100, backgroundImage: `url(${d.colorSlipPhoto})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                                    ) : (
                                      <div style={{ height: 100, background: C.cream, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <Sparkles size={26} color={C.muted} />
                                      </div>
                                    )}
                                    <div style={{ padding: "12px 12px" }}>
                                      <div style={{ fontFamily: F.m, fontSize: 11, color: C.burg, marginBottom: 4 }}>{code}</div>
                                      <div style={{ fontFamily: F.u, fontSize: 13, color: C.text, lineHeight: 1.3 }}>{d?.name || "—"}</div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div style={{ background: C.dark, borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 24px rgba(61,14,26,0.22)" }}>
                        <div style={{ padding: "20px 26px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                          <div style={{ fontFamily: F.u, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.40)", letterSpacing: 1.4, textTransform: "uppercase" as const, marginBottom: 4 }}>QUICK ACTIONS</div>
                          <div style={{ fontFamily: F.u, fontSize: 15, color: "rgba(255,255,255,0.75)" }}>Navigate to key tasks</div>
                        </div>
                        {[
                          { label: "Confirm Materials", sub: "New batch awaiting signature", tab: "confirm" as Tab5, icon: <ClipboardCheck size={18} color={C.gold} />, badge: "Pending" },
                          { label: "View Designs", sub: "Your design instructions", tab: "designs" as Tab5, icon: <Palette size={18} color={C.gold} />, badge: null },
                          { label: "Raise Warp Request", sub: "Request additional material", tab: "warp" as Tab5, icon: <Package size={18} color={C.gold} />, badge: null },
                          { label: "Payment Ledger", sub: "View earnings & deductions", tab: "payments" as Tab5, icon: <CreditCard size={18} color={C.gold} />, badge: null },
                        ].map((a, i) => (
                          <button key={a.tab} onClick={() => setActive(a.tab)} style={{ display: "flex", alignItems: "center", gap: 16, width: "100%", padding: "18px 26px", border: "none", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.07)" : "none", background: "transparent", cursor: "pointer", textAlign: "left" as const }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(196,146,58,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{a.icon}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontFamily: F.u, fontSize: 15, fontWeight: 600, color: "#FFF", marginBottom: 3 }}>{a.label}</div>
                              <div style={{ fontFamily: F.u, fontSize: 13, color: "rgba(255,255,255,0.45)" }}>{a.sub}</div>
                            </div>
                            {a.badge && <span style={{ fontFamily: F.u, fontSize: 11, fontWeight: 700, color: C.dark, background: C.gold, padding: "3px 10px", borderRadius: 999 }}>{a.badge}</span>}
                            <ArrowRight size={16} color="rgba(255,255,255,0.30)" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* ════════ CONFIRM ════════ */}
          {!showNotifs && active === "confirm" && (
            <>
              <DesktopHero
                bp={bp}
                breadcrumb="SINCE 1999 · WEAVER PORTAL · MATERIAL RECEIPT"
                titleMain="Confirm Materials"
                titleSub="& Open Your Batch"
                description="Review all materials issued to you, check the color slip, and sign to officially open your batch and start weaving."
                pills={pendingMaterialRecord ? [
                  { text: `${pendingMaterialRecord.id} · Awaiting Signature`, color: C.gold },
                  { text: `${pendingMaterialRecord.materials.length} Material${pendingMaterialRecord.materials.length !== 1 ? "s" : ""} to Review` },
                ] : [{ text: "No pending materials" }]}
                alertBadge={pendingMaterialRecord ? "New Materials Issued" : undefined}
                bgUrl={FABRIC_BG}
              />
              <div style={{ padding: isTablet ? "24px 28px 40px" : "40px 48px 56px" }}>
                {confirmed && confirmedRecord ? (
                  <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" as const, padding: "60px 48px", background: "#FFF", borderRadius: 24, border: `1px solid ${C.bdr}`, boxShadow: "0 4px 32px rgba(44,24,16,0.10)" }}>
                    <div style={{ width: 96, height: 96, borderRadius: "50%", background: "rgba(30,102,64,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px" }}>
                      <Check size={52} color={C.green} />
                    </div>
                    <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 36, color: C.text, marginBottom: 16 }}>Materials Confirmed!</div>
                    <div style={{ fontFamily: F.u, fontSize: 16, color: C.muted, lineHeight: 1.7, marginBottom: 24 }}>You have confirmed receipt of all materials in {confirmedRecord.id}. Good luck with your weaving!</div>
                    <div style={{ display: "inline-block", background: "rgba(107,26,42,0.08)", color: C.burg, borderRadius: 999, padding: "10px 24px", fontFamily: F.m, fontSize: 18, marginBottom: 36 }}>{confirmedRecord.id}</div>
                    <button onClick={() => { setConfirmed(false); setConfirmedRecord(null); setSigMethod("none"); setHasSig(false); setRequestSent(false); }} style={{ display: "block", width: "100%", height: 60, background: C.burg, border: "none", borderRadius: 999, fontFamily: F.u, fontWeight: 700, fontSize: 18, color: "#FFF", cursor: "pointer" }}>
                      ← Back to My Batches
                    </button>
                  </div>
                ) : !pendingMaterialRecord ? (
                  <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" as const, padding: "60px 48px", background: "#FFF", borderRadius: 24, border: `1px solid ${C.bdr}`, boxShadow: "0 4px 32px rgba(44,24,16,0.10)" }}>
                    <div style={{ width: 96, height: 96, borderRadius: "50%", background: "rgba(30,102,64,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px" }}>
                      <Check size={52} color={C.green} />
                    </div>
                    <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 30, color: C.text, marginBottom: 16 }}>No pending material receipt</div>
                    <div style={{ fontFamily: F.u, fontSize: 16, color: C.muted, lineHeight: 1.7, marginBottom: 24 }}>All material receipts are confirmed. Nothing pending.</div>
                    <button onClick={() => setActive("batches")} style={{ display: "block", width: "100%", height: 56, background: C.burg, border: "none", borderRadius: 999, fontFamily: F.u, fontWeight: 700, fontSize: 16, color: "#FFF", cursor: "pointer" }}>
                      ← Go to My Batches
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "1fr 400px", gap: 36, alignItems: "start" }}>
                    {/* Left */}
                    <div>
                      {/* Alert — weaver-specific */}
                      <div style={{ background: "rgba(196,146,58,0.12)", border: `2px solid ${C.gold}`, borderRadius: 20, padding: "26px 30px", marginBottom: 36 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                          <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.burg, border: `2px solid ${C.gold}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <span style={{ fontFamily: F.d, fontSize: 18, fontWeight: 700, color: "#FFF" }}>RK</span>
                          </div>
                          <div>
                            <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 20, color: C.text }}>Ravi Kumar, your materials are ready</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                              <span style={{ fontFamily: F.m, fontSize: 14, color: C.burg }}>{pendingMaterialRecord.id}</span>
                              <span style={{ width: 3, height: 3, borderRadius: "50%", background: C.muted, display: "inline-block" }} />
                              <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>Issued {new Date(pendingMaterialRecord.issuedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ fontFamily: F.u, fontSize: 15, color: C.muted, lineHeight: 1.7 }}>
                          The admin has issued your materials. Please review the list carefully and sign below to officially confirm receipt.
                        </div>
                        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                          <div style={{ background: "rgba(30,102,64,0.10)", border: "1px solid rgba(30,102,64,0.22)", borderRadius: 8, padding: "8px 14px", display: "flex", alignItems: "center", gap: 6 }}>
                            <CheckCircle2 size={14} color={C.green} />
                            <span style={{ fontFamily: F.u, fontSize: 13, color: C.green, fontWeight: 500 }}>{pendingMaterialRecord.materials.length} material{pendingMaterialRecord.materials.length !== 1 ? "s" : ""} to confirm</span>
                          </div>
                          <div style={{ background: "rgba(107,26,42,0.08)", border: `1px solid ${C.bdr}`, borderRadius: 8, padding: "8px 14px", display: "flex", alignItems: "center", gap: 6 }}>
                            <Clock size={14} color={C.muted} />
                            <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>Signature required</span>
                          </div>
                        </div>
                      </div>

                      {/* Materials */}
                      <DSectionHeader label="Materials You Are Receiving" />
                      <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr 1fr" : "1fr 1fr 1fr", gap: 20, marginBottom: 36 }}>
                        {pendingMaterialRecord.materials.map((m, i) => (
                          <div key={i} style={{ background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 18, padding: "26px 22px", textAlign: "center" as const, boxShadow: "0 3px 16px rgba(44,24,16,0.07)" }}>
                            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(107,26,42,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>{materialTypeIcon(m.materialType)}</div>
                            <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 18, color: C.text, marginBottom: 10 }}>{m.materialType}{m.materialType === "Warp" && m.warpSubtype ? ` — ${m.warpSubtype}` : ""}</div>
                            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: C.gold, marginBottom: 8 }}>{m.quantity} {m.unit}</div>
                            <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginBottom: 6 }}>{m.materialType === "Jari" ? `${m.jariType} · ${m.jariGrade} · ${m.jariColor}` : (m.description || "")}</div>
                            <div style={{ fontFamily: F.m, fontSize: 11, color: C.muted }}>From batch: {m.grnBatchId}</div>
                          </div>
                        ))}
                      </div>

                      {/* Color Slip Preview */}
                      <DSectionHeader label="Check Your Color Slip" />
                      <div style={{ fontFamily: F.u, fontSize: 15, color: C.muted, marginBottom: 20 }}>Review the design you will be weaving before you sign.</div>
                      <div style={{ background: "linear-gradient(135deg, #E8D5B0 0%, #C9A86C 50%, #E8D5B0 100%)", borderRadius: 18, height: 220, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" as const, overflow: "hidden", marginBottom: 14, boxShadow: "0 6px 28px rgba(44,24,16,0.14)" }} onClick={() => setActive("designs")}>
                        <Flower2 size={90} color="rgba(107,26,42,0.18)" />
                        <div style={{ position: "absolute" as const, bottom: 16, right: 16, background: "rgba(0,0,0,0.50)", borderRadius: 10, padding: "8px 16px", display: "flex", alignItems: "center", gap: 7 }}>
                          <Eye size={16} color="#FFF" />
                          <span style={{ fontFamily: F.u, fontSize: 13, color: "#FFF", fontWeight: 500 }}>View Full Color Slip</span>
                        </div>
                      </div>
                      <div style={{ fontFamily: F.m, fontSize: 14, color: C.burg, textAlign: "center" as const }}>BKB-045 · Cream Zari Border Saree</div>
                    </div>

                    {/* Right: Signature panel (sticky) */}
                    <div style={{ position: "sticky" as const, top: 84 }}>
                      <div style={{ background: "#FFF", borderRadius: 20, border: `1px solid ${C.bdr}`, overflow: "hidden", boxShadow: "0 6px 32px rgba(44,24,16,0.12)" }}>
                        <div style={{ padding: "24px 28px", background: `linear-gradient(135deg, ${C.dark} 0%, #4A061B 100%)` }}>
                          {/* Weaver identity in signature panel */}
                          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, paddingBottom: 18, borderBottom: "1px solid rgba(255,255,255,0.10)" }}>
                            <div style={{ width: 52, height: 52, borderRadius: "50%", background: C.burg, border: `2px solid ${C.gold}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 3px 12px rgba(107,26,42,0.40)" }}>
                              <span style={{ fontFamily: F.d, fontSize: 18, fontWeight: 700, color: "#FFF" }}>RK</span>
                            </div>
                            <div>
                              <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 16, color: "#FFF", lineHeight: 1.2 }}>Ravi Kumar</div>
                              <div style={{ fontFamily: F.m, fontSize: 11, color: C.gold, marginTop: 3 }}>WVR-014 · Handloom Weaver</div>
                              <div style={{ fontFamily: F.u, fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>Pochampally, Telangana</div>
                            </div>
                          </div>
                          <div style={{ fontFamily: F.u, fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.40)", letterSpacing: 1.5, textTransform: "uppercase" as const, marginBottom: 8 }}>YOUR SIGNATURE</div>
                          <div style={{ fontFamily: F.d, fontSize: 22, fontWeight: 700, color: "#FFF" }}>Ravi, confirm your receipt</div>
                          <div style={{ fontFamily: F.u, fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 6 }}>Sign below to confirm {pendingMaterialRecord.id}</div>
                        </div>
                        <div style={{ padding: "28px" }}>
                          <div style={{ fontFamily: F.u, fontSize: 15, color: C.muted, lineHeight: 1.65, marginBottom: 24 }}>
                            Sign below to confirm you have received all materials listed. This creates a permanent record.
                          </div>

                          <button onClick={() => setSigMethod(sigMethod === "here" ? "none" : "here")} style={{ width: "100%", background: "#F8F4F0", border: `2px solid ${sigMethod === "here" ? C.burg : C.bdr}`, borderRadius: 14, padding: "16px 20px", cursor: "pointer", textAlign: "left" as const, marginBottom: 12, display: "flex", alignItems: "center", gap: 14 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: sigMethod === "here" ? C.burg : "rgba(107,26,42,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <Check size={18} color={sigMethod === "here" ? "#FFF" : C.burg} />
                            </div>
                            <div>
                              <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 16, color: C.text }}>Sign here on screen</div>
                              <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginTop: 2 }}>Draw your signature below</div>
                            </div>
                          </button>

                          {sigMethod === "here" && (
                            <div style={{ marginBottom: 16 }}>
                              <div style={{ border: `1.5px solid rgba(107,26,42,0.22)`, borderRadius: 14, overflow: "hidden", background: "#FFF" }}>
                                <SignatureCanvas onSigned={setHasSig} />
                              </div>
                            </div>
                          )}

                          <button onClick={() => setSigMethod(sigMethod === "remote" ? "none" : "remote")} style={{ width: "100%", background: "#F8F4F0", border: `2px solid ${sigMethod === "remote" ? C.burg : C.bdr}`, borderRadius: 14, padding: "16px 20px", cursor: "pointer", textAlign: "left" as const, marginBottom: 16, display: "flex", alignItems: "center", gap: 14 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: sigMethod === "remote" ? C.burg : "rgba(107,26,42,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <Send size={18} color={sigMethod === "remote" ? "#FFF" : C.burg} />
                            </div>
                            <div>
                              <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 16, color: C.text }}>Sign on your phone</div>
                              <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginTop: 2 }}>We'll send you a notification</div>
                            </div>
                          </button>

                          {sigMethod === "remote" && !requestSent && (
                            <button onClick={() => setRequestSent(true)} style={{ width: "100%", height: 50, border: `1.5px solid ${C.gold}`, background: "transparent", borderRadius: 999, fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.gold, cursor: "pointer", marginBottom: 16 }}>
                              Send Signature Request
                            </button>
                          )}
                          {sigMethod === "remote" && requestSent && (
                            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(30,102,64,0.08)", border: `1px solid ${C.green}`, borderRadius: 12, padding: "14px 18px", marginBottom: 16 }}>
                              <Check size={18} color={C.green} />
                              <span style={{ fontFamily: F.u, fontSize: 15, color: C.green, fontWeight: 600 }}>Request sent to your phone!</span>
                            </div>
                          )}

                          <div style={{ background: "#F8F4F0", borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
                            <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted, lineHeight: 1.6 }}>By confirming, you agree you have received all materials. This record is permanent.</span>
                          </div>
                          <button
                            onClick={() => {
                              if (!pendingMaterialRecord) return;
                              if ((sigMethod === "here" && hasSig) || (sigMethod === "remote" && requestSent)) {
                                updateSignatureStatus(pendingMaterialRecord.id, sigMethod === "remote" ? "remote" : "here");
                                setConfirmedRecord(pendingMaterialRecord);
                                setConfirmed(true);
                              }
                            }}
                            style={{ width: "100%", height: 56, background: (sigMethod === "here" && hasSig) || (sigMethod === "remote" && requestSent) ? C.green : "#C8C0B8", border: "none", borderRadius: 999, fontFamily: F.u, fontWeight: 700, fontSize: 17, color: "#FFF", cursor: (sigMethod === "here" && hasSig) || (sigMethod === "remote" && requestSent) ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                            <Check size={20} /> Confirm Material Receipt
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ════════ COLOR SLIP ════════ */}
          {!showNotifs && active === "designs" && (
            <>
              <DesktopHero
                bp={bp}
                breadcrumb="SINCE 1999 · WEAVER PORTAL · DESIGN REFERENCE"
                titleMain="Your Designs"
                titleSub="& Weaving Instructions"
                description="Design instructions assigned to your active batches."
                pills={myDesignCodes.map(code => ({ text: code }))}
                bgUrl={FABRIC_BG}
              />
              <div style={{ padding: isTablet ? "24px 28px 40px" : "40px 48px 56px" }}>
                {myDesignCodes.length === 0 ? (
                  <div style={{ padding: "60px 20px", textAlign: "center" as const, background: "#FFF", borderRadius: 20, border: `1px solid ${C.bdr}` }}>
                    <Palette size={32} color={C.muted} style={{ margin: "0 auto 14px" }} />
                    <div style={{ fontFamily: F.u, fontSize: 17, color: C.muted }}>No designs assigned yet. Check with your supervisor.</div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: isTablet ? "repeat(2,1fr)" : "repeat(3,1fr)", gap: 22 }}>
                    {myDesignCodes.map(code => {
                      const d = getDesign(code);
                      return (
                        <button key={code} onClick={() => openDesignCode(code)} style={{ background: "#FFF", borderRadius: 18, border: `1px solid ${C.bdr}`, overflow: "hidden", cursor: "pointer", boxShadow: "0 3px 14px rgba(44,24,16,0.07)", padding: 0, textAlign: "left" as const }}>
                          {d?.colorSlipPhoto ? (
                            <div style={{ height: 150, backgroundImage: `url(${d.colorSlipPhoto})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                          ) : (
                            <div style={{ height: 150, background: C.cream, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Flower2 size={38} color={C.muted} />
                            </div>
                          )}
                          <div style={{ padding: "16px 18px" }}>
                            <div style={{ fontFamily: F.m, fontSize: 13, color: C.burg, marginBottom: 5 }}>{code}</div>
                            <div style={{ fontFamily: F.u, fontSize: 15, fontWeight: 600, color: C.text }}>{d?.name || "—"}</div>
                            {d?.notesForWeaver && (
                              <div style={{ fontFamily: F.u, fontSize: 12.5, color: C.muted, marginTop: 8, lineHeight: 1.5 }}>{d.notesForWeaver}</div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ════════ WARP REQUEST ════════ */}
          {!showNotifs && active === "warp" && (
            <>
              <DesktopHero
                bp={bp}
                breadcrumb="SINCE 1999 · WEAVER PORTAL · WARP REQUEST"
                titleMain="Warp Request"
                titleSub="& Additional Materials"
                description="Request additional raw materials for your active batches. Warp requests are unlocked after submitting 50% of your batch."
                pills={[
                  { text: "BATCH-086 · 60% Complete · Unlocked", color: C.gold },
                  { text: "BATCH-089 · 50% Complete · Unlocked", color: C.gold },
                  { text: "2 of 3 Requests Approved" },
                ]}
                stats={[
                  { label: "BATCH-086 Progress", val: "3/5", sub: "60% complete — warp unlocked" },
                  { label: "BATCH-089 Progress", val: "4/8", sub: "50% complete — warp unlocked", highlight: true },
                  { label: "Total Requests Raised", val: "3", sub: "This month" },
                  { label: "Approval Rate", val: "67%", sub: "2 approved, 1 rejected" },
                ]}
                bgUrl={BG_IMAGE}
              />
              <div style={{ padding: isTablet ? "24px 28px 40px" : "40px 48px 56px" }}>
                {/* Batch selector */}
                <div style={{ display: "flex", gap: 14, marginBottom: 36 }}>
                  {(["086", "089"] as const).map(b => (
                    <button key={b} onClick={() => setWarpBatch(b)} style={{ padding: "12px 32px", borderRadius: 999, border: `2px solid ${C.burg}`, background: warpBatch === b ? C.burg : "transparent", color: warpBatch === b ? "#FFF" : C.burg, fontFamily: F.m, fontSize: 15, cursor: "pointer", fontWeight: 700, transition: "all 0.15s" }}>
                      BATCH-{b}
                    </button>
                  ))}
                </div>

                {warpSubmitted ? (
                  <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" as const, padding: "60px 48px", background: "#FFF", borderRadius: 24, border: `1px solid ${C.bdr}`, boxShadow: "0 4px 32px rgba(44,24,16,0.10)" }}>
                    <div style={{ width: 96, height: 96, borderRadius: "50%", background: "rgba(30,102,64,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px" }}>
                      <Check size={52} color={C.green} />
                    </div>
                    <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 36, color: C.text, marginBottom: 16 }}>Warp Request Sent!</div>
                    <div style={{ fontFamily: F.u, fontSize: 16, color: C.muted, lineHeight: 1.7, marginBottom: 36 }}>Your request has been sent to worker staff, admin, and superadmin. You will be notified when a decision is made.</div>
                    <button onClick={() => { setWarpSubmitted(false); setMaterials({ warp: false, resham: false, jari: false }); setAmounts({ warp: "", resham: "", jari: "" }); setReason(""); }} style={{ display: "block", width: "100%", height: 60, background: C.burg, border: "none", borderRadius: 999, fontFamily: F.u, fontWeight: 700, fontSize: 18, color: "#FFF", cursor: "pointer" }}>
                      ← Back to Warp Requests
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "1fr 380px", gap: 36, alignItems: "start" }}>
                    {/* Left: Form */}
                    <div>
                      {/* Unlock status */}
                      <div style={{ background: "rgba(30,102,64,0.08)", border: `2px solid ${C.green}`, borderRadius: 18, padding: "22px 28px", marginBottom: 32, display: "flex", alignItems: "center", gap: 18 }}>
                        <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.green, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Check size={28} color="#FFF" />
                        </div>
                        <div>
                          <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 20, color: C.green }}>Warp Request Unlocked for BATCH-{warpBatch}</div>
                          <div style={{ fontFamily: F.u, fontSize: 15, color: C.muted, marginTop: 4 }}>
                            You have submitted {warpBatch === "086" ? "3 of 5 (60%)" : "4 of 8 (50%)"} sarees — warp request is now available.
                          </div>
                        </div>
                      </div>

                      <DSectionHeader label="Request Additional Materials" />
                      <div style={{ background: "#FFF", borderRadius: 20, border: `1px solid ${C.bdr}`, padding: "32px", boxShadow: "0 4px 20px rgba(44,24,16,0.08)", marginBottom: 24 }}>
                        <div style={{ display: "inline-block", background: "rgba(107,26,42,0.08)", color: C.burg, borderRadius: 999, padding: "8px 20px", fontFamily: F.m, fontSize: 16, marginBottom: 28 }}>BATCH-{warpBatch}</div>

                        <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 18, color: C.text, marginBottom: 20 }}>What material do you need?</div>
                        <div style={{ marginBottom: 28 }}>
                          {(["warp", "resham", "jari"] as const).map((mat, i) => (
                            <label key={mat} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 0", cursor: "pointer", borderBottom: mat !== "jari" ? `1px solid ${C.bdr}` : "none" }}>
                              <div onClick={() => setMaterials(m => ({ ...m, [mat]: !m[mat] }))} style={{ width: 28, height: 28, borderRadius: 8, border: `2px solid ${materials[mat] ? C.burg : C.bdr}`, background: materials[mat] ? C.burg : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
                                {materials[mat] && <Check size={16} color="#FFF" />}
                              </div>
                              <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 17, color: C.text }}>
                                {mat === "warp" ? "More Warp" : mat === "resham" ? "More Resham" : "More Jari"}
                              </span>
                            </label>
                          ))}
                        </div>

                        {(["warp", "resham", "jari"] as const).filter(m => materials[m]).map(mat => (
                          <div key={mat} style={{ marginBottom: 20 }}>
                            <label style={{ display: "block", fontFamily: F.u, fontWeight: 600, fontSize: 16, color: C.text, marginBottom: 10 }}>
                              {mat === "warp" ? "Warp amount (kg):" : mat === "resham" ? "Resham amount and color:" : "Jari amount (reels):"}
                            </label>
                            <input value={amounts[mat]} onChange={e => setAmounts(a => ({ ...a, [mat]: e.target.value }))} placeholder={mat === "warp" ? "e.g. 3 kg" : mat === "resham" ? "e.g. 500g Red" : "e.g. 4 reels"}
                              style={{ width: "100%", height: 56, background: C.inp, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: "0 18px", fontFamily: F.m, fontSize: 16, color: C.text, outline: "none", boxSizing: "border-box" as const }} />
                          </div>
                        ))}

                        <div>
                          <label style={{ display: "block", fontFamily: F.u, fontWeight: 600, fontSize: 16, color: C.text, marginBottom: 10 }}>Why do you need more material?</label>
                          <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Example: Extra sarees needed for a large order" rows={3}
                            style={{ width: "100%", minHeight: 110, background: C.inp, border: `1px solid ${C.bdr}`, borderRadius: 14, padding: "14px 18px", fontFamily: F.u, fontSize: 16, color: C.text, outline: "none", resize: "none", boxSizing: "border-box" as const }} />
                        </div>
                      </div>

                      <button onClick={() => (materials.warp || materials.resham || materials.jari) ? setWarpSubmitted(true) : undefined}
                        style={{ width: "100%", height: 60, background: C.burg, border: "none", borderRadius: 999, fontFamily: F.u, fontWeight: 700, fontSize: 18, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, boxShadow: "0 4px 20px rgba(107,26,42,0.35)" }}>
                        <Send size={22} /> Send Warp Request
                      </button>
                    </div>

                    {/* Right: Rules + History */}
                    <div style={{ display: "flex", flexDirection: "column" as const, gap: 22 }}>
                      <div style={{ background: "#FFF8E8", border: `1px solid rgba(196,146,58,0.28)`, borderRadius: 18, padding: "24px 26px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                          <Info size={22} color={C.gold} />
                          <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 18, color: C.text }}>System Rule</div>
                        </div>
                        <div style={{ fontFamily: F.u, fontSize: 15, color: C.muted, lineHeight: 1.75 }}>You can raise a warp request only after submitting 50% of your batch. This ensures enough progress before more materials are allocated.</div>
                      </div>

                      <div style={{ background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 20px rgba(44,24,16,0.08)" }}>
                        <div style={{ padding: "20px 26px", borderBottom: `1px solid ${C.bdr}`, background: "#FAFAF8" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 5, height: 22, background: C.burg, borderRadius: 3 }} />
                            <span style={{ fontFamily: F.u, fontSize: 16, fontWeight: 700, color: C.text }}>Previous Requests</span>
                          </div>
                        </div>
                        {[
                          { date: "10 Jun 2026", mat: "3 kg Warp", status: "Approved", ok: true },
                          { date: "05 Jun 2026", mat: "Resham Red 500g", status: "Rejected", ok: false },
                          { date: "01 Jun 2026", mat: "2 kg Warp", status: "Approved", ok: true },
                        ].map((r, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 26px", borderBottom: i < 2 ? `1px solid rgba(107,26,42,0.06)` : "none" }}>
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: r.ok ? C.green : C.crim, flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontFamily: F.m, fontSize: 13, color: C.muted, marginBottom: 3 }}>{r.date}</div>
                              <div style={{ fontFamily: F.u, fontSize: 16, fontWeight: 500, color: C.text }}>{r.mat}</div>
                            </div>
                            <span style={{ fontFamily: F.u, fontSize: 14, fontWeight: 700, color: r.ok ? C.green : C.crim }}>{r.ok ? "✓ Approved" : "✗ Rejected"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ════════ PAYMENTS ════════ */}
          {!showNotifs && active === "payments" && (
            <>
              <DesktopHero
                bp={bp}
                breadcrumb="SINCE 1999 · WEAVER PORTAL · MY EARNINGS"
                titleMain="My Payments"
                titleSub="& Earnings Ledger"
                description="Track your monthly earnings, deductions, and payment history. Payments are processed at the end of each month."
                pills={[
                  { text: "May 2026 · Current Month" },
                  { text: "₹7,650 Net — Pending Payment", color: C.gold },
                  { text: "Payment by Month End" },
                ]}
                alertBadge="Payment Pending"
                stats={[
                  { label: "Sarees Produced", val: "18", sub: "17 passed QC this month" },
                  { label: "Gross Making Charges", val: "₹8,100", sub: "Before any deductions", highlight: true },
                  { label: "Total Deductions", val: "₹450", sub: "Thread break defect" },
                  { label: "Net Amount to Pay", val: "₹7,650", sub: "Expected by end of June" },
                ]}
                bgUrl={FABRIC_BG}
              />
              <div style={{ padding: isTablet ? "24px 28px 40px" : "40px 48px 56px" }}>
                <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "1fr 360px", gap: 36, alignItems: "start" }}>
                  {/* Left: Deductions + History table */}
                  <div>
                    <DSectionHeader label="Deductions This Month" />
                    <div style={{ fontFamily: F.u, fontSize: 15, color: C.muted, marginBottom: 22 }}>Amounts deducted from your gross making charges this month.</div>

                    <div style={{ background: "#FFF", border: `1px solid ${C.bdr}`, borderLeft: `6px solid ${C.crim}`, borderRadius: 20, padding: "26px 28px", boxShadow: "0 4px 20px rgba(44,24,16,0.08)", marginBottom: 40 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                        <div>
                          <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 20, color: C.crim }}>Defective Saree Deduction</div>
                          <div style={{ fontFamily: F.m, fontSize: 15, color: C.burg, marginTop: 6 }}>PADMA-L1-004</div>
                        </div>
                        <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 36, color: C.crim }}>₹450</div>
                      </div>
                      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
                        <span style={{ background: "rgba(192,57,43,0.10)", color: C.crim, borderRadius: 999, padding: "5px 14px", fontFamily: F.m, fontSize: 13 }}>Thread Break</span>
                        <span style={{ fontFamily: F.u, fontSize: 14, color: C.muted }}>QC Date: 10 Jun 2026</span>
                      </div>
                      <div style={{ fontFamily: F.u, fontStyle: "italic", fontSize: 14, color: C.muted }}>Defect photo was sent to you via WhatsApp.</div>
                    </div>

                    <DSectionHeader label="Payment History" link="See All →" />
                    <div style={{ background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 20, overflow: isTablet ? "auto" : "hidden", boxShadow: "0 4px 20px rgba(44,24,16,0.08)" }}>
                      <div style={{ minWidth: isTablet ? 560 : undefined }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", padding: "14px 26px", borderBottom: `1px solid ${C.bdr}`, background: "#FAFAF8" }}>
                          {["Month", "Sarees", "Amount", "UTR Reference"].map(h => (
                            <div key={h} style={{ fontFamily: F.u, fontSize: 13, fontWeight: 700, color: C.muted, letterSpacing: 0.4 }}>{h}</div>
                          ))}
                        </div>
                        {[
                          { month: "Apr 2026", sarees: "15 sarees", amount: "₹6,300", utr: "UTR202604301122" },
                          { month: "Mar 2026", sarees: "12 sarees", amount: "₹5,040", utr: "UTR202603281456" },
                          { month: "Feb 2026", sarees: "18 sarees", amount: "₹7,560", utr: "UTR202602271234" },
                        ].map((p, i) => (
                          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", padding: "20px 26px", borderBottom: i < 2 ? `1px solid rgba(107,26,42,0.06)` : "none", alignItems: "center" }}>
                            <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 16, color: C.text }}>{p.month}</div>
                            <div style={{ fontFamily: F.u, fontSize: 15, color: C.muted }}>{p.sarees}</div>
                            <div style={{ fontFamily: F.m, fontWeight: 700, fontSize: 18, color: C.gold }}>{p.amount}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <Check size={15} color={C.green} />
                              <span style={{ fontFamily: F.m, fontSize: 12, color: C.muted }}>{p.utr.slice(0, 14)}…</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Trend + payout */}
                  <div style={{ display: "flex", flexDirection: "column" as const, gap: 22 }}>
                    {/* Payout card */}
                    <div style={{ background: `linear-gradient(135deg, ${C.dark} 0%, #4A061B 100%)`, borderRadius: 20, padding: "30px 28px", boxShadow: "0 6px 28px rgba(61,14,26,0.22)" }}>
                      <div style={{ fontFamily: F.u, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.40)", letterSpacing: 1.4, textTransform: "uppercase" as const, marginBottom: 12 }}>THIS MONTH'S PAYOUT</div>
                      <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 56, color: C.gold, lineHeight: 1, marginBottom: 10 }}>₹7,650</div>
                      <div style={{ fontFamily: F.u, fontSize: 15, color: "rgba(255,255,255,0.55)", marginBottom: 20 }}>Net amount after deductions</div>
                      <div style={{ display: "inline-block", background: "rgba(196,146,58,0.22)", border: `1px solid ${C.gold}`, borderRadius: 999, padding: "8px 18px", fontFamily: F.m, fontSize: 13, color: C.gold }}>
                        Payment by end of June 2026
                      </div>
                    </div>

                    {/* Earning trend */}
                    <div style={{ background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 20, padding: "26px 28px", boxShadow: "0 4px 20px rgba(44,24,16,0.08)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
                        <TrendingUp size={20} color={C.burg} />
                        <span style={{ fontFamily: F.u, fontSize: 17, fontWeight: 700, color: C.text }}>Earning Trend</span>
                      </div>
                      {[
                        { month: "Feb 2026", amt: 7560, pct: 95 },
                        { month: "Mar 2026", amt: 5040, pct: 63 },
                        { month: "Apr 2026", amt: 6300, pct: 79 },
                        { month: "May 2026", amt: 7650, pct: 96 },
                      ].map((e, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                          <span style={{ fontFamily: F.m, fontSize: 13, color: C.muted, width: 68, flexShrink: 0 }}>{e.month}</span>
                          <div style={{ flex: 1, height: 12, background: "rgba(107,26,42,0.08)", borderRadius: 999, overflow: "hidden" }}>
                            <div style={{ width: `${e.pct}%`, height: "100%", background: C.gold, borderRadius: 999 }} />
                          </div>
                          <span style={{ fontFamily: F.m, fontSize: 15, fontWeight: 700, color: C.text, width: 56, textAlign: "right" as const }}>₹{(e.amt / 1000).toFixed(1)}k</span>
                        </div>
                      ))}
                    </div>

                    {/* Schedule */}
                    <div style={{ background: "#F0FFF4", border: `1px solid rgba(30,102,64,0.22)`, borderRadius: 18, padding: "22px 26px" }}>
                      <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 16, color: C.green, marginBottom: 10 }}>Payment Schedule</div>
                      <div style={{ fontFamily: F.u, fontSize: 15, color: C.muted, lineHeight: 1.7 }}>Payments are processed at month end. You'll receive a WhatsApp message and in-app notification when your payment is credited.</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {viewDesign && <DesignCodeCard design={viewDesign} onClose={() => setViewDesign(null)} />}
      </AnimatePresence>

    </div>
  );
}

// ─── Main Export ────────────────────────────────────────────────────────────
export function WeaverPortal({ onBack }: { onBack?: () => void }) {
  const { isMobile, w } = useResponsive();
  const bp: "tablet" | "desktop" = w >= 1024 ? "desktop" : "tablet";

  return (
    <>
      <style>{`html, body { overflow-x: hidden; max-width: 100%; }`}</style>
      {isMobile
        ? <MobileWeaverPortal onBack={onBack} />
        : <DesktopWeaverPortal onBack={onBack} bp={bp} />}
    </>
  );
}
