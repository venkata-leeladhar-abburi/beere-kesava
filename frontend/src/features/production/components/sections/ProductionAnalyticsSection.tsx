import React, { useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3 as ChartBar, Filter as FunnelSimple, Trophy, ShoppingBag,
  Download as DownloadSimple,
} from "lucide-react";
import { LineChart, TrendingUp } from "lucide-react";
import { T, F } from "../theme";
import {
  BAND, CHART, NUM, ChartBand, ChartCard, ChartHint, ChartLegend, ChartState,
  CountUp, GroupedBarChart, HeroStat, MicroLabel, StatFooter, TrackBar,
} from "./chart-primitives";
// STAGE_FUNNEL and ORDER_PROGRESS are derived from real batch/bulk-order
// data; the monthly production chart is wired to
// GET /analytics/production-trend-monthly, and the top-weavers chart below
// is wired to GET /weavers/production-leaderboard.
import { ANALYTICS_PERIODS } from "../data";
import { analyticsApi } from "../../../../shared/api/analytics";
import { weaversApi } from "../../../../shared/api/weavers";
import { useBatches } from "../../contexts/BatchContext";
import { useBulkOrders } from "@/features/bulk-orders";
import { useFinishing } from "@/features/finishing";
import { computeBulkOrderProducedSareeIds } from "@/features/bulk-orders";
import { rowComplete } from "./batches/ContextBatchCard";
import { FadeUp, Pip, ProductionDialog } from "../common/primitives";
import { Button, CheckboxField } from "../../../../shared/ui/primitives";
import { MobileFilterBar } from "../../../../shared/ui/filter/MobileFilterBar";
import { pipColor } from "../batch-creation/PickerModals";
function formatMonthLabel(month: string): string {
  const [year, m] = month.split("-").map(Number);
  if (!year || !m) return month;
  return new Date(year, m - 1, 1).toLocaleDateString("en-IN", { month: "short" });
}

export function ProductionAnalyticsSection() {
  const [period, setPeriod] = useState("This Month");

  const {
    data: productionLeaderboardRes,
    isLoading: productionLeaderboardLoading,
    isError: productionLeaderboardError,
  } = useQuery({
    queryKey: ["weavers-production-leaderboard"],
    queryFn: () => weaversApi.getProductionLeaderboard(6),
  });
  const topWeavers = (productionLeaderboardRes ?? []).map(w => ({
    weaverId: w.weaverId,
    name: w.name,
    initials: w.initials,
    bg: pipColor(w.weaverId),
    sarees: w.sareesProduced,
  }));
  const maxWeaverSarees = topWeavers[0]?.sarees ?? 1;

  const {
    data: productionTrendRes,
    isLoading: productionTrendLoading,
    isError: productionTrendError,
  } = useQuery({
    queryKey: ["analytics-production-trend-monthly"],
    queryFn: () => analyticsApi.getProductionTrendMonthly(6),
  });
  const monthlyProductionData = (productionTrendRes?.items ?? []).map(d => ({
    ...d,
    label: formatMonthLabel(d.month),
  }));
  const monthlyChartData = monthlyProductionData.map(d => ({ label: d.label, a: d.produced, b: d.passed }));
  const totalProduced = monthlyProductionData.reduce((n, d) => n + d.produced, 0);
  const totalPassed = monthlyProductionData.reduce((n, d) => n + d.passed, 0);
  const avgPerMonth = monthlyProductionData.length
    ? Math.round(totalProduced / monthlyProductionData.length)
    : 0;
  // A month's `passed` counts sarees that cleared QC *in* that month, which may
  // include sarees woven earlier — so passed/produced is not a pass rate and
  // can exceed 100% (it rendered as "128%"). Show the peak month instead, which
  // is well-defined from the same series.
  const peakMonth = monthlyProductionData.reduce(
    (best, d) => (d.produced > best.produced ? d : best),
    { produced: 0, label: "—" } as { produced: number; label: string },
  );

  const { batches } = useBatches();
  const { bulkOrders } = useBulkOrders();
  const { readySarees, returns, quotations } = useFinishing();

  const STAGE_FUNNEL = useMemo(() => {
    const active = batches.filter(b => b.status === "active" || b.status === "draft");
    let weaving = 0, submitted = 0, qcPassed = 0;
    for (const b of active) {
      const completeCount = b.rows.filter(rowComplete).length;
      const qcPassedCount = b.rows.filter(r => r.qcPassed).length;
      if (qcPassedCount > 0 && qcPassedCount === b.totalCount) qcPassed++;
      else if (completeCount === b.totalCount && b.totalCount > 0) submitted++;
      else weaving++;
    }
    // Backend never transitions a batch's own status to "completed" (only
    // draft→active exists), so filtering on b.status here always returned 0.
    // A batch is actually done — ready for sale — once every row in it has
    // passed QC, the same per-row criterion used for qcPassed above.
    const inStock = batches.filter(b => b.totalCount > 0 && b.rows.every(r => r.qcPassed === true)).length;
    const max = Math.max(weaving, submitted, qcPassed, inStock, 1);
    // Stages are consecutive steps of one pipeline, so they read as one
    // sequential burgundy→gold ramp rather than four unrelated hues (the old
    // palette gave "QC Passed" and "In Stock" the same green, which made two
    // distinct stages look like one).
    return [
      { label: "Weaving in Progress", note: "On the loom", count: weaving, color: CHART.ramp[0], widthPct: Math.round((weaving / max) * 100) },
      { label: "Submitted — Waiting QC", note: "Handed in, not yet checked", count: submitted, color: CHART.ramp[1], widthPct: Math.round((submitted / max) * 100) },
      { label: "Quality Check Passed", note: "Cleared inspection", count: qcPassed, color: CHART.ramp[2], widthPct: Math.round((qcPassed / max) * 100) },
      { label: "In Stock — Ready for Sale", note: "Available to sell", count: inStock, color: CHART.ramp[3], widthPct: Math.round((inStock / max) * 100) },
    ];
  }, [batches]);
  const totalActiveBatches = batches.filter(b => b.status === "active" || b.status === "draft").length;

  // o.done is a manually-set DB column nothing keeps in sync with actual
  // production — it drifts to 0/stale even once sarees have genuinely
  // passed QC for this order. Derive the real count the same way the
  // BulkOrderCard and order detail page do, so this chart can't disagree.
  const ORDER_PROGRESS = useMemo(
    () => bulkOrders.map(o => ({
      ref: o.ref,
      name: o.customer,
      done: computeBulkOrderProducedSareeIds(o.ref, bulkOrders, readySarees, returns, quotations).size,
      total: o.total,
    })).map(o => ({
      ...o,
      // o.total can legitimately be 0 for a shell order — don't render NaN%.
      pct: o.total > 0 ? Math.min(100, Math.round((o.done / o.total) * 100)) : 0,
      remaining: Math.max(0, o.total - o.done),
    })),
    [bulkOrders, readySarees, returns, quotations],
  );
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState("PDF");
  const [exportIncludes, setExportIncludes] = useState<Record<string, boolean>>({
    "Weekly Production": true,
    "Stage Pipeline": true,
    "Top Weavers": true,
    "Design-wise Breakdown": true,
    "Bulk Order Progress": false,
  });

  return (
    <div id="prod-analytics" className="px-4 md:px-7 xl:px-10" style={{ paddingTop: 28 }}>
      <FadeUp>

        {/* One container holds the banner and all four charts, the same shell as
            the "All Active Production Batches" card, so Analytics reads as a
            single section rather than four cards floating under a header. */}
        <div style={{
          background: T.warmIvory,
          borderRadius: 20,
          border: `1px solid ${T.borderDef}`,
          boxShadow: "0 1px 2px rgba(74,6,27,0.04), 0 10px 34px rgba(74,6,27,0.08)",
          overflow: "hidden",
        }}>
          <div
            className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative overflow-hidden"
            style={{ background: `linear-gradient(104deg, ${T.deepWine} 0%, ${T.royalBurgundy} 100%)` }}
          >
            {/* Gold capillary + corner bloom — the only saturated surface in the
                section, which is what lets the charts inside stay quiet. */}
            <span aria-hidden style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 1,
              background: "linear-gradient(90deg, rgba(200,155,71,0) 0%, rgba(231,201,131,0.70) 50%, rgba(200,155,71,0) 100%)",
            }} />
            <span aria-hidden style={{
              position: "absolute", top: -90, right: -60, width: 260, height: 260, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(200,155,71,0.15) 0%, rgba(200,155,71,0) 70%)",
              pointerEvents: "none",
            }} />

            <div style={{ display: "flex", alignItems: "center", gap: 13, minWidth: 0, position: "relative" }}>
              <div style={{
                width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(255,253,249,0.10)", border: "1px solid rgba(231,201,131,0.28)",
              }}>
                <LineChart size={20} color={T.goldLight} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 21, color: "#FFFDF9", letterSpacing: "-0.2px", lineHeight: 1.15 }}>
                  Production Analytics
                </div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,253,249,0.62)", marginTop: 3, lineHeight: 1.4 }}>
                  Output, pipeline, weavers and bulk orders at a glance
                </div>
              </div>
            </div>

            {/* Mobile Flipkart-style Filter Bar */}
            <div className="md:hidden p-3.5 bg-white border-b border-[var(--border-default)]">
              <MobileFilterBar
                search=""
                onSearchChange={() => {}}
                searchPlaceholder="Search analytics..."
                filterGroups={[
                  {
                    id: "period",
                    label: "Time Period",
                    value: period,
                    defaultValue: "This Month",
                    options: ANALYTICS_PERIODS.map(p => ({ value: p, label: p })),
                    onChange: setPeriod,
                  },
                ]}
                onResetAll={() => setPeriod("This Month")}
              />
            </div>

            {/* Desktop Period Selector */}
            <div className="hidden md:flex items-center gap-2 flex-wrap relative shrink-0">
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-0.5 scrollbar-none whitespace-nowrap" style={{ WebkitOverflowScrolling: "touch" }}>
                {ANALYTICS_PERIODS.map(p => (
                  <Button key={p} onClick={() => setPeriod(p)} variant={period === p ? "primary" : "secondary"} size="sm" className="shrink-0 whitespace-nowrap text-[12px]">
                    {p}
                  </Button>
                ))}
              </div>
              <Button onClick={() => setShowExportDialog(true)} variant="secondary" size="sm" className="shrink-0">
                <DownloadSimple size={15} color={T.antiqueGold} /> Export
              </Button>
            </div>
          </div>

          <div className="p-3.5 sm:p-5" style={{ background: T.silkCream }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-stretch">

              {/* ── Monthly output ─────────────────────────────────────────────── */}
              <ChartCard>
                <ChartBand
                  tone="output"
                  icon={<ChartBar size={19} color={BAND.output.icon} />}
                  title="Sarees Produced Each Month"
                  sub="Produced vs QC-passed · last 6 months"
                />
                <div className="p-5 sm:p-6" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <ChartHint tone="output">Burgundy is everything woven; gold is what cleared quality check.</ChartHint>

                {productionTrendLoading ? (
                  <ChartState kind="loading" message="Loading production trend…" />
                ) : productionTrendError ? (
                  <ChartState kind="error" message="Failed to load production trend." />
                ) : monthlyProductionData.length === 0 ? (
                  <ChartState kind="empty" message="No production data yet." />
                ) : (
                  <>
                    <HeroStat
                      value={totalProduced}
                      caption="Sarees produced over these 6 months"
                      icon={<TrendingUp size={12} color={T.green} />}
                    />
                    <div className="overflow-x-auto w-full">
                      <div style={{ minWidth: 280 }}>
                        <GroupedBarChart data={monthlyChartData} />
                      </div>
                    </div>
                    <ChartLegend items={[
                      { color: CHART.primary, label: "Produced" },
                      { color: CHART.secondary, label: "QC Passed" },
                    ]} />
                    <div>
                      <StatFooter stats={[
                        { num: <CountUp value={avgPerMonth} />, label: "Avg / Month" },
                        { num: <CountUp value={totalPassed} />, label: "QC Passed" },
                        { num: <CountUp value={peakMonth.produced} />, label: `Peak · ${peakMonth.label}` },
                      ]} />
                    </div>
                  </>
                )}
                </div>
              </ChartCard>

              {/* ── Stage pipeline ─────────────────────────────────────────────── */}
              <ChartCard>
                <ChartBand
                  tone="pipeline"
                  icon={<FunnelSimple size={19} color={BAND.pipeline.icon} />}
                  title="Where Are All Batches Right Now"
                  sub={`All ${totalActiveBatches} active batch${totalActiveBatches === 1 ? "" : "es"} by production stage`}
                />
                <div className="p-5 sm:p-6" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <ChartHint tone="pipeline">Stages run top to bottom in the order work moves, warming to gold as it nears the shelf.</ChartHint>

                <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1, justifyContent: "center", paddingBottom: 2 }}>
                  {STAGE_FUNNEL.map((s, i) => {
                    // An empty stage is real information, but it shouldn't pull the
                    // eye as hard as a stage holding work.
                    const empty = s.count === 0;
                    return (
                      <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: 6, opacity: empty ? 0.5 : 1 }}>
                        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                            <span aria-hidden style={{ width: 7, height: 7, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontFamily: F.ui, fontSize: 12.5, fontWeight: 600, color: T.luxuryBrown, lineHeight: 1.25 }}>{s.label}</div>
                              <MicroLabel>{s.note}</MicroLabel>
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 5, flexShrink: 0 }}>
                            <span style={{ fontFamily: F.display, fontSize: 21, fontWeight: 400, color: T.luxuryBrown, ...NUM }}>
                              <CountUp value={s.count} />
                            </span>
                            <span style={{ fontFamily: F.ui, fontSize: 10.5, color: T.taupe }}>
                              {s.count === 1 ? "batch" : "batches"}
                            </span>
                          </div>
                        </div>
                        <TrackBar pct={s.widthPct} fill={s.color} height={9} delay={i * 0.08} />
                      </div>
                    );
                  })}
                </div>

                <div>
                  <StatFooter stats={[
                    { num: <CountUp value={totalActiveBatches} />, label: "Active Batches" },
                    { num: <CountUp value={STAGE_FUNNEL[3].count} />, label: "Ready to Sell" },
                  ]} />
                </div>
                </div>
              </ChartCard>

              {/* ── Weaver leaderboard ─────────────────────────────────────────── */}
              <ChartCard>
                <ChartBand
                  tone="weavers"
                  icon={<Trophy size={19} color={BAND.weavers.icon} />}
                  title="Top Weavers This Month"
                  sub="Ranked by sarees produced · last 6 months"
                />
                <div className="p-5 sm:p-6" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <ChartHint tone="weavers">Bars are relative to the leader, who always shows a full bar.</ChartHint>

                {productionLeaderboardLoading ? (
                  <ChartState kind="loading" message="Loading top weavers…" />
                ) : productionLeaderboardError ? (
                  <ChartState kind="error" message="Failed to load top weavers." />
                ) : topWeavers.length === 0 ? (
                  <ChartState kind="empty" message="No production data yet." />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1, justifyContent: "center" }}>
                    {topWeavers.map((w, i) => (
                      <div key={w.weaverId} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                          width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: i === 0 ? "rgba(200,155,71,0.18)" : "rgba(110,15,45,0.05)",
                          border: i === 0 ? `1px solid ${T.borderGold}` : `1px solid ${T.borderDef}`,
                        }}>
                          <span style={{ fontFamily: F.display, fontSize: 13, fontWeight: 400, color: i === 0 ? CHART.secondary : T.taupe, ...NUM }}>{i + 1}</span>
                        </div>
                        <Pip initials={w.initials} bg={w.bg} size={30} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, fontWeight: 600, marginBottom: 5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{w.name}</div>
                          <TrackBar
                            pct={(w.sarees / maxWeaverSarees) * 100}
                            fill={i === 0
                              ? `linear-gradient(90deg, ${CHART.primary} 0%, ${CHART.secondary} 100%)`
                              : `linear-gradient(90deg, ${CHART.primaryDeep} 0%, ${CHART.primary} 100%)`}
                            height={9}
                            delay={i * 0.07}
                          />
                        </div>
                        <div style={{ flexShrink: 0, textAlign: "right", minWidth: 46 }}>
                          <div style={{ fontFamily: F.display, fontSize: 19, fontWeight: 400, color: T.luxuryBrown, lineHeight: 1.1, ...NUM }}>
                            <CountUp value={w.sarees} />
                          </div>
                          <MicroLabel>sarees</MicroLabel>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                </div>
              </ChartCard>

              {/* ── Bulk order progress ────────────────────────────────────────── */}
              <ChartCard>
                <ChartBand
                  tone="orders"
                  icon={<ShoppingBag size={19} color={BAND.orders.icon} />}
                  title="Bulk Order Production Progress"
                  sub="Sarees produced so far for each wholesale order"
                />
                <div className="p-5 sm:p-6" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <ChartHint tone="orders">A bar turns green only once the order is complete and ready to dispatch.</ChartHint>

                {ORDER_PROGRESS.length === 0 ? (
                  <ChartState kind="empty" message="No bulk orders yet." />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1, justifyContent: "center" }}>
                    {ORDER_PROGRESS.map((o, i) => (
                      <div key={o.ref}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 6 }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.name}</div>
                            <MicroLabel>
                              {o.remaining === 0 ? "Complete" : `${o.remaining} remaining`}
                            </MicroLabel>
                          </div>
                          <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexShrink: 0 }}>
                            <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, ...NUM }}>{o.done}/{o.total}</span>
                            <span style={{ fontFamily: F.display, fontSize: 19, fontWeight: 400, color: T.luxuryBrown, minWidth: 44, textAlign: "right", ...NUM }}>
                              <CountUp value={o.pct} />%
                            </span>
                          </div>
                        </div>
                        <TrackBar
                          pct={o.pct}
                          fill={o.pct >= 100
                            ? `linear-gradient(90deg, ${CHART.done} 0%, ${CHART.doneLite} 100%)`
                            : `linear-gradient(90deg, ${CHART.primaryDeep} 0%, ${CHART.primary} 100%)`}
                          height={10}
                          delay={i * 0.06}
                        />
                      </div>
                    ))}
                  </div>
                )}
                </div>
              </ChartCard>
            </div>

          </div>
        </div>

        <AnimatePresence>
          {showExportDialog && (
            <ProductionDialog open title="Export Production Report" onClose={() => setShowExportDialog(false)}>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div style={{ background: T.warmCream, borderRadius: 11, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                  <ChartBar size={18} color={T.royalBurgundy} />
                  <div>
                    <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>Reporting Period</div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>{period}</div>
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, marginBottom: 10 }}>Include in Report</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {Object.entries(exportIncludes).map(([key, checked]) => (
                      <CheckboxField key={key} label={key} checked={checked} onCheckedChange={() => setExportIncludes(prev => ({ ...prev, [key]: !prev[key] }))} />
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, marginBottom: 10 }}>Export Format</div>
                  <div style={{ display: "flex", gap: 10 }}>
                    {["PDF", "Excel (.xlsx)", "CSV"].map(fmt => (
                      <Button key={fmt} onClick={() => setExportFormat(fmt)} variant={exportFormat === fmt ? "primary" : "secondary"} fullWidth>
                        {fmt}
                      </Button>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <Button
                    onClick={() => setShowExportDialog(false)}
                    variant="primary"
                    size="lg"
                    className="flex-[2]"
                  >
                    <DownloadSimple size={18} /> Generate &amp; Download
                  </Button>
                  <Button onClick={() => setShowExportDialog(false)} variant="secondary" size="lg" className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </ProductionDialog>
          )}
        </AnimatePresence>

      </FadeUp>
    </div>
  );
}
