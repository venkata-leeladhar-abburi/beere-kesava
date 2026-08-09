
import { brand, fonts, semantic } from '@/design-system/tokens';
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import { createPortal } from "react-dom";
import * as Dialog from "@radix-ui/react-dialog";
import { useResponsive } from "../../../../hooks/useResponsive";
import { Button, IconButton } from "../../../../shared/ui/primitives";
import { Modal } from "../../../../shared/ui/overlay";
import { useBatches, SareeRow } from "../../../production/contexts/BatchContext";
import { useDesignLibrary, DesignEntry } from "../../../design-library/contexts/DesignLibraryContext";
import { DesignCodeCard } from "../../../design-library/components/DesignLibraryPage";
import { useMaterialIssue, MaterialIssueRecord, JARI_REEL_GRAMS } from "../../../materials/contexts/MaterialIssueContext";
import { useWeaverPayments } from "../../../weavers/contexts/WeaverPaymentsContext";
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
import { MaterialHistoryCard, SignatureCanvas } from "./WeaverMaterialHistoryCard";
import {
  MobileBatchCard, CompletedBatchCard, BATCH_QUICK_FILTERS, BatchQuickFilterPills
} from "./WeaverMobileBatchCard";
export type { MyBatchEntry, BatchQuickFilter } from "./WeaverMobileBatchCard";
import {
  WN_T, WN_G, WN_EASE, WN_NUM, WN_DATA, WN_PRIORITY, WN_CATEGORY, WN_FILTERS, WNFadeUp,
  BATCH_STATUS_CFG, BatchCard, FadeUpBatch, BG_IMAGE, FABRIC_BG,
} from "./WeaverBatchNotifData";
import type { WeaverBatch } from "./WeaverBatchNotifData";
export type { WNPriority, WNCategory, WNFilter, WeaverNotif, WeaverBatch } from "./WeaverBatchNotifData";
export { SignatureCanvas };

// ─── Design Tokens ─────────────────────────────────────────────────────────

const C = {
  burg: brand.burgundy[900],
  dark: brand.burgundy[950],
  gold: brand.gold[500],
  green: semantic.text.success,
  crim: semantic.text.danger,
  text: semantic.text.primary,
  muted: semantic.text.tertiary,
  bdr: "rgba(139,26,46,0.12)",
  cream: semantic.surface.canvas,
  inp: "#FFF8E7",
  white: "#FFFFFF",
};
const F = {
  d: fonts.display,
  u: fonts.ui,
  m: fonts.code,
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
        <IconButton icon={X} label="Close" variant="ghost" onClick={onClose} className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/45 text-white" />
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
              <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 3 }}>{x.label}</div>
              <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 13, color: C.text }}>{x.val}</div>
            </div>
          ))}
        </div>

        {d?.desc && (
          <div style={{ background: "#FAFAF8", border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
            <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 4 }}>DESCRIPTION</div>
            <div style={{ fontFamily: F.u, fontSize: 13, color: C.text, lineHeight: 1.5 }}>{d.desc}</div>
          </div>
        )}

        {d?.notesForWeaver && (
          <div style={{ background: "rgba(196,146,58,0.08)", border: `1px solid rgba(196,146,58,0.25)`, borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
            <div style={{ fontFamily: F.m, fontSize: 12, color: C.gold, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 4 }}>NOTES FOR YOU</div>
            <div style={{ fontFamily: F.u, fontSize: 13, color: C.text, lineHeight: 1.5 }}>{d.notesForWeaver}</div>
          </div>
        )}

        {d?.designGraph && (
          <div style={{ background: "#FAFAF8", border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
            <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 6 }}>DESIGN GRAPH DRAWING</div>
            <img src={d.designGraph} alt="Design Graph Drawing" style={{ width: "100%", maxHeight: 120, objectFit: "cover", borderRadius: 8, cursor: "pointer", border: `1px solid ${C.bdr}` }} onClick={() => setShowGraphModal(true)} />
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1, background: d?.hasGraph ? "rgba(30,102,64,0.08)" : C.cream, border: `1px solid ${d?.hasGraph ? "rgba(30,102,64,0.20)" : C.bdr}`, borderRadius: 10, padding: "8px 12px", display: "flex", alignItems: "center", gap: 7, cursor: d?.designGraph ? "pointer" : "default" }} onClick={() => d?.designGraph && setShowGraphModal(true)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (() => d?.designGraph && setShowGraphModal(true))?.(); } }}>
            <Layers size={13} color={d?.hasGraph ? C.green : C.muted} />
            <div>
              <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, letterSpacing: "0.8px", textTransform: "uppercase" as const }}>DESIGN GRAPH</div>
              <div style={{ fontFamily: F.u, fontSize: 12, color: d?.hasGraph ? C.green : C.muted, fontWeight: 600 }}>{d?.hasGraph ? "View Graph ✓" : "Not uploaded"}</div>
            </div>
          </div>
          <div style={{ flex: 1, background: d?.hasColorSlip ? "rgba(30,102,64,0.08)" : C.cream, border: `1px solid ${d?.hasColorSlip ? "rgba(30,102,64,0.20)" : C.bdr}`, borderRadius: 10, padding: "8px 12px", display: "flex", alignItems: "center", gap: 7 }}>
            <Palette size={13} color={d?.hasColorSlip ? C.green : C.muted} />
            <div>
              <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, letterSpacing: "0.8px", textTransform: "uppercase" as const }}>COLOR SLIP</div>
              <div style={{ fontFamily: F.u, fontSize: 12, color: d?.hasColorSlip ? C.green : C.muted, fontWeight: 600 }}>{d?.hasColorSlip ? "Uploaded ✓" : "Not uploaded"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Graph Modal overlay if clicked */}
      <Modal open={showGraphModal && !!d?.designGraph} onOpenChange={o => { if (!o) setShowGraphModal(false); }} size="lg">
        <Dialog.Title className="sr-only">{d?.code} · {d?.name} — Design Graph Drawing</Dialog.Title>
        <div style={{ padding: 20 }}>
          {d?.designGraph && (
            <>
              <img src={d.designGraph} alt="Design Graph Drawing" style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain", borderRadius: 12, border: "2px solid rgba(0,0,0,0.08)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                <span style={{ fontFamily: F.u, color: C.text, fontSize: 14, fontWeight: 600 }}>{d.code} · {d.name} — Design Graph Drawing</span>
                <Button onClick={() => setShowGraphModal(false)} variant="primary" size="sm" className="text-white bg-[#6E0F2D] hover:bg-[#6E0F2D]">Close Reference</Button>
              </div>
            </>
          )}
        </div>
      </Modal>
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
          <span style={{ fontFamily: F.m, fontSize: 12, color: "rgba(255,255,255,0.55)", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 6, padding: "3px 9px" }}>{typeCode}</span>
          <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 14, color: "#FFF" }}>{typeName}</span>
        </div>
        <IconButton icon={X} label="Close" variant="ghost" onClick={onClose} className="w-7 h-7 rounded-full bg-white/10 text-white" />
      </div>

      <div style={{ padding: "14px 16px 16px" }}>
        {r?.description && <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginBottom: 14, lineHeight: 1.5 }}>{r.description}</div>}

        {/* Making charge + weight */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div style={{ background: "rgba(196,146,58,0.08)", border: `1px solid rgba(196,146,58,0.22)`, borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontFamily: F.m, fontSize: 12, color: C.gold, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 4 }}>MAKING CHARGE</div>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 24, color: C.gold }}>₹{r?.charge ?? "—"}</div>
            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 2 }}>per saree</div>
          </div>
          <div style={{ background: C.cream, borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 4 }}>STANDARD WEIGHT</div>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 24, color: C.text }}>{r?.stdWeight ?? "—"}g</div>
            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 2 }}>grams</div>
          </div>
        </div>

        {/* Prices */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
          <div style={{ background: "#FAFAF8", border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 3 }}>RETAIL PRICE</div>
            <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.text }}>₹{r ? Number(r.retail).toLocaleString("en-IN") : "—"}</div>
          </div>
          <div style={{ background: "#FAFAF8", border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 3 }}>WHOLESALE PRICE</div>
            <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.text }}>₹{r ? Number(r.wholesale).toLocaleString("en-IN") : "—"}</div>
          </div>
        </div>

        {/* Material breakdown */}
        {r && (
          <div>
            <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 8 }}>MATERIAL WEIGHT BREAKDOWN</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[
                { label: "WARP",   val: `${r.warpWeight}g` },
                { label: "RESHAM", val: `${r.reshamWeight}g` },
                { label: "JARI",   val: `${r.jariWeight} reels` },
              ].map(m => (
                <div key={m.label} style={{ background: C.cream, borderRadius: 10, padding: "10px 12px", textAlign: "center" as const }}>
                  <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, letterSpacing: "0.8px", textTransform: "uppercase" as const, marginBottom: 4 }}>{m.label}</div>
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
        <Button variant="link" onClick={onLink} className="p-0 text-[13px] text-[#C89B47]">
          {link}
        </Button>
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
    <div style={{ width: "100%", height, background: "rgba(110,15,45,0.10)", borderRadius: 999, overflow: "hidden" }}>
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

// MaterialHistoryCard is imported from WeaverMaterialHistoryCard.tsx

// ─── Hero Header ────────────────────────────────────────────────────────────

function HeroHeader({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) {
  return (
    <div style={{ background: C.dark, padding: "24px 20px 22px" }}>
      <div style={{ fontFamily: F.m, fontSize: 12, letterSpacing: 3, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", marginBottom: 6 }}>{eyebrow}</div>
      <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 30, color: "#FFF", lineHeight: 1.15, marginBottom: 4 }}>{title}</div>
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
          <Button key={code} variant="tertiary" onClick={() => onOpen(code)} className="flex-shrink-0 w-[120px] h-auto flex-col items-stretch overflow-hidden rounded-xl border border-[rgba(110,15,45,0.10)] bg-white p-0 text-left">
            {d?.colorSlipPhoto ? (
              <div style={{ height: 80, width: "100%", backgroundImage: `url(${d.colorSlipPhoto})`, backgroundSize: "cover", backgroundPosition: "center" }} />
            ) : (
              <div style={{ height: 80, width: "100%", background: C.cream, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Flower2 size={30} color={C.muted} />
              </div>
            )}
            <div style={{ padding: "8px 10px" }}>
              <div style={{ fontFamily: F.m, fontSize: 12, color: C.burg, marginBottom: 2 }}>{code}</div>
              <div style={{ fontFamily: F.u, fontSize: 12, color: C.text, lineHeight: 1.3 }}>{d?.name || "—"}</div>
            </div>
          </Button>
        );
      })}
    </div>
  );
}




// ─── Payment section constants ───────────────────────────────────────────────
const CURRENT_WEAVER_ID = "b5f9178c-b1b9-4871-a7c3-0d68a462d57a";

// Static month data — charges/deductions are set per-production-cycle

// Removed: CURRENT_MONTH_LABEL / GROSS_CHARGES / TOTAL_DEDUCTIONS /
// NET_AMOUNT / PAST_MONTHS were hardcoded demo figures. Payment history
// and earnings now come from WeaverPaymentsContext + QcContext.
// WN_* and BatchCard/FadeUpBatch/BG_IMAGE/FABRIC_BG are imported from WeaverBatchNotifData.tsx


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
  MaterialHistoryCard,
  HeroHeader,
  DesignCodeTileGrid,
  MobileBatchCard,
  CompletedBatchCard,
  BATCH_QUICK_FILTERS,
  BatchQuickFilterPills,
  CURRENT_WEAVER_ID,
  WN_T,
  WN_G,
  WN_EASE,
  WN_NUM,
  WN_DATA,
  WN_PRIORITY,
  WN_CATEGORY,
  WN_FILTERS,
  WNFadeUp,
  BATCH_STATUS_CFG,
  BatchCard,
  FadeUpBatch,
  BG_IMAGE,
  FABRIC_BG
};

export type Tab5 = "batches" | "confirm" | "warp" | "payments" | "notifications";
