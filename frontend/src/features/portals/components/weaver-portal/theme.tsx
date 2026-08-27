
import React, { useState } from "react";
import { motion } from "motion/react";
import { brand, fonts, semantic } from '@/design-system/tokens';
import { Palette, X, Layers, Flower2 } from "lucide-react";
import { Button, IconButton } from "../../../../shared/ui/primitives";
import * as Dialog from "@radix-ui/react-dialog";
import { Modal } from "../../../../shared/ui/overlay";
import { useDesignLibrary } from "@/features/design-library";
import { useRatesPricing } from "@/features/pricing";
import { MaterialHistoryCard, SignatureCanvas } from "./WeaverMaterialHistoryCard";
export type { SignatureCanvasHandle } from "./WeaverMaterialHistoryCard";
import {
  MobileBatchCard, CompletedBatchCard, BATCH_QUICK_FILTERS, BatchQuickFilterPills
} from "./WeaverMobileBatchCard";
export type { MyBatchEntry, BatchQuickFilter } from "./WeaverMobileBatchCard";
import {
  WN_T, WN_G, WN_EASE, WN_NUM, WN_DATA, WN_PRIORITY, WN_CATEGORY, WN_FILTERS, WNFadeUp,
  BatchCard, FadeUpBatch, BG_IMAGE, FABRIC_BG,
} from "./WeaverBatchNotifData";
export type { WNPriority, WNCategory, WNFilter, WeaverNotif, WeaverBatch } from "./WeaverBatchNotifData";
import { imgDesignSlipPlaceholder } from "@/shared/constants/mockImages";

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
  bdr: "rgba(110,15,45,0.10)",   // matches admin/worker borderDef
  bdrMed: "rgba(110,15,45,0.20)",
  wine: brand.burgundy[950],
  goldText: brand.gold[700],      // gold is never a text colour below 700
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

// ─── Inline design detail card (shown in dashboard, not modal) ───────────────
function DesignDetailCard({ designCode, onClose }: { designCode: string; onClose: () => void }) {
  const { getDesign } = useDesignLibrary();
  const d = getDesign(designCode);
  const BG = d?.colorSlipPhoto || imgDesignSlipPlaceholder;
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
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 8, marginBottom: 12 }}>
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
          <div style={{ background: "rgba(200,155,71,0.08)", border: `1px solid rgba(200,155,71,0.25)`, borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
            <div style={{ fontFamily: F.m, fontSize: 12, color: C.gold, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 4 }}>NOTES FOR YOU</div>
            <div style={{ fontFamily: F.u, fontSize: 13, color: C.text, lineHeight: 1.5 }}>{d.notesForWeaver}</div>
          </div>
        )}

        {d?.designGraph && (
          <div style={{ background: "#FAFAF8", border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
            <button type="button" onClick={() => setShowGraphModal(true)} style={{ display: "block", width: "100%", padding: 0, border: "none", background: "transparent", cursor: "pointer", borderRadius: 8 }}>
              <img src={d.designGraph} alt="Design Graph Drawing" style={{ width: "100%", maxHeight: 120, objectFit: "cover", borderRadius: 8, border: `1px solid ${C.bdr}` }} />
            </button>
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
        <Dialog.Description className="sr-only">Full-size design graph drawing</Dialog.Description>
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
// Weight-only — shows the standard total weight and its warp/resham/jari
// split for this saree type. Pricing/making-charge lives on the batch's
// "all sarees" page (WeaverBatchSareesModal) instead, not here.
function SareeTypeDetailCard({ typeCode, typeName, onClose }: { typeCode: string; typeName: string; onClose: () => void }) {
  const { getSareeTypeByCode } = useRatesPricing();
  const r = getSareeTypeByCode(typeCode);
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

        <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: 8 }}>
          {[
            { label: "STANDARD WEIGHT", val: r ? `${r.stdWeight}g` : "—" },
            { label: "WARP",            val: r ? `${r.warpWeight}g` : "—" },
            { label: "RESHAM",          val: r ? `${r.reshamWeight}g` : "—" },
            { label: "JARI",            val: r ? `${r.jariWeight} reels` : "—" },
          ].map(m => (
            <div key={m.label} style={{ background: C.cream, borderRadius: 10, padding: "12px 10px", textAlign: "center" as const }}>
              <div style={{ fontFamily: F.m, fontSize: 11, color: C.muted, letterSpacing: "0.8px", textTransform: "uppercase" as const, marginBottom: 5 }}>{m.label}</div>
              <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 17, color: C.text }}>{m.val}</div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Shared Components ──────────────────────────────────────────────────────
function SectionTitle({ title, link, onLink }: { title: string; link?: string; onLink?: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", margin: "32px 20px 16px", gap: 12 }}>
      <div style={{ width: 4, height: 22, background: C.gold, borderRadius: 2, flexShrink: 0 }} />
      <h2 style={{ fontFamily: F.d, fontWeight: 600, fontSize: 20, color: C.wine, margin: 0, flex: 1, letterSpacing: "-0.015em" }}>{title}</h2>
      {link && (
        <Button variant="link" onClick={onLink} className="p-0 text-[13px] font-semibold text-[#845E04]">
          {link}
        </Button>
      )}
    </div>
  );
}

function Card({ children, style, leftBorder, onClick }: { children: React.ReactNode; style?: React.CSSProperties; leftBorder?: string; onClick?: () => void }) {
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }) : undefined}
      style={{
        background: C.white, borderRadius: 20, border: `1px solid ${C.bdr}`,
        boxShadow: "0 6px 32px rgba(74,6,27,0.08)", padding: 24,
        ...(leftBorder ? { borderLeft: `4px solid ${leftBorder}` } : {}),
        ...(onClick ? { cursor: "pointer" } : {}),
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
    <div style={{ background: "#0D0207", padding: "28px 20px 24px" }}>
      <div style={{ fontFamily: F.m, fontSize: 12, letterSpacing: "1.8px", color: "rgba(255,253,249,0.50)", textTransform: "uppercase", marginBottom: 10 }}>{eyebrow}</div>
      <div style={{ fontFamily: F.d, fontWeight: 400, fontSize: 34, color: "#FFFDF9", lineHeight: 1.1, marginBottom: 4 }}>{title}</div>
      <div style={{ fontFamily: F.d, fontStyle: "italic", fontWeight: 400, fontSize: 22, color: C.gold }}>{sub}</div>
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


export { PageHero, StatsStrip, SectionCard, SectionHeading, GUTTER_X, GUTTER_X_TABLET } from "@/shared/ui/portal/PortalChrome";
export type { WorkerStat as PortalStat } from "@/shared/ui/portal/PortalChrome";

export {
  C,
  F,
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
  BatchCard,
  FadeUpBatch,
  BG_IMAGE,
  FABRIC_BG
};

export type Tab5 = "batches" | "confirm" | "warp" | "payments" | "notifications";
