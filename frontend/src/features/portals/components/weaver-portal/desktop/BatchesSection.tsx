import React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, ClipboardCheck, CreditCard, History, ListChecks, Package, ArrowRight, RotateCcw } from "lucide-react";
import { C, F, BG_IMAGE, MyBatchEntry, Tab5 } from "../theme";
import { SectionHeading } from "@/shared/ui/portal/PortalChrome";
import { BatchHistoryPage } from "../BatchHistoryPage";
import { DesktopHero } from "./DesktopHero";
import { WeaverHero } from "./WeaverHero";
import { WeaverMetricsBar } from "./WeaverMetricsBar";
import { DesktopActiveBatchCard } from "./DesktopActiveBatchCard";
import { DesktopCompletedBatchCard } from "./DesktopCompletedBatchCard";
import { GeneralDispatchInstructionsBlock } from "./batchCardHelpers";
import { Button } from "../../../../../shared/ui/primitives";
import { useAuth } from "../../../../../contexts/AuthContext";
import { useBatches } from "../../../../production/contexts/BatchContext";
import { useQc } from "../../../../qc/contexts/QcContext";
import { useWeaverPayments } from "../../../../weavers/contexts/WeaverPaymentsContext";
import { useCurrentWeaver } from "../useCurrentWeaver";
import { rupees, formatMoney } from "@/lib/domain/money";
import { Money } from "@/shared/ui/domain";

/** House rule: a weaver may hold at most this many batches at once. */
const MAX_ACTIVE_BATCHES = 2;

type DefectiveSaree = {
  sareeId: string; batchId: string; designCode?: string;
  sareeTypeCode?: string; sareeTypeName?: string; date: string; defect: string; deduction: number;
};

export function BatchesSection({
  bp, isTablet, batchesSubPage, setBatchesSubPage, myDefectiveSarees,
  myActiveBatches, completedBatches, setActive,
}: {
  bp: "tablet" | "desktop"; isTablet: boolean;
  batchesSubPage: "main" | "history" | "completed";
  setBatchesSubPage: (p: "main" | "history" | "completed") => void;
  myDefectiveSarees: DefectiveSaree[];
  myActiveBatches: MyBatchEntry[];
  completedBatches: MyBatchEntry[];
  setActive: (t: Tab5) => void;
}) {
  const { user } = useAuth();
  const { batches, error: batchesError } = useBatches();
  const { weaverId } = useCurrentWeaver();
  const { getQcForWeaver } = useQc();
  const { getPaymentsForWeaver } = useWeaverPayments();

  const weaverQcRecords = weaverId ? getQcForWeaver(weaverId) : [];
  const now = new Date();
  const thisMonthQc = weaverQcRecords.filter(q => {
    const d = new Date(q.qcDate);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const myRows = weaverId ? batches.flatMap(b => b.rows.filter(r => r.weaverId === weaverId)) : [];
  // Produced means the saree is done — QC-passed, or finished via the Raise
  // Quotation receive flow. Merely having been received doesn't qualify: a
  // saree can be received and then semi-approved, which sends it back to the
  // weaver for rework, so counting receipts reported every saree as produced
  // while one was still out being redone.
  const isSameMonth = (iso: string) => {
    const d = new Date(iso);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  };
  const qcPassDateBySaree = new Map(
    weaverQcRecords.filter(q => q.result === "passed").map(q => [q.sareeId, q.qcDate]),
  );
  const producedThisMonth = myRows.filter(r => {
    // Credit a saree to the month it actually finished, falling back to the
    // month it passed QC — mirrors finishedAt's purpose in SareeRow.
    if (r.finished === true && r.finishedAt) return isSameMonth(r.finishedAt);
    const passedAt = r.sareeId ? qcPassDateBySaree.get(r.sareeId) : undefined;
    return passedAt ? isSameMonth(passedAt) : false;
  });
  const sareesThisMonth = producedThisMonth.length;
  // Semi-approved and back with the weaver — not produced, not in QC, waiting
  // to be reworked and handed in again. Defective sarees go back for rework
  // too, but they already have their own (red) alert below, so they're left
  // out here rather than being announced twice.
  const reworkSarees = weaverId
    ? batches.flatMap(b =>
        b.rows
          .filter(r => r.weaverId === weaverId && r.awaitingRework === true && r.qcResult === "semi")
          .map(r => ({ sareeId: r.sareeId, batchId: b.batchId, sareeTypeName: r.sareeTypeName })),
      )
    : [];
  const passedCount = weaverQcRecords.filter(q => q.result === "passed").length;
  const qcPassPct = weaverQcRecords.length > 0 ? Math.round((passedCount / weaverQcRecords.length) * 100) : 100;
  const rejectedThisMonth = thisMonthQc.filter(q => q.result === "defective").length;
  const qcPassSub = weaverQcRecords.length === 0 ? "No inspections yet" : `${rejectedThisMonth} rejected this month`;

  const payments = weaverId ? getPaymentsForWeaver(weaverId) : [];
  const thisMonthPayments = payments.filter(p => {
    const d = new Date(p.paymentDate || p.uploadedAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const earnedThisMonth = thisMonthPayments.reduce((s, p) => s + p.amountPaid, 0);

  const identityBadge = user?.name ? (user.empId ? `${user.name} · ${user.empId}` : user.name) : "—";

  if (batchesSubPage === "history") {
    return <BatchHistoryPage onBack={() => setBatchesSubPage("main")} defaultFilter="all" />;
  }
  if (batchesSubPage === "completed") {
    return <BatchHistoryPage onBack={() => setBatchesSubPage("main")} defaultFilter="completed" />;
  }

  return (
    <>
      {isTablet ? (
        <DesktopHero
          bp={bp}
          breadcrumb="SINCE 1999 · WEAVER PORTAL"
          titleMain="My Batches"
          titleSub="& Active Work"
          description={`Track your active and completed batches, view design references, and manage your materials. You have ${myActiveBatches.length} active ${myActiveBatches.length === 1 ? "batch" : "batches"} currently in progress.`}
          pills={[
            { text: `${myActiveBatches.length} Active ${myActiveBatches.length === 1 ? "Batch" : "Batches"}`, color: C.gold },
            { text: `${sareesThisMonth} Sarees This Month` },
            { text: `${qcPassPct}% QC Pass Rate` },
            { text: `${formatMoney(rupees(earnedThisMonth))} Earned` },
          ]}
          alertBadge={identityBadge}
          stats={[
            { label: "Sarees Produced This Month", val: `${sareesThisMonth}`, sub: "Recorded from QC entries" },
            { label: "Quality Check Pass Rate", val: `${qcPassPct}%`, sub: qcPassSub, highlight: true },
            { label: "Total Earned This Month", val: formatMoney(rupees(earnedThisMonth)), sub: "After all deductions" },
            { label: "Active Batches", val: `${myActiveBatches.length}`, sub: `Maximum allowed — ${myActiveBatches.length} of ${MAX_ACTIVE_BATCHES}` },
          ]}
          bgUrl={BG_IMAGE}
        />
      ) : (
        <>
          <WeaverHero
            weaverName={user?.name ?? "Weaver"}
            onExploreBatches={() => document.getElementById("weaver-active-batches")?.scrollIntoView({ behavior: "smooth" })}
            onGoToPayments={() => setActive("payments")}
          />
          <WeaverMetricsBar />
        </>
      )}
      <div id="weaver-active-batches" style={{ padding: isTablet ? "24px 28px 40px" : "64px 48px 56px" }}>
        {/* Defective Saree Warning Alerts */}
        {myDefectiveSarees.map(ds => (
          <div key={ds.sareeId} style={{ background: "rgba(192,57,43,0.05)", border: `1.5px solid ${C.crim}`, borderRadius: 16, padding: "20px 24px", marginBottom: 28, display: "flex", gap: 16, alignItems: "flex-start" }}>
            <AlertTriangle size={24} color={C.crim} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 16.5, color: C.crim, marginBottom: 6 }}>QC Failed — Defective Saree Alert</div>
              <div style={{ fontFamily: F.u, fontSize: 14, color: C.text, lineHeight: 1.6 }}>
                Saree <strong>{ds.sareeId}</strong> in batch <strong>{ds.batchId}</strong> ({ds.sareeTypeName || "Self Brocade"}) failed quality check due to a <strong>{ds.defect}</strong> defect. A payment deduction of <strong><Money value={rupees(ds.deduction)} /></strong> has been registered.
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 12, fontFamily: F.u, fontSize: 13, color: C.muted }}>
                <span>QC Date: {ds.date}</span>
                <span>•</span>
                <span style={{ fontStyle: "italic" }}>Defect photo has been shared with you via WhatsApp</span>
              </div>
            </div>
          </div>
        ))}

        {/* Semi-approved sarees sent back for rework — these are NOT produced
            and have to be handed in again, so they get their own callout
            rather than being folded into the produced/QC counts. */}
        {reworkSarees.map(rs => (
          <div key={rs.sareeId} style={{ background: "rgba(200,155,71,0.07)", border: `1.5px solid ${C.gold}`, borderRadius: 16, padding: "20px 24px", marginBottom: 28, display: "flex", gap: 16, alignItems: "flex-start" }}>
            <RotateCcw size={24} color={C.gold} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 16.5, color: C.gold, marginBottom: 6 }}>Semi-Approved — Rework Needed</div>
              <div style={{ fontFamily: F.u, fontSize: 14, color: C.text, lineHeight: 1.6 }}>
                Saree <strong>{rs.sareeId}</strong> in batch <strong>{rs.batchId}</strong> ({rs.sareeTypeName || "Self Brocade"}) was semi-approved at quality check and sent back to you. It does <strong>not</strong> count as produced yet — rework it and hand it in again, and it will be received and re-inspected.
              </div>
            </div>
          </div>
        ))}

        <GeneralDispatchInstructionsBlock />

        {/* Active Batches */}
        <div style={{ marginBottom: 40 }}>
          <SectionHeading
            title="Active Batches"
            subtitle={`You can have a maximum of ${MAX_ACTIVE_BATCHES} active batches at a time. Complete one before a new batch is assigned.`}
            right={
              <Button onClick={() => setBatchesSubPage("history")} variant="ghost" className="flex items-center gap-1.5 h-auto bg-[rgba(110,15,45,0.06)] border border-[rgba(110,15,45,0.10)] rounded-full px-[18px] py-2 text-sm text-[#6E0F2D] font-semibold">
                <History size={15} color={C.burg} /> View All History
              </Button>
            }
          />
          <div style={{ height: 8 }} />
          <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "1fr 1fr", gap: isTablet ? 18 : 24, marginBottom: 20 }}>
            {!batchesError && myActiveBatches.map((b, idx) => <DesktopActiveBatchCard key={b.batchId} b={b} idx={idx} bp={bp} />)}
            {batchesError ? (
              // Never show the "no batches" empty state on a load failure —
              // that reads as "you have no work" when the real cause is a
              // failed/expired session.
              <div style={{ gridColumn: "1 / -1", padding: "40px 20px", textAlign: "center" as const, background: "rgba(192,57,43,0.05)", borderRadius: 20, border: `1px solid ${C.crim}` }}>
                <AlertTriangle size={32} color={C.crim} style={{ margin: "0 auto 12px" }} />
                <div style={{ fontFamily: F.u, fontSize: 16, color: C.crim, fontWeight: 600 }}>Couldn't load your batches.</div>
                <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, marginTop: 6 }}>
                  {batchesError instanceof Error ? batchesError.message : "Please refresh, or sign out and sign in again."}
                </div>
              </div>
            ) : myActiveBatches.length === 0 && (
              <div style={{ gridColumn: "1 / -1", padding: "40px 20px", textAlign: "center" as const, background: C.cream, borderRadius: 20, border: `1px solid ${C.bdr}` }}>
                <Package size={32} color={C.muted} style={{ margin: "0 auto 12px" }} />
                <div style={{ fontFamily: F.u, fontSize: 16, color: C.muted }}>No active batches assigned to you yet.</div>
              </div>
            )}
          </div>
          {myActiveBatches.length >= MAX_ACTIVE_BATCHES && (
            <div style={{ background: "#FFF8E8", border: `1px solid rgba(200,155,71,0.30)`, borderRadius: 14, padding: "16px 22px", display: "flex", alignItems: "center", gap: 12 }}>
              <AlertCircle size={20} color={C.gold} />
              <span style={{ fontFamily: F.u, fontSize: 14, color: C.muted }}>Maximum {MAX_ACTIVE_BATCHES} active batches reached. Complete one before a new batch can be assigned.</span>
            </div>
          )}
        </div>

        {/* Completed Batches */}
        <div style={{ marginBottom: 40 }}>
          <SectionHeading
            title="Completed Batches"
            subtitle="Recent completed batches — your track record of finished work."
            accent="#1F774E"
            right={
              <Button onClick={() => setBatchesSubPage("completed")} variant="ghost" className="flex items-center gap-1.5 h-auto bg-[rgba(31,119,78,0.06)] border border-[rgba(31,119,78,0.22)] rounded-full px-[18px] py-2 text-sm text-[#1F774E] font-semibold">
                <ListChecks size={15} color="#1F774E" /> See All Completed
              </Button>
            }
          />
          <div style={{ height: 8 }} />
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
            <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.40)", letterSpacing: 1.4, textTransform: "uppercase" as const, marginBottom: 4 }}>QUICK ACTIONS</div>
            <div style={{ fontFamily: F.u, fontSize: 14, color: "rgba(255,255,255,0.75)" }}>Navigate to key tasks</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "repeat(3, 1fr)" }}>
            {[
              { label: "Confirm Materials", sub: "New batch awaiting signature", tab: "confirm" as Tab5, icon: <ClipboardCheck size={18} color={C.gold} />, badge: "Pending" },
              { label: "Raise Warp Request", sub: "Request additional material", tab: "warp" as Tab5, icon: <Package size={18} color={C.gold} />, badge: null },
              { label: "Payment Ledger", sub: "View earnings & deductions", tab: "payments" as Tab5, icon: <CreditCard size={18} color={C.gold} />, badge: null },
            ].map((a, i) => (
              <Button
                key={a.tab}
                onClick={() => setActive(a.tab)}
                variant="ghost"
                className={
                  "flex items-center gap-4 w-full h-auto px-[26px] py-[18px] border-none rounded-none bg-transparent justify-start text-left border-b border-white/[0.07] hover:bg-white/5 " +
                  (!isTablet && i < 2 ? "border-r border-r-white/[0.07]" : "")
                }
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(200,155,71,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{a.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: F.u, fontSize: 14, fontWeight: 600, color: "#FFF", marginBottom: 3 }}>{a.label}</div>
                  <div style={{ fontFamily: F.u, fontSize: 13, color: "rgba(255,255,255,0.45)" }}>{a.sub}</div>
                </div>
                {a.badge && <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.dark, background: C.gold, padding: "3px 10px", borderRadius: 999 }}>{a.badge}</span>}
                <ArrowRight size={16} color="rgba(255,255,255,0.30)" />
              </Button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
