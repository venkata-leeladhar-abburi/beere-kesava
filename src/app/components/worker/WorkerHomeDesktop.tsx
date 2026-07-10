import React, { useRef } from "react";
import { motion, useInView } from "motion/react";
import {
  ChevronRight, Package, Shield,
} from "lucide-react";
import { C, F } from "./tokens";

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

const tasks = [
  {
    icon: Package, iconBg: "#B8860B", accentColor: "#B8860B",
    title: "Sarees Received — Record Them",
    badge: "8 sarees", badgeColor: C.burg,
    sub: "Completed sarees submitted by weavers — enter weight and details",
    tab: "weavers" as Tab, sub2: "receive-sarees" as WeaversSubPage,
  },
  {
    icon: Shield, iconBg: C.crim, accentColor: C.crim,
    title: "Sarees Awaiting Quality Check",
    badge: "6 pending", badgeColor: C.crim,
    sub: "Inspect sarees submitted by weavers before they move to stock",
    tab: "qc" as Tab,
  },
];

const activities = [
  { dot: C.green, desc: "6 sarees received from Suresh Murti",  time: "Today · 11:42 AM", id: "BATCH-081"     },
  { dot: C.gold,  desc: "Saree PADMA-L1-004 passed quality check", time: "Today · 10:30 AM", id: "BATCH-086"  },
];

export function WorkerHomeDesktop({ onNavigate }: WorkerHomeDesktopProps) {
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div style={{ background: "#F7F2EA" }}>

      {/* ── HERO SECTION ──────────────────────────────────────────────────── */}
      <section style={{ position: "relative", background: C.dark, overflow: "hidden", minHeight: 260, display: "flex", alignItems: "center" }}>
        {/* Grid texture */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(196,146,58,0.022) 60px, rgba(196,146,58,0.022) 61px), repeating-linear-gradient(90deg, transparent, transparent 80px, rgba(196,146,58,0.015) 80px, rgba(196,146,58,0.015) 81px)` }} />
        {/* Right glow */}
        <div style={{ position: "absolute", right: -120, top: "50%", transform: "translateY(-50%)", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, rgba(196,146,58,0.12) 0%, transparent 70%)`, pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 2, padding: "64px 56px", width: "100%" }}>
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, ease: EASE }}
            style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}
          >
            <div style={{ width: 24, height: 1.5, background: C.gold, opacity: 0.7 }} />
            <span style={{ fontFamily: F.m, fontSize: 11, color: "rgba(196,146,58,0.80)", letterSpacing: "3px", textTransform: "uppercase" }}>
              Worker Staff Portal · Beere Kesava &amp; Brothers Silks
            </span>
          </motion.div>

          <div style={{ overflow: "hidden", marginBottom: 8 }}>
            <motion.div
              initial={{ y: "110%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              transition={{ duration: 0.85, delay: 0.2, ease: EASE }}
              style={{ fontFamily: F.d, fontSize: "clamp(30px, 3vw, 48px)", fontWeight: 700, color: "#FFFDF9", lineHeight: 1.1, letterSpacing: "-0.5px" }}
            >
              {greeting}, Ravi 👋
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            style={{ fontFamily: F.u, fontSize: 17, color: "rgba(245,232,208,0.75)", margin: "0 0 28px", maxWidth: 520, lineHeight: 1.7 }}
          >
            Here's what needs your attention today. You have <strong style={{ color: C.gold }}>2 active tasks</strong> waiting.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6, ease: EASE }}
            style={{ display: "flex", gap: 12, alignItems: "center" }}
          >
            <button
              onClick={() => onNavigate("qc")}
              style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "13px 24px", borderRadius: 14, border: "none", cursor: "pointer", background: `linear-gradient(135deg, ${C.burg} 0%, ${C.dark} 100%)`, fontFamily: F.u, fontWeight: 600, fontSize: 15, color: "#FFFDF9", boxShadow: `0 8px 28px rgba(107,26,42,0.40)` }}
            >
              Start Today's Work <ChevronRight size={16} />
            </button>
          </motion.div>

          {/* Date chip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            style={{ position: "absolute", top: 32, right: 56, fontFamily: F.m, fontSize: 12, color: "rgba(255,253,249,0.45)", background: "rgba(255,253,249,0.08)", border: "1px solid rgba(255,253,249,0.12)", padding: "6px 14px", borderRadius: 8 }}
          >
            {today}
          </motion.div>
        </div>
      </section>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <div style={{ padding: "48px 56px 64px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 28, alignItems: "start" }}>

          {/* ── Today's Tasks ─────────────────────────────────────────── */}
          <div>
            <FadeUp>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 4, height: 26, background: C.gold, borderRadius: 2 }} />
                  <span style={{ fontFamily: F.d, fontSize: 24, fontWeight: 700, color: C.dark }}>Today's Tasks</span>
                </div>
                <span style={{ fontFamily: F.u, fontSize: 14, color: C.gold, cursor: "pointer", fontWeight: 600 }}>2 pending →</span>
              </div>
            </FadeUp>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {tasks.map((task, i) => {
                const Icon = task.icon;
                return (
                  <FadeUp key={i} delay={i * 0.07}>
                    <motion.button
                      onClick={() => onNavigate(task.tab, task.sub2)}
                      whileHover={{ y: -3, boxShadow: "0 16px 48px rgba(107,26,42,0.14)" }}
                      whileTap={{ scale: 0.99 }}
                      transition={{ type: "spring", stiffness: 300, damping: 24 }}
                      style={{
                        display: "flex", alignItems: "center", gap: 20, padding: "22px 24px",
                        background: "#FFFFFF", border: `1px solid rgba(110,15,45,0.10)`,
                        borderLeft: `4px solid ${task.accentColor}`,
                        borderRadius: 18, boxShadow: "0 4px 16px rgba(107,26,42,0.06)",
                        cursor: "pointer", width: "100%", textAlign: "left",
                        transition: "box-shadow 0.2s",
                      }}
                    >
                      <div style={{ width: 56, height: 56, borderRadius: 16, background: task.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 6px 18px ${task.iconBg}55` }}>
                        <Icon size={26} color="#FFF" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                          <span style={{ fontFamily: F.d, fontSize: 17, fontWeight: 600, color: C.dark }}>{task.title}</span>
                          <span style={{ fontFamily: F.u, fontSize: 11, fontWeight: 700, color: "#FFF", background: task.badgeColor, padding: "3px 10px", borderRadius: 999 }}>{task.badge}</span>
                        </div>
                        <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, lineHeight: 1.5 }}>{task.sub}</div>
                      </div>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(107,26,42,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <ChevronRight size={18} color={C.muted} />
                      </div>
                    </motion.button>
                  </FadeUp>
                );
              })}
            </div>
          </div>

          {/* ── Right column: Activity + Quick Actions ─────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Recent Activity */}
            <FadeUp delay={0.2}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 4, height: 22, background: C.gold, borderRadius: 2 }} />
                  <span style={{ fontFamily: F.d, fontSize: 20, fontWeight: 700, color: C.dark }}>Recent Activity</span>
                </div>
                <span style={{ fontFamily: F.u, fontSize: 13, color: C.gold, cursor: "pointer", fontWeight: 600 }}>View All →</span>
              </div>
              <div style={{ background: "#FFF", border: `1px solid rgba(110,15,45,0.10)`, borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 18px rgba(107,26,42,0.06)" }}>
                {activities.map((a, i) => (
                  <div
                    key={i}
                    style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 20px", borderBottom: i < activities.length - 1 ? `1px solid rgba(110,15,45,0.07)` : "none" }}
                  >
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: a.dot, marginTop: 5, flexShrink: 0, boxShadow: `0 0 8px ${a.dot}60` }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: F.u, fontSize: 14, color: C.dark, lineHeight: 1.5, marginBottom: 3 }}>{a.desc}</div>
                      <div style={{ fontFamily: F.m, fontSize: 11, color: C.muted }}>{a.time}</div>
                    </div>
                    <div style={{ fontFamily: F.m, fontSize: 12, color: C.burg, flexShrink: 0, background: "rgba(107,26,42,0.06)", padding: "2px 8px", borderRadius: 6 }}>{a.id}</div>
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
