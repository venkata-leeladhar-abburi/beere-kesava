import React, { useState } from "react";
import {
  Trophy, Timer, BarChart3 as ChartBar,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { FactoryLoom } from "../../data/factoryLooms";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";
import { T, F, FadeUp } from "./theme";
import { SectionCard } from "../common/primitives";
import { LoomBatch, LoomMaterial, LoomSaree, MAT_TAG, LOOM_STATUS_TO_CONDITION } from "./types";
import { LoomThroughputAndAvailability, LoomMaterialDesignRow } from "./LoomAnalyticsCharts";
import { ChartFigure } from "../../../../shared/ui/data";
import { StatusPill, EntityCode } from "../../../../shared/ui/domain";

const LA_MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const UTIL_META: Record<string, { label: string; color: string }> = {
  active:      { label: "Active",      color: T.green },
  idle:        { label: "Idle",        color: T.antiqueGold },
  maintenance: { label: "Maintenance", color: T.crimson },
};
const FLOOR_FILLS = [T.royalBurgundy, T.antiqueGold, T.green, "#5A3E6B", "#2D6B6B"];
const laQcColor = (r: number) => (r >= 95 ? T.green : r >= 85 ? "#8B6018" : T.crimson);

export function LoomAnalytics({ looms, batches, materials, sarees }: {
  looms: FactoryLoom[]; batches: LoomBatch[]; materials: LoomMaterial[]; sarees: LoomSaree[];
}) {
  const [filter, setFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);

  const doneSarees = React.useMemo(
    () => sarees.filter(s => s.status === "complete" && matchesDateFilter(s.completedDate, filter)),
    [sarees, filter]
  );
  const periodMaterials = React.useMemo(
    () => materials.filter(m => matchesDateFilter(m.date, filter)),
    [materials, filter]
  );

  const periodLabel = React.useMemo(() => {
    if (filter.mode === "day" && filter.day) return new Date(filter.day).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    if (filter.mode === "range") return `${filter.from || "start"} → ${filter.to || "today"}`;
    if (filter.mode === "month" && filter.month) { const [y, m] = filter.month.split("-"); return `${LA_MONTH_ABBR[+m - 1]} ${y}`; }
    if (filter.mode === "year" && filter.year) return filter.year;
    return "All time";
  }, [filter]);

  const produced = doneSarees.length;
  const passed = doneSarees.filter(s => s.qualityStatus === "pass").length;
  const failed = doneSarees.filter(s => s.qualityStatus === "fail").length;
  const passRate = produced ? Math.round((passed / produced) * 100) : 0;

  const utilisation = React.useMemo(() => (["active", "idle", "maintenance"] as const)
    .map(k => ({ key: k, name: UTIL_META[k].label, value: looms.filter(l => l.status === k).length, color: UTIL_META[k].color }))
    .filter(d => d.value > 0), [looms]);
  const activeLooms = looms.filter(l => l.status === "active").length;
  const utilRate = looms.length ? Math.round((activeLooms / looms.length) * 100) : 0;

  const allDoneSarees = React.useMemo(() => sarees.filter(s => s.status === "complete"), [sarees]);

  const monthly = React.useMemo(() => {
    const m = new Map<string, { produced: number; passed: number }>();
    allDoneSarees.forEach(s => {
      const d = new Date(s.completedDate!);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const e = m.get(key) || { produced: 0, passed: 0 };
      e.produced += 1;
      if (s.qualityStatus === "pass") e.passed += 1;
      m.set(key, e);
    });
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([key, v]) => ({
      month: `${LA_MONTH_ABBR[+key.slice(5) - 1]} ${key.slice(2, 4)}`,
      ...v,
      rate: v.produced ? Math.round((v.passed / v.produced) * 100) : 0,
    }));
  }, [allDoneSarees]);

  const perLoom = React.useMemo(() => looms.map(l => {
    const mine = doneSarees.filter(s => s.loomId === l.id);
    const ok = mine.filter(s => s.qualityStatus === "pass").length;
    const loomBatches = batches.filter(b => b.loomId === l.id);
    const assigned = loomBatches.filter(b => b.status === "active").reduce((a, b) => a + b.sareeCount, 0);
    return {
      ...l,
      short: l.loomNumber.replace("Loom ", ""),
      produced: mine.length,
      passed: ok,
      rejects: mine.length - ok,
      passRate: mine.length ? Math.round((ok / mine.length) * 100) : 0,
      activeBatches: loomBatches.filter(b => b.status === "active").length,
      assigned,
      wip: sarees.filter(s => s.loomId === l.id && s.status === "in-progress").length,
    };
  }), [looms, doneSarees, batches, sarees]);

  const rankedLooms = React.useMemo(
    () => [...perLoom].sort((a, b) => b.produced - a.produced),
    [perLoom]
  );

  const batchProgress = React.useMemo(() => {
    const today = new Date();
    return batches
    .filter(b => b.status === "active")
    .map(b => {
      const due = new Date(b.dueDate);
      const daysLeft = isNaN(due.getTime()) ? null : Math.ceil((due.getTime() - today.getTime()) / 86400000);
      const loom = looms.find(l => l.id === b.loomId);
      return {
        ...b,
        loomName: loom?.loomNumber ?? b.loomId,
        pct: b.sareeCount ? Math.round((b.completedCount / b.sareeCount) * 100) : 0,
        daysLeft,
        overdue: daysLeft !== null && daysLeft < 0,
      };
    })
    .sort((a, b) => (a.daysLeft ?? 999) - (b.daysLeft ?? 999));
  }, [batches, looms]);
  const overdueCount = batchProgress.filter(b => b.overdue).length;
  const pipeline = batches.filter(b => b.status === "active").reduce((a, b) => a + (b.sareeCount - b.completedCount), 0);

  const byMaterial = React.useMemo(() => {
    const m = new Map<string, { qty: number; type: string; unit: string }>();
    periodMaterials.forEach(x => {
      const key = `${x.materialType}|${x.unit}`;
      const e = m.get(key) || { qty: 0, type: x.materialType, unit: x.unit };
      e.qty += x.quantity;
      m.set(key, e);
    });
    return [...m.values()]
      .map(v => ({ ...v, label: `${v.type} (${v.unit})`, fill: MAT_TAG[v.type]?.col ?? T.taupe }))
      .sort((a, b) => b.qty - a.qty);
  }, [periodMaterials]);
  const warpKg = periodMaterials.filter(m => m.materialType === "Warp" && m.unit === "kg").reduce((a, m) => a + m.quantity, 0);

  const byDesign = React.useMemo(() => {
    const m = new Map<string, { produced: number; looms: number; active: number }>();
    doneSarees.forEach(s => {
      const e = m.get(s.sareeType) || { produced: 0, looms: 1, active: 1 };
      e.produced += 1;
      m.set(s.sareeType, e);
    });
    return [...m.entries()]
      .map(([type, v], i) => ({ type, short: type, ...v, fill: FLOOR_FILLS[i % FLOOR_FILLS.length] }))
      .sort((a, b) => b.produced - a.produced)
      .slice(0, 5);
  }, [doneSarees]);

  const card: React.CSSProperties = {
    background: "#FFF", borderRadius: 20, border: `1px solid ${T.borderDef}`,
    padding: "24px 28px", boxShadow: "0 2px 12px rgba(74,6,27,0.05)",
  };
  const cardTitle: React.CSSProperties = { fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown };
  const cardSub: React.CSSProperties = { fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 3 };
  const tip = { fontFamily: F.ui, fontSize: 12, borderRadius: 10, border: `1px solid ${T.borderDef}`, boxShadow: "0 8px 24px rgba(74,6,27,0.12)" };

  return (
    <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 34 }}>
      <FadeUp>
      <SectionCard
        icon={ChartBar}
        title="Loom Analytics"
        subtitle="Throughput, QC pass rate, and loom utilisation across the factory floor."
        actions={
          <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, letterSpacing: "1px", color: "#FFFDF9", background: "rgba(255,255,255,0.14)", padding: "6px 14px", borderRadius: 20, textTransform: "uppercase" as const }}>{periodLabel}</span>
        }
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" as const }}>
          <DateFilterBar filter={filter} onChange={setFilter} />
          <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
            {[
              { label: "SAREES WOVEN", value: String(produced), color: T.royalBurgundy },
              { label: "QC PASS RATE", value: `${passRate}%`, color: laQcColor(passRate) },
              { label: "LOOM UTILISATION", value: `${utilRate}%`, color: utilRate >= 70 ? T.green : T.crimson },
            ].map(k => (
              <div key={k.label}>
                <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, letterSpacing: "1px", color: T.taupe }}>{k.label}</div>
                <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>
        </div>

      {/* Row 1: Throughput + Loom Availability */}
      <FadeUp delay={0.04}>
        <LoomThroughputAndAvailability
          produced={produced}
          passRate={passRate}
          failed={failed}
          pipeline={pipeline}
          monthly={monthly}
          utilisation={utilisation}
          utilRate={utilRate}
          perLoom={perLoom}
        />
      </FadeUp>

      {/* Row 2: Output by Loom + Batch Delivery Risk */}
      <FadeUp delay={0.08}>
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr]" style={{ gap: 22, marginBottom: 22 }}>
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Trophy size={17} color={T.antiqueGold} />
                <div>
                  <div style={cardTitle}>Output by Loom</div>
                  <div style={cardSub}>Sarees completed · bar colour shows QC pass rate</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                {[{ c: T.green, t: "≥95%" }, { c: "#8B6018", t: "85–94%" }, { c: T.crimson, t: "<85%" }].map(g => (
                  <div key={g.t} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 9, height: 9, borderRadius: 3, background: g.c }} />
                    <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{g.t}</span>
                  </div>
                ))}
              </div>
            </div>
            <ChartFigure title="Output by Loom" summary={`${produced} sarees completed across ${rankedLooms.length} looms, ${passRate}% overall QC pass rate.`}>
              <ResponsiveContainer width="100%" height={215}>
                <BarChart data={rankedLooms} layout="vertical" barSize={22} margin={{ left: 4, right: 54 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(110,15,45,0.06)" horizontal={false} />
                  <XAxis type="number" hide allowDecimals={false} />
                  <YAxis type="category" dataKey="short" width={68} tick={{ fontFamily: F.ui, fontSize: 12, fill: T.luxuryBrown }} axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{ fill: "rgba(110,15,45,0.04)" }} contentStyle={tip}
                    formatter={(v: number, _n: string, p: { payload: (typeof rankedLooms)[number] }) => [`${v} completed · ${p.payload.passRate}% pass · ${p.payload.wip} in progress`, `${p.payload.loomNumber} — ${p.payload.operatorName}`]} />
                  <Bar dataKey="produced" radius={[0, 6, 6, 0]}
                    label={{ position: "right", formatter: (v: number) => `${v}`, fontFamily: F.ui, fontSize: 12, fontWeight: 700, fill: T.luxuryBrown }}>
                    {rankedLooms.map(l => <Cell key={l.id} fill={l.produced === 0 ? "#E3D2AC" : laQcColor(l.passRate)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartFigure>
            <div style={{ display: "flex", gap: 8, borderTop: `1px solid ${T.borderDef}`, paddingTop: 14, marginTop: 6 }}>
              {rankedLooms.slice(0, 4).map((l, i) => (
                <div key={l.id} style={{ flex: 1, minWidth: 0, background: i === 0 && l.produced > 0 ? "rgba(200,155,71,0.08)" : T.silkCream, border: `1px solid ${i === 0 && l.produced > 0 ? T.borderGold : T.borderDef}`, borderRadius: 12, padding: "10px 12px" }}>
                  <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.luxuryBrown, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>{l.short}</div>
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 }}>{l.operatorName}</div>
                  <div style={{ marginTop: 4 }}><StatusPill taxonomy="condition" status={LOOM_STATUS_TO_CONDITION[l.status]} size="sm" /></div>
                </div>
              ))}
            </div>
          </div>

          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Timer size={16} color={overdueCount ? T.crimson : T.royalBurgundy} />
              <div style={cardTitle}>Batch Delivery Risk</div>
            </div>
            <div style={cardSub}>Active batches by nearest due date</div>
            <div style={{ background: overdueCount ? "rgba(192,57,43,0.08)" : "rgba(30,102,64,0.09)", borderRadius: 14, padding: "14px 18px", margin: "16px 0" }}>
              <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, letterSpacing: "1.1px", color: T.taupe, marginBottom: 6 }}>PAST DUE</div>
              <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: overdueCount ? T.crimson : T.green, lineHeight: 1 }}>{overdueCount}</div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 6 }}>of {batchProgress.length} active batches</div>
            </div>
            {batchProgress.length === 0 ? (
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>No active batches on the floor.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {batchProgress.map(b => (
                  <div key={b.batchId}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <EntityCode type="batch" value={b.batchId} size="sm" />
                      <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: b.overdue ? T.crimson : b.daysLeft !== null && b.daysLeft <= 5 ? "#E67E22" : T.taupe }}>
                        {b.daysLeft === null ? b.dueDate : b.overdue ? `${Math.abs(b.daysLeft)}d overdue` : `${b.daysLeft}d left`}
                      </span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: T.silkCream, overflow: "hidden" }}>
                      <div style={{ width: `${b.pct}%`, height: "100%", borderRadius: 4, background: b.overdue ? "linear-gradient(90deg,#C0392B,#E74C3C)" : `linear-gradient(90deg,${T.deepWine},${T.royalBurgundy})` }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 4 }}>
                      <span>{b.loomName} · {b.designCode}</span>
                      <span>{b.completedCount}/{b.sareeCount} · {b.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </FadeUp>

      {/* Row 3: Material draw, floor comparison, factory health */}
      <FadeUp delay={0.12}>
        <LoomMaterialDesignRow
          byMaterial={byMaterial}
          warpKg={warpKg}
          produced={produced}
          byDesign={byDesign}
          passRate={passRate}
          failed={failed}
          activeLooms={activeLooms}
          pipeline={pipeline}
          looms={looms}
        />
      </FadeUp>
      </SectionCard>
      </FadeUp>
    </div>
  );
}
