import React, { useRef } from "react";
import { motion, useInView } from "motion/react";
import {
  ChevronRight, Package, Shield, CheckCircle2, ClipboardList,
} from "lucide-react";
import { C, F } from "./tokens";
import { PageHero, StatsStrip, SectionHeading, GUTTER_X, type WorkerStat } from "./primitives";
import { Button } from "../../../../shared/ui/primitives";
import { useAuth } from "../../../../contexts/AuthContext";
import { useBatches } from "../../../production/contexts/BatchContext";
import { useQc } from "../../../qc/contexts/QcContext";

type Tab = "home" | "qc" | "weavers";
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
  const { batches } = useBatches();
  const { qcRecords } = useQc();

  const firstName = user?.name ? user.name.split(" ")[0] : "Staff";

  const pendingReceiptCount = batches
    .filter(b => b.status === "active")
    .flatMap(b => b.rows)
    .filter(r => r.sareeId && !r.receivedAt).length;

  const pendingQcCount = batches
    .filter(b => b.status === "active")
    .flatMap(b => b.rows)
    .filter(r => r.sareeId && r.receivedAt && r.qcPassed == null).length;

  const tasks = [
    {
      icon: Package, iconBg: "#B8860B", accentColor: "#B8860B",
      title: "Sarees Received — Record Them",
      badge: `${pendingReceiptCount} sarees`, badgeColor: C.burg,
      sub: "Completed sarees submitted by weavers — enter weight and details",
      tab: "weavers" as Tab, sub2: "receive-sarees" as WeaversSubPage,
    },
    {
      icon: Shield, iconBg: C.crim, accentColor: C.crim,
      title: "Sarees Awaiting Quality Check",
      badge: `${pendingQcCount} pending`, badgeColor: C.crim,
      sub: "Inspect sarees submitted by weavers before they move to stock",
      tab: "qc" as Tab,
    },
  ];

  const totalTasks = (pendingReceiptCount > 0 ? 1 : 0) + (pendingQcCount > 0 ? 1 : 0);

  const activities = qcRecords.slice(0, 5).map(r => ({
    // Gold never encodes state (design-system/01-FOUNDATIONS.md) — pass/fail
    // reads as the semantic success/danger pair, same as admin.
    dot: r.result === "passed" ? C.green : C.crim,
    desc: `Saree ${r.sareeId} ${r.result === "passed" ? "passed" : "failed"} quality check`,
    time: new Date(r.qcDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
    id: r.batchId || "QC",
  }));

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const stats: WorkerStat[] = [
    { label: "Active tasks today", value: totalTasks, sub: totalTasks > 0 ? "Waiting on you right now" : "All caught up", icon: ClipboardList, highlight: totalTasks > 0 },
    { label: "Sarees to record", value: pendingReceiptCount, sub: "Submitted by weavers", icon: Package },
    { label: "Awaiting quality check", value: pendingQcCount, sub: pendingQcCount > 0 ? "⚠ Need inspection" : "All inspected", icon: Shield, alert: pendingQcCount > 0 },
    { label: "Recent QC activity", value: qcRecords.length, sub: "Inspections on record", icon: CheckCircle2 },
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
      <div style={{ position: "relative" }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{ position: "absolute", top: -308, right: GUTTER_X, fontFamily: F.m, fontSize: 12, color: "rgba(255,253,249,0.45)", background: "rgba(255,253,249,0.08)", border: "1px solid rgba(255,253,249,0.12)", padding: "6px 14px", borderRadius: 8, zIndex: 21 }}
        >
          {today}
        </motion.div>
      </div>

      <StatsStrip stats={stats} />

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <div className="px-4 md:px-7 xl:px-12" style={{ paddingTop: 40, paddingBottom: 64 }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 400px", gap: 40, alignItems: "start" }}>

          {/* ── Today's Tasks ─────────────────────────────────────────── */}
          <div>
            <FadeUp>
              <SectionHeading
                title="Today's Tasks"
                size="lg"
                right={<span style={{ fontFamily: F.u, fontSize: 14, color: C.gold, fontWeight: 600 }}>{totalTasks} pending →</span>}
              />
            </FadeUp>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {tasks.map((task, i) => {
                const Icon = task.icon;
                return (
                  <FadeUp key={i} delay={i * 0.07}>
                    <motion.div
                      whileHover={{ y: -3, boxShadow: "0 16px 48px rgba(110,15,45,0.14)" }}
                      whileTap={{ scale: 0.99 }}
                      transition={{ type: "spring", stiffness: 300, damping: 24 }}
                      style={{ borderRadius: 20, ["--accent-color" as string]: task.accentColor } as React.CSSProperties}
                    >
                      <Button
                        variant="tertiary"
                        fullWidth
                        onClick={() => onNavigate(task.tab, task.sub2)}
                        className="h-auto justify-start gap-5 rounded-[20px] border border-[rgba(110,15,45,0.10)] border-l-4 border-l-[var(--accent-color)] bg-white px-6 py-[22px] text-left shadow-[0_6px_32px_rgba(74,6,27,0.08)]"
                      >
                        <div style={{ width: 56, height: 56, borderRadius: 16, background: task.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 6px 18px ${task.iconBg}55` }}>
                          <Icon size={26} color="#FFF" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                            <span style={{ fontFamily: F.u, fontSize: 18, fontWeight: 600, color: C.wine, letterSpacing: "-0.01em" }}>{task.title}</span>
                            <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: "#FFF", background: task.badgeColor, padding: "3px 10px", borderRadius: 999 }}>{task.badge}</span>
                          </div>
                          <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, lineHeight: 1.5 }}>{task.sub}</div>
                        </div>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(110,15,45,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <ChevronRight size={18} color={C.muted} />
                        </div>
                      </Button>
                    </motion.div>
                  </FadeUp>
                );
              })}
            </div>
          </div>

          {/* ── Right column: Activity + Quick Actions ─────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Recent Activity */}
            <FadeUp delay={0.2}>
              <SectionHeading
                title="Recent Activity"
                right={<span style={{ fontFamily: F.u, fontSize: 13, color: C.gold, fontWeight: 600 }}>View All →</span>}
              />
              <div style={{ background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 20, overflow: "hidden", boxShadow: "0 6px 32px rgba(74,6,27,0.08)" }}>
                {activities.map((a, i) => (
                  <div
                    key={i}
                    style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 20px", borderBottom: i < activities.length - 1 ? `1px solid rgba(110,15,45,0.07)` : "none" }}
                  >
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: a.dot, marginTop: 5, flexShrink: 0, boxShadow: `0 0 8px ${a.dot}60` }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: F.u, fontSize: 14, color: C.dark, lineHeight: 1.5, marginBottom: 3 }}>{a.desc}</div>
                      <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted }}>{a.time}</div>
                    </div>
                    <div style={{ fontFamily: F.m, fontSize: 12, color: C.burg, flexShrink: 0, background: "rgba(110,15,45,0.06)", padding: "2px 8px", borderRadius: 6 }}>{a.id}</div>
                  </div>
                ))}
              </div>
            </FadeUp>

          </div>
        </div>
      </div>

    </div>
  );
}
