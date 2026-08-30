import React, { useRef } from "react";
import { motion, useInView } from "motion/react";
import {
  ChevronRight, Package, Shield, CheckCircle2, ClipboardList,
} from "lucide-react";
import { C, F } from "./tokens";
import { PageHero, StatsStrip, SectionHeading, type WorkerStat } from "./primitives";
import { Button } from "../../../../shared/ui/primitives";
import { useAuth } from "../../../../contexts/AuthContext";
import { useBatches } from "@/features/production";
import { useQc } from "@/features/qc";
import { buildWorkerActivity, formatActivityTime } from "./activityFeed";
import { Skeleton, StatusPill } from "../../../../shared/ui/primitives";

type Tab = "home" | "qc" | "weavers" | "activity";
type WeaversSubPage = "menu" | "design" | "issue" | "receive-sarees";

interface WorkerHomeDesktopProps {
  onNavigate: (tab: Tab, sub?: WeaversSubPage) => void;
}

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function FadeUp({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px 0px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: EASE, delay }}
      style={style}>
      {children}
    </motion.div>
  );
}



export function WorkerHomeDesktop({ onNavigate }: WorkerHomeDesktopProps) {
  const { user } = useAuth();
  const { batches, isLoading: batchesLoading, isError: batchesError, refetch: refetchBatches } = useBatches();
  const { qcRecords, isLoading: qcLoading, isError: qcError, refetch: refetchQc } = useQc();

  const firstName = user?.name ? user.name.split(" ")[0] : "Staff";

  const pendingReceiptCount = batches
    .filter(b => b.status === "active")
    .flatMap(b => b.rows)
    .filter(r => r.sareeId && !r.receivedAt).length;

  const pendingQcCount = batches
    .filter(b => b.status === "active")
    .flatMap(b => b.rows)
    .filter(r => r.sareeId && r.receivedAt && r.qcPassed == null).length;


  const totalTasks = (pendingReceiptCount > 0 ? 1 : 0) + (pendingQcCount > 0 ? 1 : 0);

  // Sorted, de-duplicated and labelled by the shared builder — the old inline
  // map took the API's own order (so "recent" wasn't), called a `semi` result
  // "failed", and repeated a saree re-inspected within the same minute.
  const activities = React.useMemo(
    () => buildWorkerActivity(qcRecords, batches).slice(0, 6),
    [qcRecords, batches],
  );

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const activityLoading = qcLoading || batchesLoading;
  const activityError = !activityLoading && (qcError || batchesError);
  const retryActivity = () => {
    if (qcError) refetchQc();
    if (batchesError) refetchBatches();
  };

  const batchesUnavailable = batchesLoading || batchesError;
  const qcUnavailable = qcLoading || qcError;

  const stats: WorkerStat[] = [
    {
      label: "Active tasks today",
      value: batchesUnavailable || qcUnavailable ? (batchesLoading || qcLoading ? "…" : "Error") : totalTasks,
      sub: batchesError || qcError ? "Tap to retry" : totalTasks > 0 ? "Waiting on you right now" : "All caught up",
      icon: ClipboardList,
      highlight: totalTasks > 0,
      onClick: (batchesError || qcError) ? () => { if (batchesError) refetchBatches(); if (qcError) refetchQc(); } : undefined,
    },
    {
      label: "Sarees to record",
      value: batchesUnavailable ? (batchesLoading ? "…" : "Error") : pendingReceiptCount,
      sub: batchesError ? "Tap to retry" : "Submitted by weavers",
      icon: Package,
      onClick: batchesError ? () => refetchBatches() : undefined,
    },
    {
      label: "Awaiting quality check",
      value: batchesUnavailable ? (batchesLoading ? "…" : "Error") : pendingQcCount,
      sub: batchesError ? "Tap to retry" : pendingQcCount > 0 ? "⚠ Need inspection" : "All inspected",
      icon: Shield,
      alert: pendingQcCount > 0,
      onClick: batchesError ? () => refetchBatches() : undefined,
    },
    {
      label: "Recent QC activity",
      value: qcUnavailable ? (qcLoading ? "…" : "Error") : qcRecords.length,
      sub: qcError ? "Tap to retry" : "Inspections on record",
      icon: CheckCircle2,
      onClick: qcError ? () => refetchQc() : undefined,
    },
  ];

  return (
    <div style={{ background: C.bg }}>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <PageHero
        eyebrow="Worker Staff Portal · Beere Kesava & Brothers Silks"
        title={greeting + ","}
        titleAccent={firstName}
        description={`Here's what needs your attention today. You have ${totalTasks} active task${totalTasks === 1 ? "" : "s"} waiting.`}
        actions={
          <Button
            variant="primary"
            iconRight={ChevronRight}
            onClick={() => onNavigate("qc")}
            className="rounded-[14px] bg-gradient-to-br from-[#6E0F2D] to-[#4A061B] px-6 py-[13px] text-[#FFFDF9] shadow-[0_8px_28px_rgba(110,15,45,0.45)] hover:from-[#6E0F2D] hover:to-[#4A061B]"
          >
            Start Today's Work
          </Button>
        }
      />

      {/* Date chip, pinned to the hero like admin's */}
      <div className="relative hidden md:block">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{ position: "absolute", top: -308, right: 48, fontFamily: F.m, fontSize: 12, color: "rgba(255,253,249,0.45)", background: "rgba(255,253,249,0.08)", border: "1px solid rgba(255,253,249,0.12)", padding: "6px 14px", borderRadius: 8, zIndex: 21 }}
        >
          {today}
        </motion.div>
      </div>

      <StatsStrip stats={stats} />

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <div className="px-4 md:px-7 xl:px-12" style={{ paddingTop: 40, paddingBottom: 64 }}>
        <div className="max-w-[800px]">
          {/* Recent Activity */}
          <FadeUp delay={0.2}>
            <SectionHeading
              title="Recent Activity"
              right={
                <Button
                  variant="link"
                  onClick={() => onNavigate("activity")}
                  className="p-0 h-auto"
                >
                  <span style={{ fontFamily: F.u, fontSize: 13, color: C.gold, fontWeight: 600 }}>View All →</span>
                </Button>
              }
            />
            <div style={{ background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 20, overflow: "hidden", boxShadow: "0 6px 32px rgba(74,6,27,0.08)" }}>
              {activityLoading && (
                <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
                  {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              )}

              {!activityLoading && activityError && (
                <div style={{ padding: "28px 20px", textAlign: "center" }}>
                  <div style={{ fontFamily: F.u, fontSize: 14, color: C.dark, marginBottom: 10 }}>
                    Couldn't load recent activity.
                  </div>
                  <Button variant="secondary" onClick={retryActivity}>Try again</Button>
                </div>
              )}

              {!activityLoading && !activityError && activities.length === 0 && (
                <div style={{ padding: "28px 20px", textAlign: "center" }}>
                  <div style={{ fontFamily: F.u, fontSize: 14, color: C.dark, marginBottom: 4 }}>No activity yet</div>
                  <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>
                    Quality checks and saree receipts will show up here as you record them.
                  </div>
                </div>
              )}

              {!activityLoading && !activityError && activities.map((a, i) => (
                <div
                  key={a.id}
                  style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 20px", borderBottom: i < activities.length - 1 ? `1px solid rgba(110,15,45,0.07)` : "none" }}
                >
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: dotColor(a.tone), marginTop: 5, flexShrink: 0, boxShadow: `0 0 8px ${dotColor(a.tone)}60` }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: F.u, fontSize: 14, color: C.dark, lineHeight: 1.5, marginBottom: 3 }}>{a.description}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: F.m, fontSize: 12, color: C.muted }}>{formatActivityTime(a.isoDate)}</span>
                      <StatusPill tone={a.tone} label={a.label} size="sm" />
                    </div>
                  </div>
                  <div style={{ fontFamily: F.m, fontSize: 12, color: C.burg, flexShrink: 0, background: "rgba(110,15,45,0.06)", padding: "2px 8px", borderRadius: 6 }}>{a.batchId || "—"}</div>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </div>

    </div>
  );
}

/** Feed dot colour. Gold never encodes state, so `warning` uses the amber the
 *  StatusPill uses rather than the brand gold (design-system/01-FOUNDATIONS.md). */
function dotColor(tone: "success" | "warning" | "danger" | "brand" | "neutral"): string {
  if (tone === "success") return C.green;
  if (tone === "danger") return C.crim;
  if (tone === "warning") return "#B45309";
  if (tone === "brand") return C.burg;
  return C.muted;
}
