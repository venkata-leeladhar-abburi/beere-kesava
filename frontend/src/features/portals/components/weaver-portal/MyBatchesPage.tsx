
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
  C, F, SAREE_TYPE_RATES, DesignDetailCard, SareeTypeDetailCard, SectionTitle, Card, ProgressBar, StatusBadge, SignatureCanvas, MaterialHistoryCard, HeroHeader, DesignCodeTileGrid, MobileBatchCard, CompletedBatchCard, BATCH_QUICK_FILTERS, BatchQuickFilterPills, CURRENT_WEAVER_ID, CURRENT_MONTH_LABEL, GROSS_CHARGES, TOTAL_DEDUCTIONS, NET_AMOUNT, PAST_MONTHS, WN_T, WN_G, WN_EASE, WN_NUM, WN_DATA, WN_PRIORITY, WN_CATEGORY, WN_FILTERS, WNFadeUp, BATCH_LIST, BATCH_STATUS_CFG, BatchCard, FadeUpBatch, BG_IMAGE, FABRIC_BG, BatchQuickFilter, MyBatchEntry
} from './theme';


export function MyBatchesPage() {
  const { isMobile, cols } = useResponsive();
  const { batches } = useBatches();
  const [quickFilter, setQuickFilter] = useState<BatchQuickFilter>("all");

  const myWeaverBatches: MyBatchEntry[] = batches
    .map(b => ({ ...b, myRows: b.rows.filter(r => r.weaverId === CURRENT_WEAVER_ID) }))
    .filter(b => b.myRows.length > 0);

  // Completed: every saree row assigned to this weaver in the batch has passed QC
  const completedBatches: MyBatchEntry[] = myWeaverBatches.filter(b => b.myRows.every(r => r.qcPassed === true));
  // Active: anything not yet fully QC-passed stays here, with a "X of Y passed" progress indicator
  const myActiveBatches: MyBatchEntry[] = myWeaverBatches.filter(b => !b.myRows.every(r => r.qcPassed === true));

  const totalMyActive = myActiveBatches.length;

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

      {/* Defective Saree Warning Alerts */}
      {myDefectiveSarees.map(ds => (
        <div key={ds.sareeId} style={{ margin: "16px 20px 0 20px", background: "rgba(192,57,43,0.06)", border: `1.5px solid ${C.crim}`, borderRadius: 16, padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <AlertTriangle size={18} color={C.crim} />
            <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14.5, color: C.crim }}>QC Failed — Defective Saree Alert</span>
          </div>
          <div style={{ fontFamily: F.u, fontSize: 13, color: C.text, lineHeight: 1.5 }}>
            Saree <strong>{ds.sareeId}</strong> in batch <strong>{ds.batchId}</strong> ({ds.sareeTypeName || "Self Brocade"}) failed quality check due to a <strong>{ds.defect}</strong> defect. A deduction of <strong>₹{ds.deduction}</strong> has been registered.
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 10, fontFamily: F.u, fontSize: 11.5, color: C.muted }}>
            <span>QC Date: {ds.date}</span>
            <span>•</span>
            <span style={{ fontStyle: "italic" }}>Defect photo sent via WhatsApp</span>
          </div>
        </div>
      ))}

      {/* Weaver Identity */}
      <div style={{ background: C.dark, padding: "16px 20px 18px", display: "flex", alignItems: "center", gap: 14, marginTop: myDefectiveSarees.length > 0 ? 16 : 0 }}>
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

