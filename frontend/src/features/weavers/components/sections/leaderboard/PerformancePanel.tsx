// ── Performance leaderboard + QC results panel (row 1 of the leaderboard section) ─
import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText } from "lucide-react";
import { Medal, CheckCircle2 as CheckCircle, AlertCircle as WarningCircle, Clock } from "lucide-react";
import { PieChart, Pie, Cell } from "recharts";
import { T, F } from "../../theme";
import { FadeUp, Avatar, ActionDialog, SectionCard, qcColor } from "../../common/primitives";
import { DownloadGate } from "../../../../../shared/ui/DownloadAccess";
import { Button } from "../../../../../shared/ui/primitives";
import { weaversApi } from "../../../../../shared/api/weavers";
import { resolveAssetUrl } from "../../../../../shared/api/uploads";
import { reportsApi } from "../../../../../shared/api/reports";
import { qcApi } from "../../../../../shared/api/qc";

function CardBloom() {
  return (
    <span aria-hidden style={{
      position: "absolute", top: -70, right: -70, width: 200, height: 200, borderRadius: "50%",
      background: "radial-gradient(circle, rgba(110,15,45,0.05) 0%, rgba(110,15,45,0) 70%)",
      pointerEvents: "none",
    }} />
  );
}

function CardHeader({ icon: Icon, title, subtitle, rightElement }: { icon: React.ElementType; title: string; subtitle?: string; rightElement?: React.ReactNode }) {
  return (
    <div style={{
      background: `linear-gradient(100deg, ${T.deepWine} 0%, ${T.royalBurgundy} 100%)`,
      padding: "16px 20px",
      margin: "-24px -24px 20px -24px",
      borderRadius: "14px 14px 0 0",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: "rgba(255,255,255,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Icon size={18} color="#FFFDF9" />
        </div>
        <div>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 15, color: "#FFFDF9", letterSpacing: "-0.1px", lineHeight: 1.25 }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,253,249,0.65)", marginTop: 3, lineHeight: 1.4 }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
      {rightElement}
    </div>
  );
}

const luxuryCardStyle: React.CSSProperties = {
  background: "#FFFFFF",
  borderRadius: 16,
  border: `1.5px solid ${T.royalBurgundy}`,
  padding: "24px",
  boxShadow: "0 1px 2px rgba(74,6,27,0.03), 0 6px 18px rgba(74,6,27,0.05)",
  position: "relative",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
};

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
    { name: "Passed", value: passedCount + semiCount, color: T.darkGreen },
    { name: "Rejected", value: rejectedCount, color: T.darkRed },
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
        <div id="weav-performance" style={{ marginBottom: 24 }}>
        <SectionCard
          icon={Medal}
          title="Weaver Performance This Month"
          subtitle="Rankings by sarees produced · Quality check results"
          actions={
            <DownloadGate>
              <Button onClick={() => setReportOpen(true)} variant="secondary" iconLeft={Download} className="bg-white/10 text-[#FFFDF9] border-white/20 hover:bg-white/20 hover:text-white hover:border-white/30">
                Download Full Report
              </Button>
            </DownloadGate>
          }
        >
          {/* Two-column body */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* ── Left: Leaderboard ── */}
            <div style={luxuryCardStyle}>
              <CardBloom />
              <CardHeader icon={Medal} title="Top Weavers This Month" subtitle="Ranked by QC pass rate, all-time" />

              {isLoading ? (
                <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, padding: "24px 0", textAlign: "center" }}>Loading leaderboard…</div>
              ) : isError ? (
                <div style={{ fontFamily: F.ui, fontSize: 14, color: T.crimson, padding: "24px 0", textAlign: "center" }}>Couldn't load the leaderboard.</div>
              ) : leaderboard.length === 0 ? (
                <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, padding: "24px 0", textAlign: "center", fontStyle: "italic" }}>No weaver performance data yet.</div>
              ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {leaderboard.map((l, i) => (
                  <div key={l.weaverId} className="flex items-center gap-2.5 sm:gap-4 py-3 border-b border-stone-100 last:border-none">

                    {/* Rank badge */}
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-xs sm:text-sm" style={{
                      background: i === 0 ? `linear-gradient(135deg, ${T.royalBurgundy}, ${T.deepWine})` : i === 1 ? "rgba(200,155,71,0.15)" : "rgba(110,15,45,0.06)",
                      border: i === 0 ? "none" : `1px solid ${i === 1 ? "rgba(200,155,71,0.30)" : "rgba(110,15,45,0.12)"}`,
                      color: i === 0 ? "#FFFFFF" : i === 1 ? T.antiqueGold : T.taupe,
                    }}>
                      {i + 1}
                    </div>

                    {/* Avatar */}
                    <Avatar photo={resolveAssetUrl(l.photoUrl)} name={l.name} initials={l.initials} bg={T.royalBurgundy} size={40} />

                    {/* Name + ID */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="font-bold text-sm text-[#3B2314] truncate" style={{ fontFamily: F.ui }}>{l.name}</div>
                      <div className="text-xs text-[#6E0F2D] truncate" style={{ fontFamily: F.ui }}>{l.village || "—"}</div>
                    </div>

                    {/* Stats */}
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div className="text-lg font-bold text-[#3B2314] leading-none" style={{ fontFamily: F.display }}>
                        {l.totalSareesWoven}
                        <span className="text-xs text-stone-500 font-normal ml-1" style={{ fontFamily: F.ui }}>sarees</span>
                      </div>
                      <div className="text-xs font-bold mt-1" style={{ fontFamily: F.ui, color: qcColor(l.qcPassRate) }}>{l.qcPassRate}% pass</div>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>

            {/* ── Right: QC Results ── */}
            <div style={luxuryCardStyle}>
              <CardBloom />
              <CardHeader
                icon={CheckCircle}
                title="Quality Check Results"
                subtitle="All sarees submitted for quality inspection"
                rightElement={
                  <button
                    type="button"
                    onClick={() => onNavigate?.("QcHistory")}
                    style={{
                      background: "rgba(255,255,255,0.18)",
                      border: "1px solid rgba(255,255,255,0.35)",
                      borderRadius: 20,
                      padding: "6px 14px",
                      fontFamily: F.ui,
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#FFFDF9",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = "#FFFDF9";
                      e.currentTarget.style.color = T.royalBurgundy;
                      e.currentTarget.style.borderColor = "#FFFDF9";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.18)";
                      e.currentTarget.style.color = "#FFFDF9";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
                    }}
                  >
                    <span>View Details</span>
                    <span style={{ fontSize: 13, lineHeight: 1 }}>→</span>
                  </button>
                }
              />

              {/* Pie + legend */}
              <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-8 mb-6">
                <div style={{ position: "relative", width: 180, height: 180, flexShrink: 0 }}>
                  <PieChart width={180} height={180}>
                    <Pie data={qcDonutData.filter(d => d.value > 0)} cx={90} cy={90} innerRadius={62} outerRadius={84} paddingAngle={5} cornerRadius={8} dataKey="value" stroke="none">
                      {qcDonutData.filter(d => d.value > 0).map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                    <div style={{ fontFamily: F.display, fontSize: 34, fontWeight: 700, color: T.royalBurgundy, lineHeight: 1 }}>{totalQcSarees}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 4, textAlign: "center", lineHeight: 1.3 }}>sarees<br />inspected</div>
                  </div>
                </div>

                <div className="w-full flex-1 flex flex-col gap-4">
                  {qcDonutData.map(d => (
                    <div key={d.name} className="w-full">
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 10, height: 10, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                          <span style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, fontWeight: 600 }}>{d.name}</span>
                        </div>
                        <span className="text-xl font-bold" style={{ fontFamily: F.display, color: d.color }}>{d.value}</span>
                      </div>
                      <div style={{ height: 7, background: "rgba(110,15,45,0.07)", borderRadius: 99, overflow: "hidden" }}>
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
              <div style={{ background: "rgba(110,15,45,0.04)", border: "1px solid rgba(110,15,45,0.14)", borderRadius: 14, padding: "14px 16px", marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <WarningCircle size={16} color={T.royalBurgundy} />
                  <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.royalBurgundy }}>Most common rejection reasons</span>
                </div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, lineHeight: 1.5 }}>
                  {defectCounts.length === 0 ? "No recorded defect reasons." : (
                    defectCounts.slice(0, 2).map(([reason, cnt]) => (
                      <div key={reason} className="flex items-center justify-between py-0.5">
                        <span>{reason}</span>
                        <strong style={{ color: T.crimson }}>{cnt} sarees</strong>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Two mini-stat boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-auto">
                {[
                  { label: "Pending Quality Checks", value: `${pendingQC} sarees`, color: T.royalBurgundy, bg: "rgba(110,15,45,0.05)", border: "rgba(110,15,45,0.18)", PhIcon: Clock },
                  { label: "Overall Defect Rate", value: `${overallDefectRate}%`, color: T.crimson, bg: "rgba(192,57,43,0.05)", border: "rgba(192,57,43,0.18)", PhIcon: WarningCircle },
                ].map(s => (
                  <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <s.PhIcon size={14} color={s.color} />
                      <div style={{ fontFamily: F.ui, fontSize: 10, color: s.color, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700 }}>{s.label}</div>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold leading-none" style={{ fontFamily: F.display, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </SectionCard>
        </div>
      </FadeUp>

      <ActionDialog open={reportOpen} title="Download weaver performance report" onClose={() => setReportOpen(false)}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", fontFamily: F.ui, color: T.luxuryBrown, lineHeight: 1.6 }}><FileText size={34} color={T.royalBurgundy} /><div><b>Performance report is ready.</b><br />Includes leaderboard, QC pass/reject summary, pending dues, and batch-wise production.</div></div>
        <Button onClick={() => setReportOpen(false)} variant="primary" fullWidth className="mt-[22px] rounded-xl bg-[#6E0F2D]"><Download size={16} /> Download PDF</Button>
      </ActionDialog>
    </>
  );
}
