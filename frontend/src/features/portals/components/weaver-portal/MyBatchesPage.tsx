
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import { createPortal } from "react-dom";
import { useResponsive } from "../../../../hooks/useResponsive";
import { useBatches, SareeRow } from "../../../production/contexts/BatchContext";
import { useDesignLibrary, DesignEntry } from "../../../design-library/contexts/DesignLibraryContext";
import { DesignCodeCard } from "../../../design-library/components/DesignLibraryPage";
import { useMaterialIssue, MaterialIssueRecord, JARI_REEL_GRAMS } from "../../../materials/contexts/MaterialIssueContext";
import { useWeaverPayments } from "../../../weavers/contexts/WeaverPaymentsContext";
import { useAuth } from "../../../../contexts/AuthContext";
import { rupees, formatMoney } from "@/lib/domain/money";
import { Money } from "@/shared/ui/domain";
import { useCurrentWeaver } from "./useCurrentWeaver";
import { GeneralDispatchInstructionsBlock } from "./desktop/batchCardHelpers";
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
import { imgBKLogo } from "../../../../shared/constants/weaverImages";

// ─── Design Tokens ─────────────────────────────────────────────────────────
import {
  C, F, SAREE_TYPE_RATES, DesignDetailCard, SareeTypeDetailCard, SectionTitle, Card, ProgressBar, StatusBadge, SignatureCanvas, MaterialHistoryCard, HeroHeader, DesignCodeTileGrid, MobileBatchCard, CompletedBatchCard, BATCH_QUICK_FILTERS, BatchQuickFilterPills, WN_T, WN_G, WN_EASE, WN_NUM, WN_DATA, WN_PRIORITY, WN_CATEGORY, WN_FILTERS, WNFadeUp, BATCH_STATUS_CFG, BatchCard, FadeUpBatch, BG_IMAGE, FABRIC_BG, BatchQuickFilter, MyBatchEntry
} from './theme';


export function MyBatchesPage() {
  const { isMobile, cols } = useResponsive();
  const { batches } = useBatches();
  const { weaver, weaverId, isLoading: weaverLoading, isError: weaverError } = useCurrentWeaver();
  const { getPaymentsForWeaver } = useWeaverPayments();
  const [quickFilter, setQuickFilter] = useState<BatchQuickFilter>("all");

  const isMyRow = (r: { weaverId?: string | null }) => {
    if (!r.weaverId) return false;
    if (weaverId && r.weaverId.toLowerCase() === weaverId.toLowerCase()) return true;
    if (!weaver) return false;
    const wId = weaver.id.toLowerCase();
    const wCode = weaver.code.toLowerCase();
    const rId = r.weaverId.toLowerCase();
    return rId === wId || rId === wCode;
  };

  // A batch is visible to its assigned weaver even in draft status
  // so they can see upcoming work, and so the "Draft" quick filter works.
  const myWeaverBatches: MyBatchEntry[] = batches
    .map(b => ({ ...b, myRows: b.rows.filter(isMyRow) }))
    .filter(b => b.myRows.length > 0);

  const isBatchDone = (b: MyBatchEntry) => {
    if (b.status === "completed") return true;
    if (b.myRows.length === 0) return false;
    return b.myRows.every(r => r.finished === true);
  };

  // Completed: batch status is completed OR every saree row assigned to this weaver is finished (produced)
  const completedBatches: MyBatchEntry[] = myWeaverBatches.filter(isBatchDone);
  // Active: anything not yet completed
  const myActiveBatches: MyBatchEntry[] = myWeaverBatches.filter(b => !isBatchDone(b));

  const totalMyActive = myActiveBatches.length;

  const myDefectiveSarees = useMemo(() => {
    return batches.flatMap(b =>
      b.rows
        .filter(r => r.weaverId === weaverId && r.qcPassed === false)
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

  // Quick filter — narrows which of the two sections below are shown, and which batches within them
  const showActiveSection = quickFilter === "all" || quickFilter === "active" || quickFilter === "qc-pending" || quickFilter === "draft";
  const showCompletedSection = quickFilter === "all" || quickFilter === "completed";
  const visibleActiveBatches = myActiveBatches.filter(b => {
    if (quickFilter === "draft") return b.status === "draft";
    if (quickFilter === "active") return b.status === "active";
    if (quickFilter === "qc-pending") return b.myRows.some(r => r.qcPassed !== true);
    return true;
  });

  if (weaverLoading) {
    return (
      <div style={{ paddingBottom: 32 }}>
        <HeroHeader eyebrow="SINCE 1999 · MY WORK" title="My Batches" sub="Active and completed work" />
        <div style={{ margin: "40px 20px", textAlign: "center" as const, fontFamily: F.u, fontSize: 14, color: C.muted }}>Loading your batches…</div>
      </div>
    );
  }

  if (weaverError || !weaverId) {
    return (
      <div style={{ paddingBottom: 32 }}>
        <HeroHeader eyebrow="SINCE 1999 · MY WORK" title="My Batches" sub="Active and completed work" />
        <div style={{ margin: "40px 20px", background: C.cream, borderRadius: 14, padding: "28px 20px", textAlign: "center" as const }}>
          <AlertTriangle size={28} color={C.crim} style={{ margin: "0 auto 10px" }} />
          <div style={{ fontFamily: F.u, fontSize: 14, color: C.text, fontWeight: 600 }}>Couldn't find your weaver profile</div>
          <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginTop: 4 }}>Your login isn't linked to a weaver record yet. Contact your supervisor.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 32 }}>
      <HeroHeader eyebrow="SINCE 1999 · MY WORK" title="My Batches" sub="Active and completed work" />
      <BatchQuickFilterPills value={quickFilter} onChange={setQuickFilter} />

      {/* Defective Saree Warning Alerts */}
      {myDefectiveSarees.map(ds => (
        <div key={ds.sareeId} style={{ margin: "16px 20px 0 20px", background: "rgba(192,57,43,0.06)", border: `1.5px solid ${C.crim}`, borderRadius: 16, padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <AlertTriangle size={18} color={C.crim} />
            <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.crim }}>QC Failed — Defective Saree Alert</span>
          </div>
          <div style={{ fontFamily: F.u, fontSize: 13, color: C.text, lineHeight: 1.5 }}>
            Saree <strong>{ds.sareeId}</strong> in batch <strong>{ds.batchId}</strong> ({ds.sareeTypeName || "Self Brocade"}) failed quality check due to a <strong>{ds.defect}</strong> defect. A deduction of <strong><Money value={rupees(ds.deduction)} /></strong> has been registered.
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 10, fontFamily: F.u, fontSize: 12, color: C.muted }}>
            <span>QC Date: {ds.date}</span>
            <span>•</span>
            <span style={{ fontStyle: "italic" }}>Defect photo sent via WhatsApp</span>
          </div>
        </div>
      ))}

      {/* Weaver Identity */}
      <div style={{ background: C.dark, padding: "16px 20px 18px", display: "flex", alignItems: "center", gap: 14, marginTop: myDefectiveSarees.length > 0 ? 16 : 0 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.burg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 18, color: "#FFF" }}>{weaver?.initials ?? "—"}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 18, color: "#FFF" }}>{weaver?.name ?? "Weaver"}</div>
          <div style={{ fontFamily: F.m, fontSize: 12, color: "rgba(255,255,255,0.60)", marginTop: 3 }}>{weaver?.village ? `${weaver.village} · ` : ""}Handloom Weaver</div>
        </div>
        <div style={{ border: `1px solid ${C.gold}`, color: C.gold, borderRadius: 999, padding: "6px 14px", fontFamily: F.m, fontSize: 12, flexShrink: 0, whiteSpace: "nowrap" as const }}>{totalMyActive} Active {totalMyActive === 1 ? "Batch" : "Batches"}</div>
      </div>

      {/* Stats Strip — spacious, clearly readable */}
      {(() => {
        const allMyRows = myWeaverBatches.flatMap(b => b.myRows);
        const producedCount = allMyRows.filter(r => r.qcPassed === true || r.finished === true).length;
        const qcPassedCount = allMyRows.filter(r => r.qcPassed === true).length;
        const qcPassPct = allMyRows.length > 0 ? Math.round((qcPassedCount / allMyRows.length) * 100) : 0;
        const earnedTotal = weaverId ? getPaymentsForWeaver(weaverId).reduce((sum, p) => sum + p.amountPaid, 0) : 0;
        const statsData = [
          { label: "Produced", val: `${producedCount}` },
          { label: "QC Pass", val: producedCount > 0 ? `${qcPassPct}%` : "—", highlight: true },
          { label: "Earned", val: formatMoney(rupees(earnedTotal)) },
        ];
        return (
      <div style={{ background: C.dark, borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex" }}>
        {statsData.map((s, i) => (
          <div key={i} style={{
            flex: 1, padding: "16px 10px", textAlign: "center" as const,
            borderRight: i < 2 ? "1px solid rgba(255,255,255,0.08)" : "none",
          }}>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 24, color: s.highlight ? C.gold : "#FFF", lineHeight: 1 }}>{s.val}</div>
            <div style={{ fontFamily: F.u, fontSize: 12, color: "rgba(255,255,255,0.60)", marginTop: 5 }}>{s.label}</div>
          </div>
        ))}
      </div>
        );
      })()}

      {/* General Dispatch Instructions */}
      <div style={{ padding: "0 20px" }}>
        <GeneralDispatchInstructionsBlock />
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
          <CompletedBatchCard key={b.batchId} b={b} />
        ))
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: cols(1, 2, 2), gap: 4 }}>
          {completedBatches.slice(0, 4).map(b => (
            <CompletedBatchCard key={b.batchId} b={b} />
          ))}
        </div>
      )}
      </>
      )}
    </div>
  );
}

// ─── PAGE 02 — CONFIRM MATERIAL RECEIPT ────────────────────────────────────
export function materialTypeIcon(type: string) {
  if (type === "Warp") return <Package size={18} color={C.burg} />;
  if (type === "Resham") return <Layers size={18} color={C.burg} />;
  return <span style={{ fontSize: 18 }}>✨</span>;
}

