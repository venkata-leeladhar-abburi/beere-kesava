
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import { createPortal } from "react-dom";
import { useResponsive } from "../../../../app/components/useResponsive";
import { useBatches, SareeRow } from "../../../production/contexts/BatchContext";
import { useDesignLibrary, DesignEntry } from "../../../../app/components/DesignLibraryContext";
import { DesignCodeCard } from "../../../../app/components/DesignLibraryPage";
import { useMaterialIssue, MaterialIssueRecord, JARI_REEL_GRAMS } from "../../../materials/contexts/MaterialIssueContext";
import { useWeaverPayments } from "../../../../app/components/WeaverPaymentsContext";
import { useAuth } from "../../../../contexts/AuthContext";
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
import { imgBKLogo } from "../../../../app/constants/weaverImages";

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

export type PageId = "batches" | "confirm" | "designs" | "warp" | "payments" | "notifications";

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
  const BG = d?.colorSlipPhoto || "https://images.unsplash.com/photo-1619239635762-8132f6dba51c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800";
  const [showGraphModal, setShowGraphModal] = useState(false);

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

        {d?.designGraph && (
          <div style={{ background: "#FAFAF8", border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
            <div style={{ fontFamily: F.m, fontSize: 9, color: C.muted, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 6 }}>DESIGN GRAPH DRAWING</div>
            <img src={d.designGraph} alt="Design Graph Drawing" style={{ width: "100%", maxHeight: 120, objectFit: "cover", borderRadius: 8, cursor: "pointer", border: `1px solid ${C.bdr}` }} onClick={() => setShowGraphModal(true)} />
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1, background: d?.hasGraph ? "rgba(30,102,64,0.08)" : C.cream, border: `1px solid ${d?.hasGraph ? "rgba(30,102,64,0.20)" : C.bdr}`, borderRadius: 10, padding: "8px 12px", display: "flex", alignItems: "center", gap: 7, cursor: d?.designGraph ? "pointer" : "default" }} onClick={() => d?.designGraph && setShowGraphModal(true)}>
            <Layers size={13} color={d?.hasGraph ? C.green : C.muted} />
            <div>
              <div style={{ fontFamily: F.m, fontSize: 9, color: C.muted, letterSpacing: "0.8px", textTransform: "uppercase" as const }}>DESIGN GRAPH</div>
              <div style={{ fontFamily: F.u, fontSize: 12, color: d?.hasGraph ? C.green : C.muted, fontWeight: 600 }}>{d?.hasGraph ? "View Graph ✓" : "Not uploaded"}</div>
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

      {/* Graph Modal overlay if clicked */}
      <AnimatePresence>
        {showGraphModal && d?.designGraph && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setShowGraphModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }} onClick={e => e.stopPropagation()}>
              <img src={d.designGraph} alt="Design Graph Drawing" style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain", borderRadius: 12, border: "2px solid rgba(255,255,255,0.15)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                <span style={{ fontFamily: F.u, color: "#FFF", fontSize: 14, fontWeight: 600 }}>{d.code} · {d.name} — Design Graph Drawing</span>
                <button onClick={() => setShowGraphModal(false)} style={{ background: C.burg, border: "none", color: "#FFF", fontFamily: F.u, fontWeight: 600, padding: "8px 18px", borderRadius: 8, cursor: "pointer" }}>Close Reference</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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

// ─── Materials Received History card — shows a full handover record, with inline signing for pending ones ──
function MaterialHistoryCard({ r, isTablet }: { r: MaterialIssueRecord; isTablet: boolean }) {
  const { updateSignatureStatus } = useMaterialIssue();
  const [sigMethod, setSigMethod] = useState<"none" | "here" | "remote">("none");
  const [hasSig, setHasSig] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const isPending = r.status === "pending-signature";
  const canConfirm = (sigMethod === "here" && hasSig) || (sigMethod === "remote" && requestSent);

  const handleConfirm = () => {
    if (!canConfirm) return;
    updateSignatureStatus(r.id, sigMethod === "remote" ? "remote" : "here");
  };

  return (
    <div style={{ background: "#FFF", border: `1px solid ${isPending ? C.gold : C.bdr}`, borderRadius: 18, padding: "22px 26px", boxShadow: "0 3px 16px rgba(44,24,16,0.06)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap" as const, gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" as const }}>
          <span style={{ fontFamily: F.m, fontWeight: 700, fontSize: 14, color: C.burg, background: "rgba(107,26,42,0.08)", borderRadius: 8, padding: "4px 10px" }}>{r.id}</span>
          {r.batchId && (
            <span style={{ fontFamily: F.m, fontWeight: 700, fontSize: 13, color: C.gold, background: "rgba(196,146,58,0.12)", borderRadius: 8, padding: "4px 10px" }}>{r.batchId}</span>
          )}
          <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>{new Date(r.issuedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
        </div>
        {r.status === "signed" ? (
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.green }}>
            <Check size={14} color={C.green} /> Signed
          </span>
        ) : isPending ? (
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.gold }}>
            <Clock size={14} color={C.gold} /> Pending
          </span>
        ) : (
          <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.muted }}>Cancelled</span>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : `repeat(${Math.min(r.materials.length, 3)}, 1fr)`, gap: 10, marginBottom: 14 }}>
        {r.materials.map((m, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: "#FAFAF8", border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "10px 14px" }}>
            <div>
              <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 13, color: C.text }}>{m.materialType}{m.materialType === "Warp" && m.warpSubtype ? ` — ${m.warpSubtype}` : ""}</div>
              <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{m.materialType === "Jari" ? `${m.jariType} · ${m.jariGrade} · ${m.jariColor}` : (m.description || "")}</div>
            </div>
            <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
              <div style={{ fontFamily: F.m, fontWeight: 700, fontSize: 13, color: C.burg }}>{m.quantity} {m.unit}</div>
              <div style={{ fontFamily: F.m, fontSize: 10, color: C.muted, background: C.cream, borderRadius: 6, padding: "1px 6px", marginTop: 3, display: "inline-block" }}>{m.grnBatchId}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontFamily: F.u, fontSize: 12.5, color: C.muted }}>Issued by {r.issuedBy}{r.signatureTimestamp ? ` · Signed on ${new Date(r.signatureTimestamp).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}` : ""}</div>

      {/* Inline signing — collect the weaver's signature right on this card, on-screen or via a remote request to their phone */}
      {isPending && (
        <div style={{ marginTop: 18, paddingTop: 18, borderTop: `1px dashed ${C.bdr}` }}>
          <div style={{ fontFamily: F.m, fontSize: 10, color: C.muted, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 10 }}>Collect Your Signature</div>
          <div style={{ display: "flex", flexDirection: isTablet ? "column" as const : "row" as const, gap: 10, marginBottom: sigMethod !== "none" ? 12 : 0 }}>
            <button onClick={() => setSigMethod(sigMethod === "here" ? "none" : "here")} style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, background: "#F8F4F0", border: `1.5px solid ${sigMethod === "here" ? C.burg : C.bdr}`, borderRadius: 12, padding: "12px 16px", cursor: "pointer", textAlign: "left" as const }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: sigMethod === "here" ? C.burg : "rgba(107,26,42,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Pencil size={15} color={sigMethod === "here" ? "#FFF" : C.burg} />
              </div>
              <div>
                <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13.5, color: C.text }}>Sign here on this screen</div>
                <div style={{ fontFamily: F.u, fontSize: 11.5, color: C.muted }}>Draw your signature now</div>
              </div>
            </button>
            <button onClick={() => setSigMethod(sigMethod === "remote" ? "none" : "remote")} style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, background: "#F8F4F0", border: `1.5px solid ${sigMethod === "remote" ? C.burg : C.bdr}`, borderRadius: 12, padding: "12px 16px", cursor: "pointer", textAlign: "left" as const }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: sigMethod === "remote" ? C.burg : "rgba(107,26,42,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Send size={15} color={sigMethod === "remote" ? "#FFF" : C.burg} />
              </div>
              <div>
                <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13.5, color: C.text }}>Send to my phone</div>
                <div style={{ fontFamily: F.u, fontSize: 11.5, color: C.muted }}>Sign remotely on your own device</div>
              </div>
            </button>
          </div>

          {sigMethod === "here" && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ border: `1.5px solid rgba(107,26,42,0.22)`, borderRadius: 14, overflow: "hidden", background: "#FFF" }}>
                <SignatureCanvas onSigned={setHasSig} />
              </div>
            </div>
          )}

          {sigMethod === "remote" && !requestSent && (
            <button onClick={() => setRequestSent(true)} style={{ width: "100%", height: 44, border: `1.5px solid ${C.gold}`, background: "transparent", borderRadius: 999, fontFamily: F.u, fontWeight: 600, fontSize: 13.5, color: C.gold, cursor: "pointer", marginBottom: 12 }}>
              Send Signature Request to My Phone
            </button>
          )}
          {sigMethod === "remote" && requestSent && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(30,102,64,0.08)", border: `1px solid ${C.green}`, borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
              <Check size={14} color={C.green} />
              <span style={{ fontFamily: F.u, fontSize: 12.5, color: C.green, fontWeight: 600 }}>Request sent to your phone!</span>
            </div>
          )}

          {sigMethod !== "none" && (
            <button
              onClick={handleConfirm}
              disabled={!canConfirm}
              style={{ width: "100%", height: 46, background: canConfirm ? C.green : "#C8C0B8", border: "none", borderRadius: 999, fontFamily: F.u, fontWeight: 700, fontSize: 14, color: "#FFF", cursor: canConfirm ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Check size={16} /> Confirm Material Receipt
            </button>
          )}
        </div>
      )}
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


// ─── PAGE 01 — MY BATCHES ──────────────────────────────────────────────────
export type MyBatchEntry = { batchId: string; status: string; dueDate: string; rows: SareeRow[]; myRows: SareeRow[]; totalCount: number; createdAt: string; updatedAt: string; };

// Active batch card with inline design/type expand (no modal)
function MobileBatchCard({ b, idx }: { b: MyBatchEntry; idx: number }) {
  const [expandedType, setExpandedType] = useState<string | null>(null);

  const isActive = b.status === "active";
  const borderColor = idx % 2 === 0 ? C.burg : C.gold;
  const myCount = b.myRows.length;
  const readyCount = b.myRows.filter(r => r.sareeId).length;
  const pendingCount = myCount - readyCount;
  const qcPassedCount = b.myRows.filter(r => r.qcPassed === true).length;
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
function CompletedBatchCard({ b }: { b: MyBatchEntry }) {
  const produced = b.myRows.length;
  return (
    <div style={{ margin: "0 16px 12px", background: C.white, borderRadius: 18, border: `1px solid ${C.bdr}`, overflow: "hidden", boxShadow: "0 2px 16px rgba(44,24,16,0.07)" }}>
      {/* Color band + batch id */}
      <div style={{ height: 56, background: "linear-gradient(135deg, #1E6640 0%, #2D9640 100%)", display: "flex", alignItems: "center", padding: "0 16px", gap: 10, position: "relative" as const }}>
        <div style={{ position: "absolute" as const, inset: 0, background: "linear-gradient(to right, rgba(26,5,12,0.45) 0%, transparent 70%)" }} />
        <div style={{ position: "relative" as const, display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
          <Flower2 size={18} color="rgba(255,255,255,0.70)" />
          <span style={{ fontFamily: F.m, fontWeight: 700, fontSize: 14, color: "#FFF" }}>{b.batchId}</span>
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

export type BatchQuickFilter = "all" | "active" | "qc-pending" | "completed" | "draft";
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

export type WNPriority = "critical" | "warning" | "info" | "success";
export type WNCategory = "batch" | "payment" | "warp";

export interface WeaverNotif {
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

export type WNFilter = "all" | WNPriority;
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

const BG_IMAGE = "https://images.unsplash.com/photo-1707978932202-751b08324daf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1400";
const FABRIC_BG = "https://images.unsplash.com/photo-1569909115134-a0426936c879?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1400";

export interface HeroStatItem { label: string; val: string; sub: string; highlight?: boolean }
export interface HeroPill { text: string; color?: string }
export interface DesktopHeroProps {
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


export {
  C,
  F,
  SAREE_TYPE_RATES,
  DesignDetailCard,
  SareeTypeDetailCard,
  SectionTitle,
  Card,
  ProgressBar,
  StatusBadge,
  SignatureCanvas,
  MaterialHistoryCard,
  HeroHeader,
  DesignCodeTileGrid,
  MobileBatchCard,
  CompletedBatchCard,
  BATCH_QUICK_FILTERS,
  BatchQuickFilterPills,
  CURRENT_WEAVER_ID,
  CURRENT_MONTH_LABEL,
  GROSS_CHARGES,
  TOTAL_DEDUCTIONS,
  NET_AMOUNT,
  PAST_MONTHS,
  WN_T,
  WN_G,
  WN_EASE,
  WN_NUM,
  WN_DATA,
  WN_PRIORITY,
  WN_CATEGORY,
  WN_FILTERS,
  WNFadeUp,
  BATCH_LIST,
  BATCH_STATUS_CFG,
  BatchCard,
  FadeUpBatch,
  BG_IMAGE,
  FABRIC_BG
};

export type Tab5 = "batches" | "confirm" | "warp" | "payments" | "notifications";
export interface WeaverBatch { id: string; design: string; name: string; status: "active" | "completed" | "qc"; done: number; total: number; pct: number; passRate: number; amount: string | null; month: string; gradient: string; accentColor: string; }
