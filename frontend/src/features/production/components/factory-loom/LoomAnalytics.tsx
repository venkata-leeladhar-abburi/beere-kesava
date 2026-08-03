import React, { useState } from "react";
import {
  Factory, Layers, Package, TrendingUp, Trophy, Percent, Timer,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Line, Legend,
  RadialBarChart, RadialBar,
} from "recharts";
import { FactoryLoom } from "../../data/factoryLooms";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";
import { T, F, FadeUp } from "./theme";
import { LoomBatch, LoomMaterial, LoomSaree, MAT_TAG, STATUS_CFG } from "./types";

// ── Analytics ────────────────────────────────────────────────────────────────
// Reads the loom / batch / material / saree records directly, scoped by one
// shared timeline control. Sarees are dated by completion, materials by issue
// date, batches by start date.

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

  // Loom availability is current state, not period-scoped.
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

  // Active batches with their delivery risk — the operational hot list.
  const today = new Date();
  const batchProgress = React.useMemo(() => batches
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
    .sort((a, b) => (a.daysLeft ?? 999) - (b.daysLeft ?? 999)),
    [batches, looms]);
  const overdueCount = batchProgress.filter(b => b.overdue).length;
  const pipeline = batches.filter(b => b.status === "active").reduce((a, b) => a + (b.sareeCount - b.completedCount), 0);

  // Warp and Resham are kg; Jari comes in Reels or Buns — so units are never mixed.
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
      .slice(0, 5); // top 5 designs
  }, [doneSarees]);

  const card: React.CSSProperties = {
    background: "#FFF", borderRadius: 20, border: `1px solid ${T.borderDef}`,
    padding: "24px 28px", boxShadow: "0 2px 12px rgba(74,6,27,0.05)",
  };
  const cardTitle: React.CSSProperties = { fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown };
  const cardSub: React.CSSProperties = { fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 3 };
  const tip = { fontFamily: F.ui, fontSize: 12, borderRadius: 10, border: `1px solid ${T.borderDef}`, boxShadow: "0 8px 24px rgba(74,6,27,0.12)" };

  return (
    <div style={{ padding: "34px 56px 0" }}>
      <FadeUp>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div style={{ width: 3, height: 28, background: T.antiqueGold, borderRadius: 2 }} />
          <h2 style={{ fontFamily: F.display, fontSize: 26, color: T.luxuryBrown, margin: 0, fontWeight: 600 }}>Loom Analytics</h2>
          <span style={{ fontFamily: F.mono, fontSize: 10.5, fontWeight: 700, letterSpacing: "1px", color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", padding: "4px 10px", borderRadius: 20, textTransform: "uppercase" as const }}>{periodLabel}</span>
        </div>

        {/* Timeline scope — drives every chart in this section */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" as const }}>
          <DateFilterBar filter={filter} onChange={setFilter} />
          <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
            {[
              { label: "SAREES WOVEN", value: String(produced), color: T.royalBurgundy },
              { label: "QC PASS RATE", value: `${passRate}%`, color: laQcColor(passRate) },
              { label: "LOOM UTILISATION", value: `${utilRate}%`, color: utilRate >= 70 ? T.green : T.crimson },
            ].map(k => (
              <div key={k.label}>
                <div style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 600, letterSpacing: "1px", color: T.taupe }}>{k.label}</div>
                <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>
        </div>
      </FadeUp>

      {/* ── Row 1: throughput + loom availability ── */}
      <FadeUp delay={0.04}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 22, marginBottom: 22 }}>
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={cardTitle}>Factory Throughput</div>
                <div style={cardSub}>Sarees completed against quality-check outcomes</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: passRate >= 90 ? "rgba(30,102,64,0.09)" : "rgba(192,57,43,0.08)", padding: "4px 10px", borderRadius: 20 }}>
                <TrendingUp size={13} color={passRate >= 90 ? T.green : T.crimson} />
                <span style={{ fontFamily: F.ui, fontSize: 11.5, fontWeight: 700, color: passRate >= 90 ? T.green : T.crimson }}>{failed} rejected</span>
              </div>
            </div>
            <div style={{ fontFamily: F.display, fontSize: 42, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1.1, margin: "10px 0 2px" }}>{produced}</div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 8 }}>{pipeline} sarees still in the pipeline across active batches</div>
            {monthly.length === 0 ? (
              <div style={{ padding: "60px 0", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13.5, color: T.taupe }}>No sarees completed in this period.</div>
            ) : (
              <ResponsiveContainer width="100%" height={208}>
                <ComposedChart data={monthly} barSize={26}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(110,15,45,0.06)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontFamily: F.ui, fontSize: 11, fill: T.taupe }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontFamily: F.ui, fontSize: 11, fill: T.taupe }} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
                  <YAxis yAxisId="r" orientation="right" domain={[0, 100]} hide />
                  <RechartsTooltip contentStyle={tip} formatter={(v: any, n: any) => n === "Pass Rate" ? [`${v}%`, n] : [`${v} sarees`, n]} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe, paddingTop: 8 }} />
                  <Bar name="Completed" dataKey="produced" fill={T.royalBurgundy} radius={[5, 5, 0, 0]} />
                  <Bar name="Passed QC" dataKey="passed" fill={T.goldLight} radius={[5, 5, 0, 0]} />
                  <Line yAxisId="r" name="Pass Rate" dataKey="rate" stroke={T.green} strokeWidth={2.5} dot={{ r: 3.5, fill: T.green, strokeWidth: 0 }} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>

          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Factory size={16} color={T.royalBurgundy} />
              <div style={cardTitle}>Loom Availability</div>
            </div>
            <div style={cardSub}>Current floor state · idle looms are lost capacity</div>
            <div style={{ position: "relative" as const, marginTop: 12 }}>
              <ResponsiveContainer width="100%" height={172}>
                <PieChart>
                  <Pie data={utilisation} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={54} outerRadius={78} paddingAngle={3} stroke="none">
                    {utilisation.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={tip} formatter={(v: any, _n: any, p: any) => [`${v} looms`, p.payload.name]} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: "absolute" as const, inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" as const }}>
                <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1 }}>{utilRate}%</div>
                <div style={{ fontFamily: F.ui, fontSize: 10.5, color: T.taupe, marginTop: 3 }}>running</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
              {utilisation.map(d => (
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
              <span>Sarees in progress</span>
              <span style={{ fontFamily: F.mono, fontWeight: 700, color: T.luxuryBrown }}>{perLoom.reduce((a, l) => a + l.wip, 0)}</span>
            </div>
          </div>
        </div>
      </FadeUp>

      {/* ── Row 2: output per loom + batch delivery risk ── */}
      <FadeUp delay={0.08}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 22, marginBottom: 22 }}>
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
                    <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>{g.t}</span>
                  </div>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={215}>
              <BarChart data={rankedLooms} layout="vertical" barSize={22} margin={{ left: 4, right: 54 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(110,15,45,0.06)" horizontal={false} />
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis type="category" dataKey="short" width={68} tick={{ fontFamily: F.ui, fontSize: 12, fill: T.luxuryBrown }} axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{ fill: "rgba(110,15,45,0.04)" }} contentStyle={tip}
                  formatter={(v: any, _n: any, p: any) => [`${v} completed · ${p.payload.passRate}% pass · ${p.payload.wip} in progress`, `${p.payload.loomNumber} — ${p.payload.operatorName}`]} />
                <Bar dataKey="produced" radius={[0, 6, 6, 0]}
                  label={{ position: "right", formatter: (v: any) => `${v}`, fontFamily: F.mono, fontSize: 11.5, fontWeight: 700, fill: T.luxuryBrown }}>
                  {rankedLooms.map(l => <Cell key={l.id} fill={l.produced === 0 ? "#E3D2AC" : laQcColor(l.passRate)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {/* Operator strip */}
            <div style={{ display: "flex", gap: 8, borderTop: `1px solid ${T.borderDef}`, paddingTop: 14, marginTop: 6 }}>
              {rankedLooms.slice(0, 4).map((l, i) => {
                const sc = STATUS_CFG[l.status];
                return (
                  <div key={l.id} style={{ flex: 1, minWidth: 0, background: i === 0 && l.produced > 0 ? "rgba(200,155,71,0.08)" : T.silkCream, border: `1px solid ${i === 0 && l.produced > 0 ? T.borderGold : T.borderDef}`, borderRadius: 12, padding: "10px 12px" }}>
                    <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.luxuryBrown, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>{l.short}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 }}>{l.operatorName}</div>
                    <div style={{ fontFamily: F.mono, fontSize: 10.5, color: sc.color, marginTop: 4, fontWeight: 700 }}>{sc.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Timer size={16} color={overdueCount ? T.crimson : T.royalBurgundy} />
              <div style={cardTitle}>Batch Delivery Risk</div>
            </div>
            <div style={cardSub}>Active batches by nearest due date</div>
            <div style={{ background: overdueCount ? "rgba(192,57,43,0.08)" : "rgba(30,102,64,0.09)", borderRadius: 14, padding: "14px 18px", margin: "16px 0" }}>
              <div style={{ fontFamily: F.mono, fontSize: 9.5, fontWeight: 700, letterSpacing: "1.1px", color: T.taupe, marginBottom: 6 }}>PAST DUE</div>
              <div style={{ fontFamily: F.display, fontSize: 28, fontWeight: 700, color: overdueCount ? T.crimson : T.green, lineHeight: 1 }}>{overdueCount}</div>
              <div style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe, marginTop: 6 }}>of {batchProgress.length} active batches</div>
            </div>
            {batchProgress.length === 0 ? (
              <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>No active batches on the floor.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {batchProgress.map(b => (
                  <div key={b.batchId}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontFamily: F.mono, fontSize: 11.5, fontWeight: 700, color: T.royalBurgundy }}>{b.batchId}</span>
                      <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: b.overdue ? T.crimson : b.daysLeft !== null && b.daysLeft <= 5 ? "#E67E22" : T.taupe }}>
                        {b.daysLeft === null ? b.dueDate : b.overdue ? `${Math.abs(b.daysLeft)}d overdue` : `${b.daysLeft}d left`}
                      </span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: T.silkCream, overflow: "hidden" }}>
                      <div style={{ width: `${b.pct}%`, height: "100%", borderRadius: 4, background: b.overdue ? "linear-gradient(90deg,#C0392B,#E74C3C)" : `linear-gradient(90deg,${T.deepWine},${T.royalBurgundy})` }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontFamily: F.ui, fontSize: 10.5, color: T.taupe, marginTop: 4 }}>
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

      {/* ── Row 3: material draw, floor comparison, factory health ── */}
      <FadeUp delay={0.12}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 22, paddingBottom: 8 }}>
          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Layers size={16} color={T.royalBurgundy} />
              <div style={cardTitle}>Material Consumption</div>
            </div>
            <div style={cardSub}>Issued to looms · units kept separate</div>
            {byMaterial.length === 0 ? (
              <div style={{ padding: "62px 0", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>No material issued in this period.</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={186}>
                  <BarChart data={byMaterial} barSize={26} margin={{ top: 16, left: -20, right: 6 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(110,15,45,0.06)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontFamily: F.ui, fontSize: 9.5, fill: T.taupe }} axisLine={false} tickLine={false} interval={0} />
                    <YAxis tick={{ fontFamily: F.ui, fontSize: 10.5, fill: T.taupe }} axisLine={false} tickLine={false} width={38} />
                    <RechartsTooltip cursor={{ fill: "rgba(110,15,45,0.04)" }} contentStyle={tip}
                      formatter={(v: any, _n: any, p: any) => [`${v} ${p.payload.unit}`, p.payload.type]} />
                    <Bar dataKey="qty" radius={[5, 5, 0, 0]}>
                      {byMaterial.map(d => <Cell key={d.label} fill={d.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ borderTop: `1px solid ${T.borderDef}`, marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between", fontFamily: F.ui, fontSize: 11.5, color: T.taupe }}>
                  <span>Warp drawn {warpKg.toFixed(1)} kg</span>
                  <span style={{ color: T.luxuryBrown, fontWeight: 700 }}>
                    {produced ? `${(warpKg / produced).toFixed(2)} kg/saree` : "—"}
                  </span>
                </div>
              </>
            )}
          </div>

          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Package size={16} color={T.royalBurgundy} />
              <div style={cardTitle}>Output by Design</div>
            </div>
            <div style={cardSub}>Top producing saree types</div>
            <ResponsiveContainer width="100%" height={186}>
              <BarChart data={byDesign} barSize={30} margin={{ top: 16, left: -20, right: 6 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(110,15,45,0.06)" vertical={false} />
                <XAxis dataKey="short" tick={{ fontFamily: F.ui, fontSize: 11, fill: T.taupe }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontFamily: F.ui, fontSize: 10.5, fill: T.taupe }} axisLine={false} tickLine={false} width={34} allowDecimals={false} />
                <RechartsTooltip cursor={{ fill: "rgba(110,15,45,0.04)" }} contentStyle={tip}
                  formatter={(v: any, _n: any, p: any) => [`${v} sarees`, p.payload.type]} />
                <Bar dataKey="produced" radius={[5, 5, 0, 0]}>
                  {byDesign.map(d => <Cell key={d.type} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ borderTop: `1px solid ${T.borderDef}`, marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between", fontFamily: F.ui, fontSize: 11.5, color: T.taupe }}>
              <span>{byDesign.length} designs</span>
              <span style={{ color: T.luxuryBrown, fontWeight: 600 }}>Top: {byDesign[0]?.type ?? "—"}</span>
            </div>
          </div>

          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Percent size={16} color={T.royalBurgundy} />
              <div style={cardTitle}>Factory Health</div>
            </div>
            <div style={cardSub}>Quality and capacity snapshot</div>
            <ResponsiveContainer width="100%" height={142}>
              <RadialBarChart innerRadius="62%" outerRadius="100%" startAngle={210} endAngle={-30}
                data={[{ name: "Pass", value: passRate, fill: laQcColor(passRate) }]}>
                <RadialBar dataKey="value" background={{ fill: T.silkCream }} cornerRadius={10} />
                <text x="50%" y="60%" textAnchor="middle" style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, fill: T.luxuryBrown }}>{passRate}%</text>
                <text x="50%" y="80%" textAnchor="middle" style={{ fontFamily: F.ui, fontSize: 10.5, fill: T.taupe }}>QC PASS RATE</text>
              </RadialBarChart>
            </ResponsiveContainer>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 }}>
              {[
                { label: "Rejected", value: `${failed} pcs` },
                { label: "Avg / Loom", value: `${activeLooms ? Math.round(produced / activeLooms) : 0} pcs` },
                { label: "Open Pipeline", value: `${pipeline} pcs` },
                { label: "Looms Down", value: String(looms.filter(l => l.status === "maintenance").length) },
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
    </div>
  );
}
