
import React, { useState, useMemo } from "react";
import { useResponsive } from "../../../../hooks/useResponsive";
import { useBatches } from "@/features/production";
import { useWeaverPayments } from "@/features/weavers";
import { rupees } from "@/lib/domain/money";
import { Money } from "@/shared/ui/domain";
import { useCurrentWeaver } from "./useCurrentWeaver";
import { GeneralDispatchInstructionsBlock } from "./desktop/batchCardHelpers";
import {
  Package, RotateCcw,
  Layers,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

import { useAuth } from "../../../../contexts/AuthContext";
import { useQc } from "@/features/qc";
import { MobileWeaverHeroSection } from "./MobileWeaverHeroSection";
import { BatchHistoryPage } from "./BatchHistoryPage";
import { SectionHeading } from "@/shared/ui/portal/PortalChrome";
import { AlertCircle, History, ListChecks } from "lucide-react";
import { C, F, HeroHeader, MobileBatchCard, CompletedBatchCard, BatchQuickFilter, MyBatchEntry } from './theme';

export function MyBatchesPage({ onGoToPayments }: { onGoToPayments?: () => void } = {}) {
  const { isMobile: _isMobile, cols: _cols } = useResponsive();
  // Mirrors the desktop twin (desktop/BatchesSection.tsx), which swaps the whole
  // section out for BatchHistoryPage rather than pushing a route.
  const [subPage, setSubPage] = useState<"main" | "history" | "completed">("main");
  const { user } = useAuth();
  const { batches } = useBatches();
  const { weaver, weaverId, isLoading: weaverLoading, isError: weaverError } = useCurrentWeaver();
  const { getPaymentsForWeaver } = useWeaverPayments();
  const { getQcForWeaver } = useQc();
  const [quickFilter, _setQuickFilter] = useState<BatchQuickFilter>("all");

  const weaverQcRecords = weaverId ? getQcForWeaver(weaverId) : [];
  const now = new Date();
  const thisMonthQc = weaverQcRecords.filter(q => {
    const d = new Date(q.qcDate);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const myRows = weaverId ? batches.flatMap(b => b.rows.filter(r => r.weaverId === weaverId)) : [];
  const isSameMonth = (iso: string) => {
    const d = new Date(iso);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  };
  const qcPassDateBySaree = new Map(
    weaverQcRecords.filter(q => q.result === "passed").map(q => [q.sareeId, q.qcDate]),
  );
  const producedThisMonth = myRows.filter(r => {
    if (r.finished === true && r.finishedAt) return isSameMonth(r.finishedAt);
    const passedAt = r.sareeId ? qcPassDateBySaree.get(r.sareeId) : undefined;
    return passedAt ? isSameMonth(passedAt) : false;
  });
  const _sareesThisMonth = producedThisMonth.length;
  const passedCount = weaverQcRecords.filter(q => q.result === "passed").length;
  const _qcPassPct = weaverQcRecords.length > 0 ? Math.round((passedCount / weaverQcRecords.length) * 100) : 100;
  const rejectedThisMonth = thisMonthQc.filter(q => q.result === "defective").length;
  const _qcPassSub = weaverQcRecords.length === 0 ? "No inspections yet" : `${rejectedThisMonth} rejected this month`;

  const payments = weaverId ? getPaymentsForWeaver(weaverId) : [];
  const thisMonthPayments = payments.filter(p => {
    const d = new Date(p.paymentDate || p.uploadedAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const _earnedThisMonth = thisMonthPayments.reduce((s, p) => s + p.amountPaid, 0);

  const isMyRow = (r: { weaverId?: string | null }) => {
    if (!r.weaverId) return false;
    if (weaverId && r.weaverId.toLowerCase() === weaverId.toLowerCase()) return true;
    if (!weaver) return false;
    const wId = weaver.id.toLowerCase();
    const wCode = weaver.code.toLowerCase();
    const rId = r.weaverId.toLowerCase();
    return rId === wId || rId === wCode;
  };

  const myWeaverBatches: MyBatchEntry[] = batches
    .map(b => ({ ...b, myRows: b.rows.filter(isMyRow) }))
    .filter(b => b.myRows.length > 0);

  const isBatchDone = (b: MyBatchEntry) => {
    if (b.status === "completed") return true;
    if (b.myRows.length === 0) return false;
    return b.myRows.every(r => r.finished === true);
  };

  const completedBatches: MyBatchEntry[] = myWeaverBatches.filter(isBatchDone);
  const myActiveBatches: MyBatchEntry[] = myWeaverBatches.filter(b => !isBatchDone(b));
  const totalMyActive = myActiveBatches.length;

  const hour = new Date().getHours();
  const _greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const _weaverFirstName = user?.name ? user.name.split(" ")[0] : "Weaver";

  const myDefectiveSarees = useMemo(() => {
    return batches.flatMap(b =>
      b.rows
        .filter(r => r.weaverId === weaverId && r.qcResult === "defective")
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
  }, [batches, weaverId]);

  const myReworkSarees = useMemo(() => {
    return batches.flatMap(b =>
      b.rows
        .filter(r => r.weaverId === weaverId && r.awaitingRework === true && r.qcResult === "semi")
        .map(r => ({ sareeId: r.sareeId, batchId: b.batchId, sareeTypeName: r.sareeTypeName }))
    );
  }, [batches, weaverId]);

  const _showActiveSection = quickFilter === "all" || quickFilter === "active" || quickFilter === "qc-pending" || quickFilter === "draft";
  const _showCompletedSection = quickFilter === "all" || quickFilter === "completed";
  const _visibleActiveBatches = myActiveBatches.filter(b => {
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

  if (subPage === "history") {
    return <BatchHistoryPage onBack={() => setSubPage("main")} defaultFilter="all" />;
  }
  if (subPage === "completed") {
    return <BatchHistoryPage onBack={() => setSubPage("main")} defaultFilter="completed" />;
  }

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Hero Header + 5 Metrics Card Strip */}
      <MobileWeaverHeroSection
        weaverName={user?.name ?? "Weaver"}
        onExploreBatches={() => document.getElementById("weaver-mobile-active-batches")?.scrollIntoView({ behavior: "smooth" })}
        onGoToPayments={() => onGoToPayments?.()}
      />

      <div style={{ padding: "0 16px", marginTop: 24 }} id="weaver-mobile-active-batches">
        {/* Defective Saree Warning Alerts */}
        {myDefectiveSarees.map(ds => (
          <div key={ds.sareeId} style={{ marginBottom: 16, background: "rgba(192,57,43,0.06)", border: `1.5px solid ${C.crim}`, borderRadius: 16, padding: "16px 20px" }}>
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

        {/* Semi-Approved — Rework Alerts */}
        {myReworkSarees.map(rs => (
          <div key={rs.sareeId} style={{ marginBottom: 16, background: "rgba(200,155,71,0.08)", border: `1.5px solid ${C.gold}`, borderRadius: 16, padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <RotateCcw size={18} color={C.gold} />
              <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.gold }}>Semi-Approved — Rework Needed</span>
            </div>
            <div style={{ fontFamily: F.u, fontSize: 13, color: C.text, lineHeight: 1.5 }}>
              Saree <strong>{rs.sareeId}</strong> in batch <strong>{rs.batchId}</strong> ({rs.sareeTypeName || "Self Brocade"}) was semi-approved at quality check and sent back to you. It does <strong>not</strong> count as produced yet — rework it and hand it in again.
            </div>
          </div>
        ))}

        {/* General Dispatch Instructions */}
        <GeneralDispatchInstructionsBlock />

        {/* Active Batches */}
        <div style={{ marginTop: 24 }}>
          <SectionHeading
            title="Active Batches"
            subtitle="You can have a maximum of 2 active batches at a time. Complete one before a new batch is assigned."
            right={
              <button
                onClick={() => setSubPage("history")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: "1px solid rgba(110,15,45,0.18)",
                  background: "rgba(110,15,45,0.06)",
                  color: "#6E0F2D",
                  fontFamily: F.u,
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(110,15,45,0.14)"; e.currentTarget.style.color = "#6E0F2D"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(110,15,45,0.06)"; e.currentTarget.style.color = "#6E0F2D"; }}
              >
                <History size={14} color={C.burg} /> View All History
              </button>
            }
          />
          <div style={{ height: 12 }} />

          {myActiveBatches.length === 0 ? (
            <div style={{ background: C.cream, borderRadius: 14, padding: "28px 20px", textAlign: "center" as const }}>
              <Package size={28} color={C.muted} style={{ margin: "0 auto 10px" }} />
              <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted }}>No active batches assigned to you yet.</div>
            </div>
          ) : (
            myActiveBatches.map((b, idx) => <MobileBatchCard key={b.batchId} b={b} idx={idx} />)
          )}

          {totalMyActive >= 2 && (
            <div style={{ marginTop: 16, background: "#FFF8E8", border: `1px solid rgba(200,155,71,0.30)`, borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
              <AlertCircle size={20} color={C.gold} style={{ flexShrink: 0 }} />
              <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted, lineHeight: 1.4 }}>Maximum 2 active batches reached. Complete one before a new batch can be assigned.</span>
            </div>
          )}
        </div>

        {/* Completed Batches */}
        <div style={{ marginTop: 32 }}>
          <SectionHeading
            title="Completed Batches"
            subtitle="Recent completed batches — your track record of finished work."
            accent="#1F774E"
            right={
              <button
                onClick={() => setSubPage("completed")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: "1px solid rgba(31,119,78,0.25)",
                  background: "rgba(31,119,78,0.06)",
                  color: "#1F774E",
                  fontFamily: F.u,
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(31,119,78,0.14)"; e.currentTarget.style.color = "#1F774E"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(31,119,78,0.06)"; e.currentTarget.style.color = "#1F774E"; }}
              >
                <ListChecks size={14} color="#1F774E" /> See All Completed
              </button>
            }
          />
          <div style={{ height: 12 }} />

          {completedBatches.length === 0 ? (
            <div style={{ padding: "36px 20px", textAlign: "center" as const, background: C.cream, borderRadius: 20, border: `1px solid ${C.bdr}` }}>
              <CheckCircle2 size={32} color={C.muted} style={{ margin: "0 auto 12px" }} />
              <div style={{ fontFamily: F.u, fontSize: 15, color: C.muted, fontWeight: 600 }}>No completed batches yet.</div>
              <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginTop: 4 }}>A batch moves here once QC has passed on every saree you wove.</div>
            </div>
          ) : (
            completedBatches.slice(0, 3).map(b => (
              <CompletedBatchCard key={b.batchId} b={b} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PAGE 02 — CONFIRM MATERIAL RECEIPT ────────────────────────────────────
export function materialTypeIcon(type: string) {
  if (type === "Warp") return <Package size={18} color={C.burg} />;
  if (type === "Resham") return <Layers size={18} color={C.burg} />;
  return <span style={{ fontSize: 18 }}>✨</span>;
}

