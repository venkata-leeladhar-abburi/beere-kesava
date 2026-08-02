// ── Performance leaderboard + QC results panel (row 1 of the leaderboard section) ─
import { useState } from "react";
import { motion } from "motion/react";
import { Download, FileText } from "lucide-react";
import { Medal, CheckCircle, WarningCircle, Clock } from "@phosphor-icons/react";
import { PieChart, Pie, Cell } from "recharts";
import { T, F } from "../../theme";
import { LEADERBOARD, QC_DATA } from "../../data";
import { FadeUp, Avatar, ActionDialog, qcColor } from "../../common/primitives";
import { DownloadGate } from "../../../../../shared/ui/DownloadAccess";

export function PerformancePanel({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const [reportOpen, setReportOpen] = useState(false);
  return (
    <>
      <FadeUp>
        <div id="weav-performance" style={{ background: "#FFFFFF", borderRadius: 20, border: `1px solid ${T.borderDef}`, boxShadow: "0 6px 32px rgba(74,6,27,0.08)", overflow: "hidden", marginBottom: 24 }}>

          {/* Dark section header */}
          <div style={{ background: `linear-gradient(100deg, ${T.deepWine} 0%, ${T.royalBurgundy} 100%)`, padding: "22px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Medal size={26} color="#FFFDF9" weight="fill" />
              </div>
              <div>
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 22, color: "#FFFDF9", letterSpacing: "-0.2px" }}>Weaver Performance This Month</div>
                <div style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,253,249,0.65)", marginTop: 3 }}>Rankings by sarees produced · Quality check results</div>
              </div>
            </div>
            <DownloadGate>
              <motion.button onClick={() => setReportOpen(true)} whileHover={{ scale: 1.03 }} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,253,249,0.12)", color: "#FFFDF9", border: "1px solid rgba(255,253,249,0.22)", borderRadius: 10, padding: "9px 18px", fontFamily: F.ui, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                <Download size={16} /> Download Full Report
              </motion.button>
            </DownloadGate>
          </div>

          {/* Two-column body */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>

            {/* ── Left: Leaderboard ── */}
            <div style={{ padding: "28px 32px", borderRight: `1px solid ${T.borderDef}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(200,155,71,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Medal size={20} color={T.antiqueGold} weight="fill" />
                </div>
                <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.luxuryBrown }}>Top Weavers This Month</div>
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, marginBottom: 24, paddingLeft: 48 }}>Ranked by number of sarees produced in May 2026</div>

              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {LEADERBOARD.map((l, i) => (
                  <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 18, padding: "18px 0", borderBottom: i < LEADERBOARD.length - 1 ? `1px solid rgba(110,15,45,0.07)` : "none" }}>

                    {/* Rank badge */}
                    <div style={{
                      width: 42, height: 42, borderRadius: 12, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                      background: i === 0 ? "linear-gradient(135deg, #C89B47, #E7C983)" : i === 1 ? "rgba(139,112,96,0.15)" : "rgba(110,15,45,0.06)",
                      border: i === 0 ? "none" : `1px solid rgba(110,15,45,0.10)`,
                    }}>
                      <span style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: i === 0 ? "#FFFFFF" : i === 1 ? T.taupe : "rgba(110,15,45,0.45)" }}>{l.rank}</span>
                    </div>

                    {/* Avatar */}
                    <Avatar photo={l.photo} initials={l.initials} bg={l.bg} size={54} />

                    {/* Name + ID */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 18, color: T.luxuryBrown, lineHeight: 1.2, marginBottom: 3 }}>{l.name}</div>
                      <div style={{ fontFamily: F.mono, fontSize: 13, color: T.royalBurgundy, letterSpacing: "0.4px" }}>{l.id}</div>
                    </div>

                    {/* Stats */}
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontFamily: F.display, fontSize: 28, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1 }}>
                        {l.sarees}
                        <span style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, fontWeight: 400, marginLeft: 5 }}>sarees</span>
                      </div>
                      <div style={{ fontFamily: F.ui, fontSize: 15, color: qcColor(l.rate), fontWeight: 700, marginTop: 4 }}>{l.rate}% pass rate</div>
                    </div>

                    {/* On-time badge */}
                    <div style={{ background: "rgba(30,102,64,0.09)", border: "1px solid rgba(30,102,64,0.22)", borderRadius: 8, padding: "6px 13px", fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.green, flexShrink: 0 }}>
                      On Time
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: QC Results ── */}
            <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(30,102,64,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CheckCircle size={20} color={T.green} weight="fill" />
                    </div>
                    <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.luxuryBrown }}>Quality Check Results</div>
                  </div>
                  <span onClick={() => onNavigate?.("QcHistory")} style={{ fontFamily: F.ui, fontSize: 13, color: T.antiqueGold, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}
                    onMouseEnter={e => e.currentTarget.style.color = T.royalBurgundy}
                    onMouseLeave={e => e.currentTarget.style.color = T.antiqueGold}>
                    View Details →
                  </span>
                </div>
                <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, marginBottom: 28, paddingLeft: 48 }}>All sarees submitted for quality inspection this month</div>

                {/* Pie + legend */}
                <div style={{ display: "flex", alignItems: "center", gap: 36, marginBottom: 24 }}>
                  {/* Bigger donut — 210px */}
                  <div style={{ position: "relative", width: 210, height: 210, flexShrink: 0 }}>
                    <PieChart width={210} height={210}>
                      <Pie data={QC_DATA} cx={105} cy={105} innerRadius={76} outerRadius={100} paddingAngle={3} dataKey="value" stroke="none">
                        {QC_DATA.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                    </PieChart>
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                      <div style={{ fontFamily: F.display, fontSize: 42, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1 }}>248</div>
                      <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe, marginTop: 5, textAlign: "center", lineHeight: 1.4 }}>sarees<br />this month</div>
                    </div>
                  </div>

                  {/* Legend — slimmer bars */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
                    {QC_DATA.map(d => (
                      <div key={d.name}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                            <span style={{ fontFamily: F.ui, fontSize: 16, color: T.luxuryBrown, fontWeight: 600 }}>{d.name}</span>
                          </div>
                          <span style={{ fontFamily: F.display, fontSize: 28, fontWeight: 700, color: d.color }}>{d.value}</span>
                        </div>
                        {/* Slim bar — 5px */}
                        <div style={{ height: 5, background: "rgba(110,15,45,0.07)", borderRadius: 99, overflow: "hidden" }}>
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${Math.round((d.value / 248) * 100)}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
                            style={{ height: "100%", background: d.color, borderRadius: 99 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rejection note */}
                <div style={{ background: "rgba(192,57,43,0.05)", border: "1px solid rgba(192,57,43,0.14)", borderRadius: 14, padding: "18px 22px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <WarningCircle size={18} color={T.crimson} weight="fill" />
                    <span style={{ fontFamily: F.ui, fontSize: 15, fontWeight: 700, color: T.crimson }}>Most common rejection reasons</span>
                  </div>
                  <div style={{ fontFamily: F.ui, fontSize: 15, color: T.taupe, lineHeight: 1.6 }}>
                    Defective threads <strong style={{ color: T.crimson }}>6 sarees</strong> · Weight issue <strong style={{ color: T.crimson }}>4 sarees</strong>
                  </div>
                </div>
              </div>

              {/* Two mini-stat boxes */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[
                  { label: "Pending Quality Checks", value: "12 sarees", color: T.antiqueGold, bg: "rgba(200,155,71,0.07)", border: "rgba(200,155,71,0.22)", PhIcon: Clock },
                  { label: "Overall Defect Rate", value: "4%", color: T.crimson, bg: "rgba(192,57,43,0.05)", border: "rgba(192,57,43,0.18)", PhIcon: WarningCircle },
                ].map(s => (
                  <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 16, padding: "20px 22px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
                      <s.PhIcon size={18} color={s.color} weight="fill" />
                      <div style={{ fontFamily: F.mono, fontSize: 11, color: s.color, textTransform: "uppercase", letterSpacing: "1.2px", fontWeight: 600 }}>{s.label}</div>
                    </div>
                    <div style={{ fontFamily: F.display, fontSize: 36, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </FadeUp>

      <ActionDialog open={reportOpen} title="Download weaver performance report" onClose={() => setReportOpen(false)}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", fontFamily: F.ui, color: T.luxuryBrown, lineHeight: 1.6 }}><FileText size={34} color={T.royalBurgundy} /><div><b>May 2026 full report is ready.</b><br />Includes leaderboard, QC pass/reject summary, pending dues, and batch-wise production.</div></div>
        <button onClick={() => setReportOpen(false)} style={{ marginTop: 22, width: "100%", background: T.royalBurgundy, color: "#fff", border: "none", borderRadius: 12, padding: 14, fontFamily: F.ui, fontWeight: 700, cursor: "pointer" }}><Download size={16} /> Download PDF</button>
      </ActionDialog>
    </>
  );
}
