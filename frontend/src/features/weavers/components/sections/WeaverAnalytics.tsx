// ── Weaver production analytics (trend, cluster, quality vs output) ────────
import React, { useState } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, ComposedChart, Line, Legend,
  RadialBarChart, RadialBar,
} from "recharts";
import { ChartBar, Gauge, Yarn, Medal, MapPin as PhMapPin, CheckCircle } from "@phosphor-icons/react";
import { T, F } from "../theme";
import { Status } from "../types";
import { ANALYTICS_WEAVERS, PRODUCTION_LEDGER, STATUS_MIX_META, CLUSTER_FILLS, WA_MONTH_ABBR } from "../data";
import { FadeUp, Avatar, qcColor } from "../common/primitives";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";

export function WeaverAnalytics() {
  const [filter, setFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);

  const rows = React.useMemo(
    () => PRODUCTION_LEDGER.filter(r => matchesDateFilter(r.date, filter)),
    [filter]
  );

  const periodLabel = React.useMemo(() => {
    if (filter.mode === "day" && filter.day) return new Date(filter.day).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    if (filter.mode === "range") return `${filter.from || "start"} → ${filter.to || "today"}`;
    if (filter.mode === "month" && filter.month) { const [y, m] = filter.month.split("-"); return `${WA_MONTH_ABBR[+m - 1]} ${y}`; }
    if (filter.mode === "year" && filter.year) return filter.year;
    return "All time";
  }, [filter]);

  // Per-weaver rollup for the selected period.
  const perWeaver = React.useMemo(() => {
    const m = new Map<string, { produced: number; passed: number; payout: number }>();
    rows.forEach(r => {
      const e = m.get(r.weaverId) || { produced: 0, passed: 0, payout: 0 };
      e.produced += r.produced; e.passed += r.passed; e.payout += r.payout;
      m.set(r.weaverId, e);
    });
    return ANALYTICS_WEAVERS.map(w => {
      const agg = m.get(w.id) || { produced: 0, passed: 0, payout: 0 };
      return {
        ...w, ...agg,
        periodPassRate: agg.produced ? Math.round((agg.passed / agg.produced) * 100) : 0,
        perLoom: w.looms ? agg.produced / w.looms : 0,
      };
    }).filter(w => w.produced > 0);
  }, [rows]);

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

  const monthly = React.useMemo(() => {
    const m = new Map<string, { produced: number; passed: number }>();
    rows.forEach(r => {
      const key = r.date.slice(0, 7);
      const e = m.get(key) || { produced: 0, passed: 0 };
      e.produced += r.produced; e.passed += r.passed;
      m.set(key, e);
    });
    const all = [...m.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([key, v]) => ({
      month: `${WA_MONTH_ABBR[+key.slice(5) - 1]} ${key.slice(2, 4)}`,
      ...v,
      rate: v.produced ? Math.round((v.passed / v.produced) * 100) : 0,
    }));
    return all.length > 12 ? all.slice(-12) : all;
  }, [rows]);

  const trendDelta = React.useMemo(() => {
    if (monthly.length < 2) return null;
    const a = monthly[monthly.length - 1].produced, b = monthly[monthly.length - 2].produced;
    return b ? Math.round(((a - b) / b) * 100) : null;
  }, [monthly]);

  const statusMix = React.useMemo(() => (["active", "qc", "idle"] as Status[])
    .map(s => ({
      name: STATUS_MIX_META[s].label,
      value: perWeaver.filter(w => w.status === s).length,
      color: STATUS_MIX_META[s].color,
    }))
    .filter(d => d.value > 0), [perWeaver]);

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

  // Output vs quality — ranked bars beat a scatter plot here: a longer bar is
  // simply more sarees, and the colour alone tells you the quality band, so
  // there's nothing to decode across two axes plus a bubble size.
  const qualityVsOutput = React.useMemo(
    () => [...perWeaver].sort((a, b) => b.produced - a.produced).slice(0, 8),
    [perWeaver]
  );
  const maxOutput = Math.max(1, ...qualityVsOutput.map(w => w.produced));
  const atRisk = perWeaver.filter(w => w.periodPassRate < 92).length;
  const idleCount = perWeaver.filter(w => w.status === "idle").length;

  const card: React.CSSProperties = {
    background: "#FFFFFF", borderRadius: 20, border: `1px solid ${T.borderDef}`,
    boxShadow: "0 6px 32px rgba(74,6,27,0.07)", padding: "24px 28px",
  };
  const cardTitle: React.CSSProperties = { fontFamily: F.display, fontSize: 18, fontWeight: 700, color: T.luxuryBrown };
  const cardSub: React.CSSProperties = { fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: 3 };
  const tip = { fontFamily: F.ui, fontSize: 12, borderRadius: 10, border: `1px solid ${T.borderDef}`, boxShadow: "0 8px 24px rgba(74,6,27,0.12)" };
  const L = (n: number) => `₹${(n / 100000).toFixed(1)}L`;

  return (
    <div style={{ padding: "36px 48px 0" }}>
      <FadeUp>
        {/* Section heading */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div style={{ width: 3, height: 28, background: T.antiqueGold, borderRadius: 2 }} />
          <h2 style={{ fontFamily: F.display, fontSize: 26, color: T.luxuryBrown, margin: 0, fontWeight: 600 }}>Weaver Analytics</h2>
          <span style={{ fontFamily: F.mono, fontSize: 10.5, fontWeight: 700, letterSpacing: "1px", color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", padding: "4px 10px", borderRadius: 20, textTransform: "uppercase" as const }}>{periodLabel}</span>
        </div>

        {/* Timeline scope — drives every chart below */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" as const }}>
          <DateFilterBar filter={filter} onChange={setFilter} />
          <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
            {[
              { label: "SAREES WOVEN", value: totalProduced.toLocaleString("en-IN"), color: T.royalBurgundy },
              { label: "QC PASS RATE", value: `${overallPassRate}%`, color: qcColor(overallPassRate) },
              { label: "MAKING CHARGES", value: L(totalPayout), color: T.luxuryBrown },
            ].map(k => (
              <div key={k.label}>
                <div style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 600, letterSpacing: "1px", color: T.taupe }}>{k.label}</div>
                <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>
        </div>
      </FadeUp>

      {perWeaver.length === 0 ? (
        <div style={{ ...card, textAlign: "center", padding: "48px 24px" }}>
          <ChartBar size={40} color={T.taupe} />
          <div style={{ fontFamily: F.display, fontSize: 17, color: T.taupe, marginTop: 12 }}>No weaving recorded in this period.</div>
          <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: 6 }}>Widen the date range to see analytics.</div>
        </div>
      ) : (
        <>
          {/* ── Row 1: production trend + workforce status ── */}
          <FadeUp delay={0.04}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, marginBottom: 24 }}>
              <div style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                  <div>
                    <div style={cardTitle}>Sarees Produced vs Passed</div>
                    <div style={cardSub}>Monthly output against quality-check outcomes</div>
                  </div>
                  {trendDelta !== null && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, background: trendDelta >= 0 ? "rgba(30,102,64,0.09)" : "rgba(192,57,43,0.08)", padding: "5px 11px", borderRadius: 20 }}>
                      <ChartBar size={13} color={trendDelta >= 0 ? T.green : T.crimson} weight="fill" />
                      <span style={{ fontFamily: F.ui, fontSize: 11.5, fontWeight: 700, color: trendDelta >= 0 ? T.green : T.crimson }}>{trendDelta >= 0 ? "+" : ""}{trendDelta}% vs prev month</span>
                    </div>
                  )}
                </div>
                <div style={{ fontFamily: F.display, fontSize: 44, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1.1, margin: "10px 0 4px" }}>
                  {totalProduced.toLocaleString("en-IN")}
                </div>
                <ResponsiveContainer width="100%" height={230}>
                  <ComposedChart data={monthly} barSize={18}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(110,15,45,0.06)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontFamily: F.ui, fontSize: 11, fill: T.taupe }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontFamily: F.ui, fontSize: 11, fill: T.taupe }} axisLine={false} tickLine={false} width={34} />
                    <YAxis yAxisId="r" orientation="right" domain={[60, 100]} hide />
                    <RechartsTooltip contentStyle={tip} formatter={(v: any, n: any) => n === "Pass Rate" ? [`${v}%`, n] : [`${v} sarees`, n]} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, paddingTop: 8 }} />
                    <Bar name="Produced" dataKey="produced" fill={T.royalBurgundy} radius={[5, 5, 0, 0]} />
                    <Bar name="Passed QC" dataKey="passed" fill={T.goldLight} radius={[5, 5, 0, 0]} />
                    <Line yAxisId="r" name="Pass Rate" dataKey="rate" stroke={T.green} strokeWidth={2.5} dot={{ r: 3.5, fill: T.green, strokeWidth: 0 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div style={card}>
                <div style={cardTitle}>Workforce Status</div>
                <div style={cardSub}>Weavers active in this period</div>
                <div style={{ position: "relative", marginTop: 12 }}>
                  <ResponsiveContainer width="100%" height={172}>
                    <PieChart>
                      <Pie data={statusMix} dataKey="value" cx="50%" cy="50%" innerRadius={54} outerRadius={78} paddingAngle={3} stroke="none">
                        {statusMix.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <RechartsTooltip contentStyle={tip} formatter={(v: any) => [`${v} weavers`]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                    <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1 }}>{perWeaver.length}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 3 }}>weavers</div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
                  {statusMix.map(d => (
                    <div key={d.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />
                        <span style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>{d.name}</span>
                      </div>
                      <span style={{ fontFamily: F.mono, fontSize: 12.5, fontWeight: 700, color: T.luxuryBrown }}>{d.value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: `1px solid ${T.borderDef}`, marginTop: 14, paddingTop: 14, display: "flex", justifyContent: "space-between", fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                  <span>Looms engaged</span>
                  <span style={{ fontFamily: F.mono, fontWeight: 700, color: T.luxuryBrown }}>{totalLooms}</span>
                </div>
              </div>
            </div>
          </FadeUp>

          {/* ── Row 2: top 10 leaderboard + cluster contribution ── */}
          <FadeUp delay={0.08}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, marginBottom: 24 }}>
              <div style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(200,155,71,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Medal size={20} color={T.antiqueGold} weight="fill" />
                    </div>
                    <div>
                      <div style={cardTitle}>Top 10 Weavers by Output</div>
                      <div style={cardSub}>Sarees woven in {periodLabel.toLowerCase()} · bar colour shows QC pass rate</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    {[{ c: T.green, t: "≥95%" }, { c: "#8B6018", t: "85–94%" }, { c: T.crimson, t: "<85%" }].map(g => (
                      <div key={g.t} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <div style={{ width: 9, height: 9, borderRadius: 3, background: g.c }} />
                        <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>{g.t}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={330}>
                  <BarChart data={top10} layout="vertical" barSize={19} margin={{ left: 4, right: 62 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(110,15,45,0.06)" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="short" width={116} tick={{ fontFamily: F.ui, fontSize: 12, fill: T.luxuryBrown }} axisLine={false} tickLine={false} />
                    <RechartsTooltip cursor={{ fill: "rgba(110,15,45,0.04)" }} contentStyle={tip}
                      formatter={(v: any, _n: any, p: any) => [`${v} sarees · ${p.payload.periodPassRate}% pass · ${L(p.payload.payout)} earned`, p.payload.name]} />
                    <Bar dataKey="produced" radius={[0, 6, 6, 0]}
                      label={{ position: "right", formatter: (v: any) => `${v}`, fontFamily: F.mono, fontSize: 11.5, fontWeight: 700, fill: T.luxuryBrown }}>
                      {top10.map(w => <Cell key={w.id} fill={qcColor(w.periodPassRate)} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                {/* Podium strip */}
                <div style={{ display: "flex", gap: 10, borderTop: `1px solid ${T.borderDef}`, paddingTop: 16, marginTop: 6 }}>
                  {top10.slice(0, 3).map((w, i) => (
                    <div key={w.id} style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, background: i === 0 ? "rgba(200,155,71,0.08)" : T.silkCream, border: `1px solid ${i === 0 ? T.borderGold : T.borderDef}`, borderRadius: 14, padding: "12px 14px" }}>
                      <div style={{ width: 30, height: 30, borderRadius: 10, flexShrink: 0, background: i === 0 ? "linear-gradient(135deg,#C89B47,#E7C983)" : "rgba(110,15,45,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: 15, fontWeight: 700, color: i === 0 ? "#FFF" : T.taupe }}>{i + 1}</div>
                      <Avatar photo={w.photo} initials={w.initials} bg={w.bg} size={36} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{w.name}</div>
                        <div style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>{w.produced} sarees · {totalProduced ? Math.round((w.produced / totalProduced) * 100) : 0}% of output</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={card}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <PhMapPin size={18} color={T.royalBurgundy} weight="fill" />
                  <div style={cardTitle}>Output by Cluster</div>
                </div>
                <div style={cardSub}>Which weaving villages carry production</div>
                <ResponsiveContainer width="100%" height={186}>
                  <PieChart>
                    <Pie data={byCluster} dataKey="produced" nameKey="cluster" cx="50%" cy="50%" innerRadius={44} outerRadius={74} paddingAngle={3} stroke="none">
                      {byCluster.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Pie>
                    <RechartsTooltip contentStyle={tip} formatter={(v: any, _n: any, p: any) => [`${v} sarees · ${p.payload.weavers} weavers`, p.payload.cluster]} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 8 }}>
                  {byCluster.map(c => (
                    <div key={c.cluster}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                          <div style={{ width: 10, height: 10, borderRadius: 3, background: c.fill, flexShrink: 0 }} />
                          <span style={{ fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.cluster}</span>
                        </div>
                        <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.luxuryBrown, flexShrink: 0 }}>{totalProduced ? Math.round((c.produced / totalProduced) * 100) : 0}%</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 4, background: "rgba(110,15,45,0.06)", overflow: "hidden" }}>
                        <div style={{ width: `${totalProduced ? (c.produced / totalProduced) * 100 : 0}%`, height: "100%", background: c.fill, borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeUp>

          {/* ── Row 3: quality vs output, loom productivity, health gauge ── */}
          <FadeUp delay={0.12}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
              <div style={card}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Gauge size={18} color={T.royalBurgundy} weight="fill" />
                  <div style={cardTitle}>Quality vs Output</div>
                </div>
                <div style={cardSub}>Longer bar = more sarees woven · colour = quality</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 14 }}>
                  {qualityVsOutput.map(w => {
                    const tier = w.periodPassRate >= 95 ? { color: T.green, label: "Excellent" }
                      : w.periodPassRate >= 92 ? { color: T.antiqueGold, label: "Good" }
                      : { color: T.crimson, label: "Needs attention" };
                    const pct = Math.max(6, Math.round((w.produced / maxOutput) * 100));
                    return (
                      <div key={w.id}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                          <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis", maxWidth: 130 }}>{w.name}</span>
                          <span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: tier.color, flexShrink: 0 }}>{w.produced} sarees · {w.periodPassRate}%</span>
                        </div>
                        <div style={{ height: 9, borderRadius: 5, background: "rgba(110,15,45,0.06)", overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", borderRadius: 5, background: tier.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${T.borderDef}`, paddingTop: 12, marginTop: 14, fontFamily: F.ui, fontSize: 11.5 }}>
                  <div style={{ display: "flex", gap: 10 }}>
                    {[{ c: T.green, t: "Excellent ≥95%" }, { c: T.antiqueGold, t: "Good 92–94%" }, { c: T.crimson, t: "Needs attention <92%" }].map(g => (
                      <span key={g.t} style={{ display: "flex", alignItems: "center", gap: 4, color: T.taupe }}>
                        <span style={{ width: 8, height: 8, borderRadius: 3, background: g.c, display: "inline-block" }} /> {g.t}
                      </span>
                    ))}
                  </div>
                </div>
                {atRisk > 0 && (
                  <div style={{ marginTop: 8, fontFamily: F.ui, fontSize: 11.5, color: T.crimson, fontWeight: 700 }}>{atRisk} weaver{atRisk === 1 ? "" : "s"} below 92% pass rate</div>
                )}
              </div>

              <div style={card}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Yarn size={18} color={T.royalBurgundy} weight="fill" />
                  <div style={cardTitle}>Loom Productivity</div>
                </div>
                <div style={cardSub}>Sarees per loom · avg {avgPerLoom.toFixed(1)}</div>
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={loomProductivity} barSize={20} margin={{ top: 14, left: -18, right: 6 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(110,15,45,0.06)" vertical={false} />
                    <XAxis dataKey="short" tick={{ fontFamily: F.mono, fontSize: 10.5, fill: T.taupe }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontFamily: F.ui, fontSize: 10.5, fill: T.taupe }} axisLine={false} tickLine={false} width={34} />
                    <RechartsTooltip cursor={{ fill: "rgba(110,15,45,0.04)" }} contentStyle={tip}
                      formatter={(v: any, _n: any, p: any) => [`${v} per loom · ${p.payload.looms} looms`, p.payload.name]} />
                    <Bar dataKey="perLoomR" radius={[5, 5, 0, 0]}>
                      {loomProductivity.map(w => <Cell key={w.id} fill={w.perLoom >= avgPerLoom ? T.royalBurgundy : T.goldLight} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${T.borderDef}`, paddingTop: 12, marginTop: 8, fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                  <span>{totalLooms} looms engaged</span>
                  <span style={{ color: T.luxuryBrown, fontWeight: 600 }}>{idleCount} weaver{idleCount === 1 ? "" : "s"} idle</span>
                </div>
              </div>

              <div style={card}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <CheckCircle size={18} color={T.green} weight="fill" />
                  <div style={cardTitle}>Weaving Health</div>
                </div>
                <div style={cardSub}>Quality and payout summary</div>
                <ResponsiveContainer width="100%" height={148}>
                  <RadialBarChart innerRadius="62%" outerRadius="100%" startAngle={210} endAngle={-30}
                    data={[{ name: "Pass", value: overallPassRate, fill: qcColor(overallPassRate) }]}>
                    <RadialBar dataKey="value" background={{ fill: T.silkCream }} cornerRadius={10} />
                    <text x="50%" y="60%" textAnchor="middle" style={{ fontFamily: F.display, fontSize: 32, fontWeight: 700, fill: T.luxuryBrown }}>{overallPassRate}%</text>
                    <text x="50%" y="80%" textAnchor="middle" style={{ fontFamily: F.ui, fontSize: 11, fill: T.taupe }}>QC PASS RATE</text>
                  </RadialBarChart>
                </ResponsiveContainer>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 }}>
                  {[
                    { label: "Rejected", value: `${(totalProduced - totalPassed).toLocaleString("en-IN")} pcs` },
                    { label: "Making Charges", value: L(totalPayout) },
                    { label: "Avg / Weaver", value: `${perWeaver.length ? Math.round(totalProduced / perWeaver.length) : 0} pcs` },
                    { label: "Cost / Saree", value: totalPassed ? `₹${Math.round(totalPayout / totalPassed).toLocaleString("en-IN")}` : "—" },
                  ].map(k => (
                    <div key={k.label} style={{ background: T.silkCream, borderRadius: 10, padding: "10px 12px", border: `1px solid ${T.borderDef}` }}>
                      <div style={{ fontFamily: F.ui, fontSize: 9.5, fontWeight: 600, letterSpacing: "0.5px", color: T.taupe, marginBottom: 4, textTransform: "uppercase" as const }}>{k.label}</div>
                      <div style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>{k.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeUp>
        </>
      )}
    </div>
  );
}

