
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
import {
  C, F, SAREE_TYPE_RATES, DesignDetailCard, SareeTypeDetailCard, SectionTitle, Card, ProgressBar, StatusBadge, SignatureCanvas, MaterialHistoryCard, HeroHeader, DesignCodeTileGrid, MobileBatchCard, CompletedBatchCard, BATCH_QUICK_FILTERS, BatchQuickFilterPills, CURRENT_WEAVER_ID, CURRENT_MONTH_LABEL, GROSS_CHARGES, TOTAL_DEDUCTIONS, NET_AMOUNT, PAST_MONTHS, WN_T, WN_G, WN_EASE, WN_NUM, WN_DATA, WN_PRIORITY, WN_CATEGORY, WN_FILTERS, WNFadeUp, BATCH_LIST, BATCH_STATUS_CFG, BatchCard, FadeUpBatch, BG_IMAGE, FABRIC_BG, DesktopHeroProps, MyBatchEntry, Tab5
} from './theme';

import { MyBatchesPage } from './MyBatchesPage';
import { ConfirmMaterialPage } from './ConfirmMaterialPage';
import { WarpRequestPage } from './WarpRequestPage';
import { PaymentLedgerPage } from './PaymentLedgerPage';
import { NotificationsPage } from './NotificationsPage';
import { BatchHistoryPage } from './BatchHistoryPage';

export function DesktopHero({ breadcrumb, titleMain, titleSub, description, pills, alertBadge, stats, bgUrl, bp = "desktop" }: DesktopHeroProps) {
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
// ─── Materials given to the current weaver for a specific batch (aggregated by type) ──
export function useMaterialsGivenForBatch(batchId: string) {
  const { getRecordsForWeaver } = useMaterialIssue();
  const records = getRecordsForWeaver(CURRENT_WEAVER_ID).filter(r => r.batchId === batchId && r.status !== "cancelled");
  const totals: Record<string, { qty: number; unit: string }> = {};
  records.forEach(r => r.materials.forEach(m => {
    if (!totals[m.materialType]) totals[m.materialType] = { qty: 0, unit: m.unit };
    totals[m.materialType].qty += m.quantity;
  }));
  return Object.entries(totals).map(([type, v]) => `${type}: ${v.qty}${v.unit}`).join(", ");
}

// ─── Dispatch instructions sent to the current weaver, linked to a specific batch ──
export function DispatchInstructionsBlock({ batchId }: { batchId: string }) {
  const { getDispatchesForWeaver } = useDesignLibrary();
  const myDispatches = getDispatchesForWeaver(CURRENT_WEAVER_ID).filter(d => d.batches.includes(batchId));
  if (myDispatches.length === 0) return null;
  return (
    <div>
      <div style={{ fontFamily: F.m, fontSize: 9, color: C.muted, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 7 }}>DISPATCH INSTRUCTIONS</div>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
        {myDispatches.map(d => (
          <div key={d.id} style={{ background: "rgba(107,26,42,0.04)", border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontFamily: F.u, fontSize: 12.5, color: C.text, lineHeight: 1.5 }}>{d.instructions}</div>
            {(d.colorSlipImage || d.designGraphImage) && (
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                {d.colorSlipImage && (
                  <div>
                    <img src={d.colorSlipImage} alt="Color Slip" style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover", border: `1px solid ${C.bdr}`, display: "block" }} />
                    <div style={{ fontFamily: F.u, fontSize: 9.5, color: C.muted, marginTop: 3, textAlign: "center" as const }}>Color Slip</div>
                  </div>
                )}
                {d.designGraphImage && (
                  <div>
                    <img src={d.designGraphImage} alt="Design Graph" style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover", border: `1px solid ${C.bdr}`, display: "block" }} />
                    <div style={{ fontFamily: F.u, fontSize: 9.5, color: C.muted, marginTop: 3, textAlign: "center" as const }}>Design Graph</div>
                  </div>
                )}
              </div>
            )}
            <div style={{ fontFamily: F.u, fontSize: 10.5, color: C.muted, marginTop: 8 }}>{d.sentAt}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Materials given block (shared by active + completed batch cards) ──
export function MaterialsGivenBlock({ batchId }: { batchId: string }) {
  const summary = useMaterialsGivenForBatch(batchId);
  if (!summary) return null;
  return (
    <div>
      <div style={{ fontFamily: F.m, fontSize: 9, color: C.muted, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 7 }}>MATERIALS GIVEN</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(196,146,58,0.08)", border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "10px 12px" }}>
        <Package size={14} color={C.gold} />
        <span style={{ fontFamily: F.u, fontSize: 12.5, color: C.text }}>{summary}</span>
      </div>
    </div>
  );
}

export function DesktopActiveBatchCard({ b, idx, bp = "desktop" }: { b: MyBatchEntry; idx: number; bp?: "tablet" | "desktop" }) {
  const [expandedType,   setExpandedType]   = useState<string | null>(null);
  const isTablet = bp === "tablet";

  const borderColor    = idx % 2 === 0 ? C.burg : C.gold;
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

        {/* Dispatch instructions assigned to this weaver for this batch */}
        <DispatchInstructionsBlock batchId={b.batchId} />

        {/* Materials issued to this weaver for this batch */}
        <MaterialsGivenBlock batchId={b.batchId} />


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

// Completed batch card — same full info as the active batch card, but with a completed badge
export function DesktopCompletedBatchCard({ b, idx, bp = "desktop" }: { b: MyBatchEntry; idx: number; bp?: "tablet" | "desktop" }) {
  const [expandedType, setExpandedType] = useState<string | null>(null);
  const isTablet = bp === "tablet";

  const sareeTypePairs = Array.from(new Map(b.myRows.filter(r => r.sareeTypeCode && r.sareeTypeName).map(r => [r.sareeTypeCode!, r.sareeTypeName!])).entries());
  const bulkOrders     = Array.from(new Set(b.myRows.map(r => r.bulkOrderLabel).filter(Boolean))) as string[];
  const generalStock   = b.myRows.filter(r => !r.bulkOrderLabel).length;

  return (
    <div style={{ background: "#FFFDF9", borderRadius: 24, border: `1px solid rgba(110,15,45,0.10)`, borderLeft: `4px solid ${C.green}`, boxShadow: "0px 4px 18px rgba(74,6,27,0.07)", overflow: "hidden", display: "flex", flexDirection: "column" as const }}>
      <div style={{ padding: "22px 24px 20px", display: "flex", flexDirection: "column" as const, gap: 14 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: F.m, fontWeight: 700, fontSize: 18, color: C.burg }}>{b.batchId}</span>
          <span style={{ fontFamily: F.u, fontSize: 11, color: "#1D4ED8", background: "rgba(29,78,216,0.10)", borderRadius: 999, padding: "4px 12px", fontWeight: 600 }}>
            ✓ Completed
          </span>
        </div>

        {/* Saree count + QC pass rate */}
        <div style={{ display: "flex", flexDirection: isTablet ? "column" as const : "row" as const, gap: 14, alignItems: isTablet ? "stretch" : "center" }}>
          <div style={{ background: C.cream, borderRadius: 12, padding: "14px 18px", textAlign: "center" as const, flex: isTablet ? undefined : "0 0 auto", minWidth: isTablet ? undefined : 160 }}>
            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 4 }}>Sarees assigned to you</div>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 36, color: C.text, lineHeight: 1 }}>{b.myRows.length}</div>
            {b.dueDate && <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 4 }}>Due by <span style={{ color: C.text, fontWeight: 600 }}>{b.dueDate}</span></div>}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>QC: {b.myRows.length} of {b.myRows.length} passed</span>
              <span style={{ fontFamily: F.m, fontSize: 13, color: C.green, fontWeight: 600 }}>100%</span>
            </div>
            <ProgressBar pct={100} height={8} />
          </div>
        </div>

        {/* Dispatch instructions assigned to this weaver for this batch */}
        <DispatchInstructionsBlock batchId={b.batchId} />

        {/* Materials issued to this weaver for this batch */}
        <MaterialsGivenBlock batchId={b.batchId} />


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

export function DesktopWeaverPortal({ onBack, bp = "desktop", active, setActive, onProfile }: { onBack?: () => void; bp?: "tablet" | "desktop"; active: Tab5; setActive: (t: Tab5) => void; onProfile?: () => void }) {
  const { selectRole } = useAuth();
  const navigate = useNavigate();
  const isTablet = bp === "tablet";
  const [showNotifs, setShowNotifs] = useState(false);
  const [search, setSearch] = useState("");
  const [showProfile, setShowProfile] = useState(false);

  // Batches sub-page navigation
  const [batchesSubPage, setBatchesSubPage] = useState<"main" | "history" | "completed">("main");

  const { batches } = useBatches();
  const { getDesign } = useDesignLibrary();
  const { getRecordsForWeaver, updateSignatureStatus, getMaterialSummaryForWeaver, getMaterialSummaryByBatch } = useMaterialIssue();
  const weaverMaterialRecords = getRecordsForWeaver(CURRENT_WEAVER_ID);
  const pendingMaterialRecord = weaverMaterialRecords.find(r => r.status === "pending-signature") ?? null;
  const matSummary = getMaterialSummaryForWeaver(CURRENT_WEAVER_ID);
  const matByBatch = getMaterialSummaryByBatch(CURRENT_WEAVER_ID);
  const myWeaverBatches: MyBatchEntry[] = batches
    .map(b => ({ ...b, myRows: b.rows.filter(r => r.weaverId === CURRENT_WEAVER_ID) }))
    .filter(b => b.myRows.length > 0);

  // Completed: every saree row assigned to this weaver in the batch has passed QC
  const completedBatches: MyBatchEntry[] = myWeaverBatches.filter(b => b.myRows.every(r => r.qcPassed === true));
  // Active: anything not yet fully QC-passed, with a "X of Y passed" progress indicator
  const myActiveBatches: MyBatchEntry[] = myWeaverBatches.filter(b => !b.myRows.every(r => r.qcPassed === true));

  const myDefectiveSarees = useMemo(() => {
    return batches.flatMap(b =>
      b.rows
        .filter(r => r.weaverId === CURRENT_WEAVER_ID && r.qcPassed === false)
        .map(r => ({
          sareeId: r.sareeId,
          batchId: b.batchId,
          designCode: r.designCode,
          sareeTypeCode: r.sareeTypeCode,
          sareeTypeName: r.sareeTypeName,
          date: "10 Jun 2026",
          defect: "Thread Break",
          deduction: 450,
        }))
    );
  }, [batches]);

  const [viewDesign, setViewDesign] = useState<DesignEntry | null>(null);

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
            <div style={{ width: 44, height: 44, borderRadius: 12, overflow: "hidden", border: `1px solid ${C.bdr}`, boxShadow: "0 2px 10px rgba(0,0,0,0.08)", flexShrink: 0 }}>
              <img src={imgBKLogo} alt="BK Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            {!isTablet && (
            <div>
              <div style={{ fontFamily: F.d, fontSize: 18, fontWeight: 700, color: "#2C1810", lineHeight: 1.1, textTransform: "uppercase" as const }}>Beere Kesava</div>
              <div style={{ fontFamily: F.u, fontSize: 10.5, fontWeight: 400, color: "#3B2314", letterSpacing: 1.6, textTransform: "uppercase" as const, marginTop: 1 }}>And Brothers Silks</div>
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
                {React.cloneElement(tab.icon as React.ReactElement<any>, { color: active === tab.id && !showNotifs ? C.burg : C.muted })}
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
                    <button onClick={() => { setShowProfile(false); onProfile?.(); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 18px", border: "none", background: "none", cursor: "pointer", fontFamily: F.u, fontSize: 14, color: C.text, textAlign: "left" as const }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(107,26,42,0.04)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                      <UserRound size={15} color={C.muted} /> View Profile
                    </button>
                    <div style={{ height: 1, background: C.bdr, margin: "4px 0" }} />
                    {localStorage.getItem("bk_original_admin_role") ? (
                      <button onClick={() => {
                        setShowProfile(false);
                        const origAdminRole = localStorage.getItem("bk_original_admin_role");
                        if (origAdminRole) {
                          localStorage.removeItem("bk_original_admin_role");
                          selectRole(origAdminRole as any);
                          navigate(origAdminRole === "superadmin" ? "/superadmin" : "/admin");
                        }
                      }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 18px", border: "none", background: "none", cursor: "pointer", fontFamily: F.u, fontSize: 14, color: C.text, textAlign: "left" as const }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(107,26,42,0.04)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                        <ChevronLeft size={15} color={C.muted} /> My Portal
                      </button>
                    ) : (
                      <button onClick={() => { setShowProfile(false); onBack?.(); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 18px", border: "none", background: "none", cursor: "pointer", fontFamily: F.u, fontSize: 14, color: C.text, textAlign: "left" as const }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(107,26,42,0.04)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                        <ChevronLeft size={15} color={C.muted} /> Switch Portal
                      </button>
                    )}
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
                    {/* Defective Saree Warning Alerts */}
                    {myDefectiveSarees.map(ds => (
                      <div key={ds.sareeId} style={{ background: "rgba(192,57,43,0.05)", border: `1.5px solid ${C.crim}`, borderRadius: 16, padding: "20px 24px", marginBottom: 28, display: "flex", gap: 16, alignItems: "flex-start" }}>
                        <AlertTriangle size={24} color={C.crim} style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                          <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 16.5, color: C.crim, marginBottom: 6 }}>QC Failed — Defective Saree Alert</div>
                          <div style={{ fontFamily: F.u, fontSize: 14.5, color: C.text, lineHeight: 1.6 }}>
                            Saree <strong>{ds.sareeId}</strong> in batch <strong>{ds.batchId}</strong> ({ds.sareeTypeName || "Self Brocade"}) failed quality check due to a <strong>{ds.defect}</strong> defect. A payment deduction of <strong>₹{ds.deduction}</strong> has been registered.
                          </div>
                          <div style={{ display: "flex", gap: 16, marginTop: 12, fontFamily: F.u, fontSize: 13, color: C.muted }}>
                            <span>QC Date: {ds.date}</span>
                            <span>•</span>
                            <span style={{ fontStyle: "italic" }}>Defect photo has been shared with you via WhatsApp</span>
                          </div>
                        </div>
                      </div>
                    ))}

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
                        <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "1fr 1fr", gap: isTablet ? 18 : 24 }}>
                          {completedBatches.slice(0, 4).map((b, idx) => <DesktopCompletedBatchCard key={b.batchId} b={b} idx={idx} bp={bp} />)}
                        </div>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div style={{ background: C.dark, borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 24px rgba(61,14,26,0.22)" }}>
                      <div style={{ padding: "20px 26px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                        <div style={{ fontFamily: F.u, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.40)", letterSpacing: 1.4, textTransform: "uppercase" as const, marginBottom: 4 }}>QUICK ACTIONS</div>
                        <div style={{ fontFamily: F.u, fontSize: 15, color: "rgba(255,255,255,0.75)" }}>Navigate to key tasks</div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "repeat(3, 1fr)" }}>
                        {[
                          { label: "Confirm Materials", sub: "New batch awaiting signature", tab: "confirm" as Tab5, icon: <ClipboardCheck size={18} color={C.gold} />, badge: "Pending" },
                          { label: "Raise Warp Request", sub: "Request additional material", tab: "warp" as Tab5, icon: <Package size={18} color={C.gold} />, badge: null },
                          { label: "Payment Ledger", sub: "View earnings & deductions", tab: "payments" as Tab5, icon: <CreditCard size={18} color={C.gold} />, badge: null },
                        ].map((a, i) => (
                          <button key={a.tab} onClick={() => setActive(a.tab)} style={{ display: "flex", alignItems: "center", gap: 16, width: "100%", padding: "18px 26px", border: "none", borderBottom: "1px solid rgba(255,255,255,0.07)", borderRight: !isTablet && i < 2 ? "1px solid rgba(255,255,255,0.07)" : "none", background: "transparent", cursor: "pointer", textAlign: "left" as const }}
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
                  <div style={{ background: "rgba(196,146,58,0.12)", border: `2px solid ${C.gold}`, borderRadius: 20, padding: "26px 30px" }}>
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
                      The admin has issued your materials. Review the list below in Materials Received History, then sign to confirm receipt.
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
                )}

                {/* Outstanding Material still with the weaver */}
                {matByBatch.length > 0 && (() => {
                  const fmtKg = (g: number) => `${(g / 1000).toFixed(2)} kg`;
                  const outColor = matSummary.outstandingGrams > 0 ? C.crim : C.green;
                  return (
                    <div style={{ marginTop: 48 }}>
                      <DSectionHeader label="Material Still With You" />
                      <div style={{ fontFamily: F.u, fontSize: 15, color: C.muted, marginBottom: 22 }}>
                        Material issued minus the weight of sarees you have submitted. Jari is counted at 1 reel = {JARI_REEL_GRAMS} g.
                      </div>

                      {/* Totals */}
                      <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr 1fr 1fr" : "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
                        {[
                          { label: "Issued", value: fmtKg(matSummary.issuedGrams), sub: `incl. ${matSummary.jariReels} jari reels`, color: C.text },
                          { label: "Submitted", value: fmtKg(matSummary.receivedGrams), sub: `${matSummary.sareesReceived} sarees`, color: C.green },
                          { label: "Outstanding", value: fmtKg(matSummary.outstandingGrams), sub: "still with you", color: outColor },
                        ].map(s => (
                          <div key={s.label} style={{ background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 16, padding: "20px 22px" }}>
                            <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>{s.label}</div>
                            <div style={{ fontFamily: F.d, fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
                            <div style={{ fontFamily: F.u, fontSize: 12.5, color: C.muted, marginTop: 5 }}>{s.sub}</div>
                          </div>
                        ))}
                      </div>

                      {/* Batch wise — combined with the handovers that make up each batch */}
                      <div style={{ display: "flex", flexDirection: "column" as const, gap: 20 }}>
                        {(() => {
                          const recordsByBatch = new Map<string, typeof weaverMaterialRecords>();
                          weaverMaterialRecords.forEach(r => {
                            const key = r.batchId || "Unassigned";
                            if (!recordsByBatch.has(key)) recordsByBatch.set(key, []);
                            recordsByBatch.get(key)!.push(r);
                          });
                          return matByBatch.map(b => {
                            const records = (recordsByBatch.get(b.batchId) ?? []).slice()
                              .sort((a, c) => new Date(c.issuedAt).getTime() - new Date(a.issuedAt).getTime());
                            return (
                              <div key={b.batchId} style={{ background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 16, overflow: "hidden" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px", background: C.cream, borderBottom: `1px solid ${C.bdr}`, flexWrap: "wrap" as const, gap: 8 }}>
                                  <span style={{ fontFamily: F.m, fontSize: 15, fontWeight: 700, color: C.burg }}>{b.batchId}</span>
                                  <span style={{ fontFamily: F.u, fontSize: 12.5, color: C.muted }}>{b.sareesReceived} saree{b.sareesReceived !== 1 ? "s" : ""} submitted</span>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderBottom: `1px solid ${C.bdr}` }}>
                                  {[
                                    { label: "Issued", value: fmtKg(b.issuedGrams), sub: b.jariReels > 0 ? `incl. ${b.jariReels} jari reels` : undefined, color: C.text },
                                    { label: "Submitted", value: fmtKg(b.receivedGrams), sub: undefined, color: C.green },
                                    { label: "Outstanding", value: fmtKg(b.outstandingGrams), sub: undefined, color: b.outstandingGrams > 0 ? C.crim : C.green },
                                  ].map((s, i) => (
                                    <div key={s.label} style={{ padding: "14px 22px", borderRight: i < 2 ? `1px solid ${C.bdr}` : "none" }}>
                                      <div style={{ fontFamily: F.u, fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>{s.label}</div>
                                      <div style={{ fontFamily: F.m, fontSize: 18, fontWeight: 700, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
                                      {s.sub && <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted, marginTop: 3 }}>{s.sub}</div>}
                                    </div>
                                  ))}
                                </div>
                                <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column" as const, gap: 16 }}>
                                  {records.map(r => (
                                    <MaterialHistoryCard key={r.id} r={r} isTablet={isTablet} />
                                  ))}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  );
                })()}

                {matByBatch.length === 0 && (
                  <div style={{ marginTop: 48 }}>
                    <DSectionHeader label="Materials Received History" />
                    <div style={{ padding: "40px 20px", textAlign: "center" as const, background: "#FFF", borderRadius: 20, border: `1px solid ${C.bdr}` }}>
                      <div style={{ fontFamily: F.u, fontSize: 15, color: C.muted }}>No materials have been issued to you yet.</div>
                    </div>
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
