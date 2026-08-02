// ── Weaver activity feed panel (row 2 of the leaderboard section) ──────────
import React from "react";
import { motion } from "motion/react";
import { Bell } from "lucide-react";
import { ChartBar } from "@phosphor-icons/react";
import { T, F } from "../../theme";
import { ACTIVITIES, ACTIVITY_ICONS } from "../../data";
import { FadeUp } from "../../common/primitives";

export function ActivitiesPanel({ onActivities }: { onActivities: () => void }) {
  const activitiesNeedingAction = ACTIVITIES.filter(a => a.needsAction).length;
  return (
      <FadeUp delay={0.12}>
        <div id="weav-activities" style={{ background: "#FFFFFF", borderRadius: 20, border: `1px solid ${T.borderDef}`, boxShadow: "0 6px 32px rgba(74,6,27,0.07)", overflow: "hidden" }}>

          {/* Header bar */}
          <div style={{ background: `linear-gradient(100deg, ${T.luxuryBrown} 0%, #5A3220 100%)`, padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChartBar size={24} color="#FFFDF9" weight="fill" />
              </div>
              <div>
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#FFFDF9" }}>Weaver Activities</div>
                <div style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,253,249,0.60)", marginTop: 2 }}>
                  What's happened, and what's waiting on you
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {activitiesNeedingAction > 0 && (
                <span style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(200,155,71,0.18)", color: T.goldLight, border: "1px solid rgba(200,155,71,0.40)", borderRadius: 999, padding: "7px 14px", fontFamily: F.ui, fontSize: 13, fontWeight: 700 }}>
                  <Bell size={14} /> {activitiesNeedingAction} need{activitiesNeedingAction === 1 ? "s" : ""} your action
                </span>
              )}
              <motion.button onClick={onActivities} whileHover={{ scale: 1.03 }} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,253,249,0.12)", color: "#FFFDF9", border: "1px solid rgba(255,253,249,0.20)", borderRadius: 10, padding: "9px 18px", fontFamily: F.ui, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                <Bell size={16} /> View All Activities
              </motion.button>
            </div>
          </div>

          {/* Activity feed — one row per event, full detail always visible,
              actionable items called out with an amber rail + a way to act on
              them right there rather than needing to guess what to do next. */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {ACTIVITIES.map((a, i) => {
              const cfg = ACTIVITY_ICONS[a.icon] ?? { PhIcon: ChartBar, bg: "rgba(110,15,45,0.07)", color: T.taupe };
              const PhIcon = cfg.PhIcon as React.ElementType;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06, ease: [0.25, 0.1, 0.25, 1] }}
                  whileHover={{ background: "rgba(247,242,234,0.55)" }}
                  style={{
                    padding: "20px 32px",
                    borderBottom: i < ACTIVITIES.length - 1 ? `1px solid ${T.borderDef}` : "none",
                    borderLeft: a.needsAction ? `3px solid ${T.antiqueGold}` : "3px solid transparent",
                    display: "flex", alignItems: "flex-start", gap: 16,
                    background: a.needsAction ? "rgba(200,155,71,0.05)" : "#FFFFFF",
                  }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <PhIcon size={22} color={cfg.color} weight="fill" />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const, marginBottom: 4 }}>
                      <span style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 15, color: T.luxuryBrown }}>{a.action}</span>
                      <span style={{ fontFamily: F.mono, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase" as const, color: T.taupe, background: T.silkCream, borderRadius: 999, padding: "2px 8px" }}>{a.category}</span>
                      {a.needsAction && (
                        <span style={{ fontFamily: F.ui, fontSize: 10.5, fontWeight: 700, color: "#8B6018", background: "rgba(200,155,71,0.18)", borderRadius: 999, padding: "2px 9px" }}>Needs action</span>
                      )}
                    </div>
                    <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, lineHeight: 1.55 }}>{a.detail}</div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                    <span style={{ fontFamily: F.mono, fontSize: 11.5, color: T.taupe, whiteSpace: "nowrap" as const }}>{a.time}</span>
                    {a.needsAction && (
                      <button onClick={onActivities}
                        style={{ display: "flex", alignItems: "center", gap: 5, background: T.royalBurgundy, color: "#FFF", border: "none", borderRadius: 8, padding: "6px 13px", fontFamily: F.ui, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as const }}>
                        Review →
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

        </div>
      </FadeUp>
  );
}
