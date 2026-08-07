// ── Performance leaderboard + QC results panel (row 1 of the leaderboard section) ─
import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText } from "lucide-react";
import { Medal, CheckCircle, WarningCircle, Clock } from "@phosphor-icons/react";
import { PieChart, Pie, Cell } from "recharts";
import { T, F } from "../../theme";
import { FadeUp, Avatar, ActionDialog, qcColor } from "../../common/primitives";
import { DownloadGate } from "../../../../../shared/ui/DownloadAccess";
import { Button } from "../../../../../shared/ui/primitives";
import { weaversApi } from "../../../../../shared/api/weavers";
import { resolveAssetUrl } from "../../../../../shared/api/uploads";
import { reportsApi } from "../../../../../shared/api/reports";
import { qcApi } from "../../../../../shared/api/qc";

export function PerformancePanel({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const [reportOpen, setReportOpen] = useState(false);

  // Real top-10 leaderboard, ranked by QC pass rate (see GET /weavers/leaderboard).
  const { data: leaderboard = [], isLoading, isError } = useQuery({
    queryKey: ["weavers-leaderboard"],
    queryFn: () => weaversApi.getLeaderboard(),
  });

  const { data: production } = useQuery({
    queryKey: ["reports", "production-summary"],
    queryFn: () => reportsApi.productionSummary(),
  });

  const { data: qcRes } = useQuery({
    queryKey: ["reports", "qc-list-performance"],
    queryFn: () => qcApi.list(500),
  });

  // Real QC Pass / Reject donut data
  const passedCount = production?.qcByResult.PASSED ?? 0;
  const semiCount = production?.qcByResult.SEMI ?? 0;
  const rejectedCount = production?.qcByResult.DEFECTIVE ?? 0;
  const totalQcSarees = passedCount + semiCount + rejectedCount;

  const qcDonutData = useMemo(() => [
    { name: "Passed", value: passedCount + semiCount, color: T.green },
    { name: "Rejected", value: rejectedCount, color: T.crimson },
  ], [passedCount, semiCount, rejectedCount]);

  // Real rejection reasons from QC records
  const defectCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (qcRes?.items) {
      for (const q of qcRes.items) {
        if (q.defects && q.defects.length > 0) {
          for (const d of q.defects) {
            counts[d] = (counts[d] || 0) + 1;
          }
        }
      }
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [qcRes]);

  const overallDefectRate = totalQcSarees > 0 ? Math.round((rejectedCount / totalQcSarees) * 100) : 0;
  const pendingQC = production?.finishingByStatus?.["AWAITING_RETURN"] ?? 0;

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
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#FFFDF9", letterSpacing: "-0.2px" }}>Weaver Performance This Month</div>
                <div style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,253,249,0.65)", marginTop: 3 }}>Rankings by sarees produced · Quality check results</div>
              </div>
            </div>
            <DownloadGate>
              <Button onClick={() => setReportOpen(true)} variant="secondary" iconLeft={Download} className="bg-white/10 text-[#FFFDF9] border-white/20">
                Download Full Report
              </Button>
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
              <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, marginBottom: 24, paddingLeft: 48 }}>Ranked by QC pass rate, all-time</div>

              {isLoading ? (
                <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, padding: "24px 0", textAlign: "center" }}>Loading leaderboard…</div>
              ) : isError ? (
                <div style={{ fontFamily: F.ui, fontSize: 14, color: T.crimson, padding: "24px 0", textAlign: "center" }}>Couldn't load the leaderboard.</div>
              ) : leaderboard.length === 0 ? (
                <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, padding: "24px 0", textAlign: "center", fontStyle: "italic" }}>No weaver performance data yet.</div>
              ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {leaderboard.map((l, i) => (
                  <div key={l.weaverId} style={{ display: "flex", alignItems: "center", gap: 18, padding: "18px 0", borderBottom: i < leaderboard.length - 1 ? `1px solid rgba(110,15,45,0.07)` : "none" }}>

                    {/* Rank badge */}
                    <div style={{
                      width: 42, height: 42, borderRadius: 12, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                      background: i === 0 ? "linear-gradient(135deg, #C89B47, #E7C983)" : i === 1 ? "rgba(139,112,96,0.15)" : "rgba(110,15,45,0.06)",
                      border: i === 0 ? "none" : `1px solid rgba(110,15,45,0.10)`,
                    }}>
                      <span style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: i === 0 ? "#FFFFFF" : i === 1 ? T.taupe : "rgba(110,15,45,0.45)" }}>{i + 1}</span>
                    </div>

                    {/* Avatar */}
                    <Avatar photo={resolveAssetUrl(l.photoUrl)} initials={l.initials} bg={T.royalBurgundy} size={54} />

                    {/* Name + ID */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 18, color: T.luxuryBrown, lineHeight: 1.2, marginBottom: 3 }}>{l.name}</div>
                      <div style={{ fontFamily: F.mono, fontSize: 13, color: T.royalBurgundy, letterSpacing: "0.4px" }}>{l.village || "—"}</div>
                    </div>

                    {/* Stats */}
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1 }}>
                        {l.totalSareesWoven}
                        <span style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, fontWeight: 400, marginLeft: 5 }}>sarees</span>
                      </div>
                      <div style={{ fontFamily: F.ui, fontSize: 14, color: qcColor(l.qcPassRate), fontWeight: 700, marginTop: 4 }}>{l.qcPassRate}% pass rate</div>
                    </div>
                  </div>
                ))}
              </div>
              )}
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
                <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, marginBottom: 28, paddingLeft: 48 }}>All sarees submitted for quality inspection</div>

                {/* Pie + legend */}
                <div style={{ display: "flex", alignItems: "center", gap: 36, marginBottom: 24 }}>
                  <div style={{ position: "relative", width: 210, height: 210, flexShrink: 0 }}>
                    <PieChart width={210} height={210}>
                      <Pie data={qcDonutData.filter(d => d.value > 0)} cx={105} cy={105} innerRadius={76} outerRadius={100} paddingAngle={3} dataKey="value" stroke="none">
                        {qcDonutData.filter(d => d.value > 0).map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                    </PieChart>
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                      <div style={{ fontFamily: F.display, fontSize: 42, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1 }}>{totalQcSarees}</div>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 5, textAlign: "center", lineHeight: 1.4 }}>sarees<br />inspected</div>
                    </div>
                  </div>

                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
                    {qcDonutData.map(d => (
                      <div key={d.name}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                            <span style={{ fontFamily: F.ui, fontSize: 16, color: T.luxuryBrown, fontWeight: 600 }}>{d.name}</span>
                          </div>
                          <span style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: d.color }}>{d.value}</span>
                        </div>
                        <div style={{ height: 5, background: "rgba(110,15,45,0.07)", borderRadius: 99, overflow: "hidden" }}>
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${totalQcSarees > 0 ? Math.round((d.value / totalQcSarees) * 100) : 0}%` }}
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
                    <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.crimson }}>Most common rejection reasons</span>
                  </div>
                  <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, lineHeight: 1.6 }}>
                    {defectCounts.length === 0 ? "No recorded defect reasons." : (
                      defectCounts.slice(0, 2).map(([reason, cnt]) => (
                        <span key={reason} style={{ marginRight: 12 }}>
                          {reason} <strong style={{ color: T.crimson }}>{cnt} sarees</strong>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Two mini-stat boxes */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[
                  { label: "Pending Quality Checks", value: `${pendingQC} sarees`, color: T.antiqueGold, bg: "rgba(200,155,71,0.07)", border: "rgba(200,155,71,0.22)", PhIcon: Clock },
                  { label: "Overall Defect Rate", value: `${overallDefectRate}%`, color: T.crimson, bg: "rgba(192,57,43,0.05)", border: "rgba(192,57,43,0.18)", PhIcon: WarningCircle },
                ].map(s => (
                  <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 16, padding: "20px 22px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
                      <s.PhIcon size={18} color={s.color} weight="fill" />
                      <div style={{ fontFamily: F.mono, fontSize: 12, color: s.color, textTransform: "uppercase", letterSpacing: "1.2px", fontWeight: 600 }}>{s.label}</div>
                    </div>
                    <div style={{ fontFamily: F.display, fontSize: 38, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </FadeUp>

      <ActionDialog open={reportOpen} title="Download weaver performance report" onClose={() => setReportOpen(false)}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", fontFamily: F.ui, color: T.luxuryBrown, lineHeight: 1.6 }}><FileText size={34} color={T.royalBurgundy} /><div><b>Performance report is ready.</b><br />Includes leaderboard, QC pass/reject summary, pending dues, and batch-wise production.</div></div>
        <button onClick={() => setReportOpen(false)} style={{ marginTop: 22, width: "100%", background: T.royalBurgundy, color: "#fff", border: "none", borderRadius: 12, padding: 14, fontFamily: F.ui, fontWeight: 700, cursor: "pointer" }}><Download size={16} /> Download PDF</button>
      </ActionDialog>
    </>
  );
}
