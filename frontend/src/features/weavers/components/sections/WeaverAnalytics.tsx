import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  RadialBarChart, RadialBar,
} from "recharts";
import { ChartBar, Gauge, Yarn, CheckCircle } from "@phosphor-icons/react";
import { T, F } from "../theme";
import { Status } from "../types";
import { STATUS_MIX_META, CLUSTER_FILLS } from "../data";
import { FadeUp, qcColor } from "../common/primitives";
import { WeaverLeaderboardClusterRow } from "./WeaverLeaderboardClusterRow";
import { weaversApi, BackendWeaverStats } from "../../../../shared/api/weavers";
import { resolveAssetUrl } from "../../../../shared/api/uploads";

const AVATAR_PALETTE = ["#5A3E6B", "#6E0F2D", "#2D6B6B", "#4A6B4A", "#9B6B8A", "#2D7D6B", "#4A5E7A", "#7A2040"];

// Real aggregate weaver analytics from GET /weavers + GET /weavers/:id/stats.
// The backend has no dated production-ledger endpoint yet (no per-month
// breakdown, no per-saree payout), so this view shows all-time totals only —
// the monthly trend chart that used to exist here was fabricated mock data
// and has been replaced with a documented gap notice below.
export function WeaverAnalytics() {
  const periodLabel = "All time";

  const { data: weaversRes, isLoading: rosterLoading, isError: rosterError } = useQuery({
    queryKey: ["weaver-analytics-roster"],
    queryFn: () => weaversApi.list(),
  });
  const roster = weaversRes?.items ?? [];

  const { data: statsList, isLoading: statsLoading, isError: statsError } = useQuery({
    queryKey: ["weaver-analytics-stats", roster.map(w => w.id)],
    queryFn: () => Promise.all(roster.map(w => weaversApi.getStats(w.id))),
    enabled: roster.length > 0,
  });
  const isLoading = rosterLoading || (roster.length > 0 && statsLoading);
  const isError = rosterError || statsError;
  const statsById = new Map((statsList ?? []).map(s => [s.weaverId, s]));

  const perWeaver = React.useMemo(() => {
    return roster.map((w, i) => {
      const s: BackendWeaverStats | undefined = statsById.get(w.id);
      const produced = s?.totalSareesWoven ?? 0;
      const passed = s?.qcPassCount ?? 0;
      const status: Status = (s && s.activeBatchRowsCount > 0) ? "active" : "idle";
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
        payout: 0, // Not tracked by the backend yet
        periodPassRate: s?.qcPassRate ?? 0,
        perLoom: w.looms ? produced / w.looms : 0,
      };
    }).filter(w => w.produced > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roster, statsList]);

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
  return (
    <div style={{ padding: "36px 48px 0" }}>
      <FadeUp>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div style={{ width: 3, height: 28, background: T.antiqueGold, borderRadius: 2 }} />
          <h2 style={{ fontFamily: F.display, fontSize: 24, color: T.luxuryBrown, margin: 0, fontWeight: 600 }}>Weaver Analytics</h2>
          <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, letterSpacing: "1px", color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", padding: "4px 10px", borderRadius: 20, textTransform: "uppercase" as const }}>{periodLabel}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 16, flexWrap: "wrap" as const }}>
          <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
            {[
              { label: "SAREES WOVEN", value: totalProduced.toLocaleString("en-IN"), color: T.royalBurgundy },
              { label: "QC PASS RATE", value: `${overallPassRate}%`, color: qcColor(overallPassRate) },
              { label: "MAKING CHARGES", value: "—", color: T.luxuryBrown },
            ].map(k => (
              <div key={k.label}>
                <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, letterSpacing: "1px", color: T.taupe }}>{k.label}</div>
                <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>
        </div>
      </FadeUp>

      {isLoading ? (
        <div style={{ ...card, textAlign: "center", padding: "48px 24px" }}>
          <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>Loading weaver analytics…</div>
        </div>
      ) : isError ? (
        <div style={{ ...card, textAlign: "center", padding: "48px 24px" }}>
          <div style={{ fontFamily: F.ui, fontSize: 14, color: T.crimson }}>Couldn't load weaver analytics.</div>
        </div>
      ) : perWeaver.length === 0 ? (
        <div style={{ ...card, textAlign: "center", padding: "48px 24px" }}>
          <ChartBar size={40} color={T.taupe} />
          <div style={{ fontFamily: F.display, fontSize: 16, color: T.taupe, marginTop: 12 }}>No weaving recorded yet.</div>
          <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: 6 }}>Analytics will appear once weavers have production/QC history.</div>
        </div>
      ) : (
        <>
          <FadeUp delay={0.04}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, marginBottom: 24 }}>
              <div style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                  <div>
                    <div style={cardTitle}>Sarees Produced vs Passed</div>
                    <div style={cardSub}>All-time output against quality-check outcomes</div>
                  </div>
                </div>
                <div style={{ fontFamily: F.display, fontSize: 48, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1.1, margin: "10px 0 4px" }}>
                  {totalProduced.toLocaleString("en-IN")}
                </div>
                <div style={{ ...card, background: T.silkCream, border: `1px dashed ${T.borderDef}`, padding: "18px 20px", textAlign: "center" }}>
                  <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
                    Monthly production trend is not tracked by the backend yet — GET /weavers/:id/stats
                    only exposes all-time totals, not a dated production ledger.
                  </div>
                </div>
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
                      <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.luxuryBrown }}>{d.value}</span>
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

          <FadeUp delay={0.08}>
            <WeaverLeaderboardClusterRow
              top10={top10}
              periodLabel={periodLabel}
              totalProduced={totalProduced}
              byCluster={byCluster}
            />
          </FadeUp>

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
                          <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: tier.color, flexShrink: 0 }}>{w.produced} sarees · {w.periodPassRate}%</span>
                        </div>
                        <div style={{ height: 9, borderRadius: 5, background: "rgba(110,15,45,0.06)", overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", borderRadius: 5, background: tier.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${T.borderDef}`, paddingTop: 12, marginTop: 14, fontFamily: F.ui, fontSize: 12 }}>
                  <div style={{ display: "flex", gap: 10 }}>
                    {[{ c: T.green, t: "Excellent ≥95%" }, { c: T.antiqueGold, t: "Good 92–94%" }, { c: T.crimson, t: "Needs attention <92%" }].map(g => (
                      <span key={g.t} style={{ display: "flex", alignItems: "center", gap: 4, color: T.taupe }}>
                        <span style={{ width: 8, height: 8, borderRadius: 3, background: g.c, display: "inline-block" }} /> {g.t}
                      </span>
                    ))}
                  </div>
                </div>
                {atRisk > 0 && (
                  <div style={{ marginTop: 8, fontFamily: F.ui, fontSize: 12, color: T.crimson, fontWeight: 700 }}>{atRisk} weaver{atRisk === 1 ? "" : "s"} below 92% pass rate</div>
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
                    <XAxis dataKey="short" tick={{ fontFamily: F.mono, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontFamily: F.ui, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} width={34} />
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
                    <text x="50%" y="60%" textAnchor="middle" style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, fill: T.luxuryBrown }}>{overallPassRate}%</text>
                    <text x="50%" y="80%" textAnchor="middle" style={{ fontFamily: F.ui, fontSize: 12, fill: T.taupe }}>QC PASS RATE</text>
                  </RadialBarChart>
                </ResponsiveContainer>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 }}>
                  {[
                    { label: "Rejected", value: `${(totalProduced - totalPassed).toLocaleString("en-IN")} pcs` },
                    { label: "Making Charges", value: "—" },
                    { label: "Avg / Weaver", value: `${perWeaver.length ? Math.round(totalProduced / perWeaver.length) : 0} pcs` },
                    { label: "Cost / Saree", value: totalPassed ? `₹${Math.round(totalPayout / totalPassed).toLocaleString("en-IN")}` : "—" },
                  ].map(k => (
                    <div key={k.label} style={{ background: T.silkCream, borderRadius: 10, padding: "10px 12px", border: `1px solid ${T.borderDef}` }}>
                      <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, letterSpacing: "0.5px", color: T.taupe, marginBottom: 4, textTransform: "uppercase" as const }}>{k.label}</div>
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
