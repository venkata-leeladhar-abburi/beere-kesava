import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  RadialBarChart, RadialBar,
} from "recharts";
import { BarChart3 as ChartBar, Gauge, CircleDot as Yarn, CheckCircle2 as CheckCircle, Users } from "lucide-react";
import { T, F } from "../theme";
import { Status } from "../types";
import { STATUS_MIX_META, CLUSTER_FILLS } from "../data";
import { FadeUp, SectionCard } from "../common/primitives";
import { WeaverLeaderboardClusterRow } from "./WeaverLeaderboardClusterRow";
import { weaversApi, BackendWeaverStats } from "../../../../shared/api/weavers";
import { useWeaverRosterStats, weaverStatusFromStats } from "../../hooks/useWeaverRosterStats";
import { weaverPaymentsApi } from "../../../../shared/api/payments";
import { rupees, formatMoney } from "@/lib/domain/money";
import { resolveAssetUrl } from "../../../../shared/api/uploads";
import { ChartFigure } from "../../../../shared/ui/data";
import { Button } from "../../../../shared/ui/primitives";
import { MobileFilterBar } from "../../../../shared/ui/filter/MobileFilterBar";

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

const ANALYTICS_PERIODS = ["Today", "This Week", "This Month", "All Time"] as const;
type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number];
const AVATAR_PALETTE = ["#5A3E6B", "#6E0F2D", "#2D6B6B", "#4A6B4A", "#9B6B8A", "#2D7D6B", "#4A5E7A", "#7A2040"];

/** Start of the window each period button selects; undefined = all time. */
function periodStart(period: AnalyticsPeriod): string | undefined {
  const now = new Date();
  if (period === "Today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  }
  if (period === "This Week") {
    // Week starts Monday.
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d.toISOString();
  }
  if (period === "This Month") {
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  }
  return undefined;
}

export function WeaverAnalytics() {
  // These buttons were disabled placeholders — the stats endpoint had no date
  // window, so only all-time totals existed. It takes ?from/&to now.
  const [period, setPeriod] = React.useState<AnalyticsPeriod>("All Time");
  const periodLabel = period;
  const range = React.useMemo(() => {
    const from = periodStart(period);
    return from ? { from } : undefined;
  }, [period]);

  const { roster, statsById, isLoading, isError } = useWeaverRosterStats(range);

  const { data: earningsList } = useQuery({
    queryKey: ["weaver-analytics-earnings"],
    queryFn: () => weaverPaymentsApi.earnings(),
  });
  const earningsById = new Map((earningsList ?? []).map(e => [e.weaverId, e]));

  const { data: series } = useQuery({
    queryKey: ["weaver-production-series", 12],
    queryFn: () => weaversApi.getProductionSeries(12),
  });

  const perWeaver = React.useMemo(() => {
    return roster.map((w, i) => {
      const s: BackendWeaverStats | undefined = statsById.get(w.id);
      const produced = s?.totalSareesWoven ?? 0;
      const passed = s?.qcPassCount ?? 0;
      const status: Status = weaverStatusFromStats(s);
      return {
        id: w.id,
        name: w.name,
        village: w.village || "—",
        cluster: (w.cluster || w.village || "—").split(",")[0].trim(),
        looms: w.looms,
        status,
        photo: resolveAssetUrl(w.photoUrl),
        initials: w.initials,
        bg: AVATAR_PALETTE[i % AVATAR_PALETTE.length],
        produced, passed,
        payout: earningsById.get(w.id)?.totalEarned ?? 0,
        periodPassRate: s?.qcPassRate ?? 0,
        perLoom: w.looms ? produced / w.looms : 0,
      };
    }).filter(w => w.produced > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roster, statsById, earningsList]);

  const totalProduced = perWeaver.reduce((a, w) => a + w.produced, 0);
  const totalPassed = perWeaver.reduce((a, w) => a + w.passed, 0);
  const totalPayout = perWeaver.reduce((a, w) => a + w.payout, 0);
  const totalLooms = perWeaver.reduce((a, w) => a + w.looms, 0);
  const overallPassRate = totalProduced ? Math.round((totalPassed / totalProduced) * 100) : 0;

  const top10 = React.useMemo(
    () => [...perWeaver].sort((a, b) => b.produced - a.produced).slice(0, 10)
      .map(w => ({ ...w, short: w.name.length > 16 ? w.name.slice(0, 15) + "…" : w.name })),
    [perWeaver]
  );

  // Workforce breakdown covers the WHOLE roster, not just weavers with output.
  // `perWeaver` deliberately drops anyone at zero so the output charts aren't
  // padded with empty bars — but counting the workforce off that list meant
  // the donut's centre number, labelled plainly "weavers", silently excluded
  // every weaver who hasn't produced yet.
  const workforce = React.useMemo(
    () => roster.map(w => weaverStatusFromStats(statsById.get(w.id))),
    [roster, statsById],
  );
  const statusMix = React.useMemo(() => (["active", "qc", "idle"] as Status[])
    .map(s => ({
      name: STATUS_MIX_META[s].label,
      value: workforce.filter(st => st === s).length,
      color: STATUS_MIX_META[s].color,
    }))
    .filter(d => d.value > 0), [workforce]);

  const byCluster = React.useMemo(() => {
    const m = new Map<string, { produced: number; weavers: number }>();
    perWeaver.forEach(w => {
      const e = m.get(w.cluster) || { produced: 0, weavers: 0 };
      e.produced += w.produced; e.weavers += 1;
      m.set(w.cluster, e);
    });
    return [...m.entries()]
      .map(([cluster, v], i) => ({ cluster, ...v, fill: CLUSTER_FILLS[i % CLUSTER_FILLS.length] }))
      .sort((a, b) => b.produced - a.produced);
  }, [perWeaver]);

  const loomProductivity = React.useMemo(
    () => [...perWeaver].sort((a, b) => b.perLoom - a.perLoom).slice(0, 8)
      .map(w => ({ ...w, short: w.initials, perLoomR: Math.round(w.perLoom * 10) / 10 })),
    [perWeaver]
  );
  const avgPerLoom = totalLooms ? totalProduced / totalLooms : 0;

  const qualityVsOutput = React.useMemo(
    () => [...perWeaver].sort((a, b) => b.produced - a.produced).slice(0, 8),
    [perWeaver]
  );
  const maxOutput = Math.max(1, ...qualityVsOutput.map(w => w.produced));
  const idleCount = workforce.filter(st => st === "idle").length;

  const monthlySeries = React.useMemo(
    () => (series ?? []).map(pt => {
      const [y, m] = pt.month.split("-");
      return {
        ...pt,
        label: new Date(Number(y), Number(m) - 1, 1)
          .toLocaleDateString("en-IN", { month: "short" }),
      };
    }),
    [series],
  );

  const tip = { fontFamily: F.ui, fontSize: 12, borderRadius: 10, border: `1px solid rgba(200,155,71,0.25)`, boxShadow: "0 1px 2px rgba(74,6,27,0.03), 0 6px 18px rgba(74,6,27,0.05)" };

  return (
    <div className="px-4 md:px-7 xl:px-12" style={{ paddingTop: 36 }}>
      <FadeUp>
      <SectionCard
        icon={ChartBar}
        title="Weaver Analytics"
        subtitle="Sarees produced, QC pass rate, and workforce breakdown across all weavers. Making charges are what weavers have earned, not what has been paid out."
        actions={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
            {ANALYTICS_PERIODS.map(p => (
              <Button
                key={p}
                variant={p === period ? "primary" : "secondary"}
                size="sm"
                onClick={() => setPeriod(p)}
                className={p === period ? "" : "bg-white/10 text-[#FFFDF9] border-white/20 hover:bg-white/20"}
              >
                {p}
              </Button>
            ))}
          </div>
        }
      >
        {/* Mobile Flipkart-style Filter Bar */}
        <div className="md:hidden mb-4 bg-white p-3.5 rounded-2xl border border-[var(--border-default)] shadow-xs">
          <MobileFilterBar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search weaver analytics..."
            filterGroups={[
              {
                id: "period",
                label: "Period",
                value: "All Time",
                defaultValue: "All Time",
                options: ANALYTICS_PERIODS.map(p => ({ value: p, label: p })),
                onChange: () => {},
              },
            ]}
            onResetAll={() => setSearch("")}
          />
        </div>
        <div style={{ width: "100%", marginBottom: 20 }}>
          <div className="grid grid-cols-3 gap-2 sm:gap-6 w-full items-stretch">
            {[
              { label: "SAREES WOVEN", value: totalProduced.toLocaleString("en-IN"), color: T.royalBurgundy },
              { label: "QC PASS RATE", value: `${overallPassRate}%`, color: T.royalBurgundy },
              { label: "MAKING CHARGES EARNED", value: formatMoney(rupees(totalPayout)), color: T.royalBurgundy },
            ].map(k => (
              <div key={k.label} className="flex flex-col justify-between p-2 sm:p-4 rounded-xl bg-[#FFFDF9] border border-[rgba(110,15,45,0.15)] shadow-xs">
                <div style={{ fontFamily: F.ui, fontSize: "clamp(10px, 2.8vw, 12px)", fontWeight: 600, letterSpacing: "0.5px", color: T.taupe, textTransform: "uppercase", lineHeight: 1.2, minHeight: 28, display: "flex", alignItems: "center" }}>
                  {k.label}
                </div>
                <div style={{ fontFamily: F.display, fontSize: "clamp(14px, 4vw, 22px)", fontWeight: 700, color: k.color, marginTop: 4, whiteSpace: "nowrap" }}>
                  {k.value}
                </div>
              </div>
            ))}
          </div>
        </div>

      {isLoading ? (
        <div style={{ ...luxuryCardStyle, textAlign: "center", padding: "48px 24px" }}>
          <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>Loading weaver analytics…</div>
        </div>
      ) : isError ? (
        <div style={{ ...luxuryCardStyle, textAlign: "center", padding: "48px 24px" }}>
          <div style={{ fontFamily: F.ui, fontSize: 14, color: T.crimson }}>Couldn't load weaver analytics.</div>
        </div>
      ) : perWeaver.length === 0 ? (
        <div style={{ ...luxuryCardStyle, textAlign: "center", padding: "48px 24px" }}>
          <ChartBar size={40} color={T.taupe} />
          <div style={{ fontFamily: F.display, fontSize: 16, color: T.taupe, marginTop: 12 }}>No weaving recorded yet.</div>
          <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: 6 }}>Analytics will appear once weavers have production/QC history.</div>
        </div>
      ) : (
        <>
          <FadeUp delay={0.04}>
            <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr]" style={{ gap: 22, marginBottom: 22 }}>
              <div style={luxuryCardStyle}>
                <CardBloom />
                <CardHeader icon={ChartBar} title="Sarees Produced vs Passed" subtitle="Monthly output against quality-check outcomes" />
                <div style={{ fontFamily: F.display, fontSize: 44, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1.1, margin: "4px 0 10px" }}>
                  {totalProduced.toLocaleString("en-IN")}
                </div>
                {/* Real trailing-12-month series from GET /weavers/production-series.
                    This card used to be a note explaining that no such data existed. */}
                <ChartFigure
                  title="Sarees Produced vs Passed"
                  summary={monthlySeries.length
                    ? `${monthlySeries.length} months to ${monthlySeries[monthlySeries.length - 1].label}, ending at ${monthlySeries[monthlySeries.length - 1].produced} sarees produced.`
                    : "No monthly production recorded yet."}
                >
                  <ResponsiveContainer width="100%" height={228}>
                    <BarChart data={monthlySeries} barSize={16} margin={{ top: 10, left: 4, right: 12 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(200,155,71,0.15)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontFamily: F.ui, fontSize: 11, fill: T.taupe }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fontFamily: F.ui, fontSize: 11, fill: T.taupe }} axisLine={false} tickLine={false} width={36} />
                      <RechartsTooltip cursor={{ fill: "rgba(200,155,71,0.06)" }} contentStyle={tip} />
                      <Bar name="Produced" dataKey="produced" fill={T.royalBurgundy} radius={[6, 6, 0, 0]} />
                      <Bar name="Passed QC" dataKey="passed" fill={T.darkGreen} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartFigure>
                <div style={{ display: "flex", gap: 16, marginTop: 10, fontFamily: F.ui, fontSize: 11, color: T.taupe }}>
                  {[{ c: T.royalBurgundy, t: "Produced" }, { c: T.darkGreen, t: "Passed QC" }].map(g => (
                    <span key={g.t} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 9, height: 9, borderRadius: 3, background: g.c, display: "inline-block" }} /> {g.t}
                    </span>
                  ))}
                </div>
              </div>

              <div style={luxuryCardStyle}>
                <CardBloom />
                <CardHeader icon={Users} title="Workforce Status" subtitle="Weavers active in this period" />
                <div style={{ position: "relative", marginTop: 6 }}>
                  <ResponsiveContainer width="100%" height={172}>
                    <PieChart>
                      <Pie data={statusMix} dataKey="value" cx="50%" cy="50%" innerRadius={54} outerRadius={78} paddingAngle={5} cornerRadius={8} stroke="none">
                        {statusMix.map((d) => <Cell key={d.name} fill={d.color} />)}
                      </Pie>
                      <RechartsTooltip contentStyle={tip} formatter={(v: number) => [`${v} weavers`]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                    <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1 }}>{workforce.length}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 3 }}>weavers</div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
                  {statusMix.map(d => (
                    <div key={d.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />
                        <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{d.name}</span>
                      </div>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: T.luxuryBrown }}>{d.value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: `1px solid rgba(200,155,71,0.18)`, marginTop: 14, paddingTop: 14, display: "flex", justifyContent: "space-between", fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                  <span>Looms engaged</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: T.luxuryBrown }}>{totalLooms}</span>
                </div>
              </div>
            </div>
          </FadeUp>

          <FadeUp delay={0.08}>
            <WeaverLeaderboardClusterRow
              top10={top10}
              periodLabel={periodLabel}
              totalProduced={totalProduced}
              byCluster={byCluster}
            />
          </FadeUp>

          <FadeUp delay={0.12}>
            <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 22 }}>
              <div style={luxuryCardStyle}>
                <CardBloom />
                <CardHeader icon={Gauge} title="Quality vs Output" subtitle="Bar length = sarees woven · colour = quality" />
                <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 4, flexGrow: 1 }}>
                  {qualityVsOutput.map(w => {
                    const tier = w.periodPassRate >= 95 ? { color: T.darkGreen, label: "Excellent" }
                      : w.periodPassRate >= 92 ? { color: T.antiqueGold, label: "Good" }
                      : { color: T.darkRed, label: "Needs attention" };
                    const pct = Math.max(6, Math.round((w.produced / maxOutput) * 100));
                    return (
                      <div key={w.id}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                          <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis", maxWidth: 130 }}>{w.name}</span>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: tier.color, flexShrink: 0 }}>{w.produced} sarees · {w.periodPassRate}%</span>
                        </div>
                        <div style={{ height: 9, borderRadius: 5, background: "rgba(110,15,45,0.06)", overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", borderRadius: 5, background: tier.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid rgba(200,155,71,0.18)`, paddingTop: 10, marginTop: 12, fontFamily: F.ui, fontSize: 11 }}>
                  <div style={{ display: "flex", gap: 10 }}>
                    {[{ c: T.darkGreen, t: "Excellent ≥95%" }, { c: T.antiqueGold, t: "Good 92–94%" }, { c: T.darkRed, t: "Attention <92%" }].map(g => (
                      <span key={g.t} style={{ display: "flex", alignItems: "center", gap: 4, color: T.taupe }}>
                        <span style={{ width: 8, height: 8, borderRadius: 3, background: g.c, display: "inline-block" }} /> {g.t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3" style={{ marginTop: 12 }}>
                  <div style={{ background: "rgba(255,255,255,0.80)", borderRadius: 12, padding: "10px 12px", border: `1px solid rgba(200,155,71,0.18)` }}>
                    <div style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 600, letterSpacing: "0.5px", color: T.taupe, marginBottom: 4, textTransform: "uppercase" as const }}>TOP QUALITY</div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{qualityVsOutput.filter(w => w.periodPassRate >= 95).length} Excellent</div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.80)", borderRadius: 12, padding: "10px 12px", border: `1px solid rgba(200,155,71,0.18)` }}>
                    <div style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 600, letterSpacing: "0.5px", color: T.taupe, marginBottom: 4, textTransform: "uppercase" as const }}>WEAVERS LISTED</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>{qualityVsOutput.length} active</div>
                  </div>
                </div>
              </div>

              <div style={luxuryCardStyle}>
                <CardBloom />
                <CardHeader icon={Yarn} title="Loom Productivity" subtitle={`Sarees per loom · avg ${avgPerLoom.toFixed(1)}`} />
                <ChartFigure
                  title="Loom Productivity"
                  summary={`Sarees per loom, average ${avgPerLoom.toFixed(1)}. ${idleCount} of ${workforce.length} weavers have no active batch.`}
                >
                  <ResponsiveContainer width="100%" height={215}>
                    <BarChart data={loomProductivity} barSize={20} margin={{ top: 14, left: 10, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(200,155,71,0.15)" vertical={false} />
                      <XAxis dataKey="short" tick={{ fontFamily: "var(--font-mono)", fontSize: 11, fill: T.taupe }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontFamily: F.ui, fontSize: 11, fill: T.taupe }} axisLine={false} tickLine={false} width={40} />
                      <RechartsTooltip cursor={{ fill: "rgba(200,155,71,0.06)" }} contentStyle={tip}
                        formatter={(v: number, _n: string, p: { payload: (typeof loomProductivity)[number] }) => [`${v} per loom · ${p.payload.looms} looms`, p.payload.name]} />
                      <Bar dataKey="perLoomR" radius={[10, 10, 10, 10]}>
                        {loomProductivity.map(w => <Cell key={w.id} fill={w.perLoom >= avgPerLoom ? T.royalBurgundy : T.antiqueGold} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartFigure>
                <div className="grid grid-cols-2 gap-3" style={{ marginTop: 12 }}>
                  <div style={{ background: "rgba(255,255,255,0.80)", borderRadius: 12, padding: "10px 12px", border: `1px solid rgba(200,155,71,0.18)` }}>
                    <div style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 600, letterSpacing: "0.5px", color: T.taupe, marginBottom: 4, textTransform: "uppercase" as const }}>ENGAGED LOOMS</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>{totalLooms} looms</div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.80)", borderRadius: 12, padding: "10px 12px", border: `1px solid rgba(200,155,71,0.18)` }}>
                    <div style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 600, letterSpacing: "0.5px", color: T.taupe, marginBottom: 4, textTransform: "uppercase" as const }}>IDLE WEAVERS</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>{idleCount} idle</div>
                  </div>
                </div>
              </div>

              <div style={luxuryCardStyle}>
                <CardBloom />
                <CardHeader icon={CheckCircle} title="Weaving Health" subtitle="Quality and payout summary" />
                <ChartFigure title="Weaving Health" summary={`QC pass rate ${overallPassRate}%.`}>
                  <ResponsiveContainer width="100%" height={175}>
                    <RadialBarChart innerRadius="68%" outerRadius="100%" startAngle={210} endAngle={-30}
                      data={[{ name: "Pass", value: overallPassRate, fill: T.royalBurgundy }]}>
                      <RadialBar dataKey="value" background={{ fill: "rgba(110,15,45,0.06)" }} cornerRadius={14} />
                      <text x="50%" y="58%" textAnchor="middle" style={{ fontFamily: F.display, fontSize: 32, fontWeight: 700, fill: T.royalBurgundy }}>{overallPassRate}%</text>
                      <text x="50%" y="78%" textAnchor="middle" style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 600, fill: T.taupe, letterSpacing: "1px" }}>QC PASS RATE</text>
                    </RadialBarChart>
                  </ResponsiveContainer>
                </ChartFigure>
                <div className="grid grid-cols-2 gap-3" style={{ marginTop: 12 }}>
                  {[
                    { label: "Rejected", value: `${(totalProduced - totalPassed).toLocaleString("en-IN")} pcs` },
                    { label: "Charges Earned", value: formatMoney(rupees(totalPayout)) },
                    { label: "Avg / Weaver", value: `${perWeaver.length ? Math.round(totalProduced / perWeaver.length) : 0} pcs` },
                    { label: "Cost / Saree", value: totalPassed ? formatMoney(rupees(Math.round(totalPayout / totalPassed))) : "—" },
                  ].map(k => (
                    <div key={k.label} style={{ background: "rgba(255,255,255,0.80)", borderRadius: 12, padding: "10px 12px", border: `1px solid rgba(200,155,71,0.18)` }}>
                      <div style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 600, letterSpacing: "0.5px", color: T.taupe, marginBottom: 4, textTransform: "uppercase" as const }}>{k.label}</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>{k.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeUp>
        </>
      )}
      </SectionCard>
      </FadeUp>
    </div>
  );
}
