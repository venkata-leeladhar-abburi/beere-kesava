import React from "react";
import { semantic } from "../../../../design-system/tokens";
import { useQuery } from "@tanstack/react-query";
import {
  Building2, AlertTriangle, CheckCircle2,
  TrendingUp, Trophy, Timer, Percent, MapPin, BarChart3 as ChartBar,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Line, Legend,
  RadialBarChart, RadialBar,
} from "recharts";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";
import { T, F, MONTH_ABBR } from "./theme";
import { Vendor } from "./types";
import { FadeUp } from "./FadeUp";
import { SectionCard } from "./SharedBits";
import { purchaseOrdersApi } from "../../../../shared/api/purchase-orders";
import { ChartFigure } from "../../../../shared/ui/data";
import { rupees, formatMoney } from "@/lib/domain/money";

// Material type is not carried on the backend PurchaseOrder (see
// shared/api/purchase-orders.ts — line items live client-side only, no
// backend model), so per-material spend cannot be derived from real data.
// Every PO is bucketed under this single label until that model exists.
const UNSPECIFIED_MATERIAL = "Unspecified";
const MATERIAL_FILL: Record<string, string> = { Warp: T.royalBurgundy, Resham: T.antiqueGold, Jari: T.green, [UNSPECIFIED_MATERIAL]: T.taupe };

export function VendorAnalyticsSection({ vendors }: { vendors: Vendor[] }) {
  const [analyticsFilter, setAnalyticsFilter] = React.useState<DateFilterState>(DEFAULT_DATE_FILTER);

  // ---- Derived analytics -------------------------------------------------
  const num = (s: string) => parseFloat(s.replace(/,/g, "")) || 0;

  const { data: poRes, isLoading: posLoading, isError: posError } = useQuery({
    queryKey: ["all-vendor-pos"],
    queryFn: () => purchaseOrdersApi.list(),
  });

  // Real spend ledger built from actual purchase orders — vendor.totalSpend /
  // totalOrders are hardcoded to 0 on the backend today (no aggregate column
  // yet), so we derive everything here from the PO list instead.
  const ledger = React.useMemo(() => {
    const items = poRes?.items ?? [];
    return items.map(p => ({
      vendorId: p.vendorId || p.vendor?.id || "",
      date: p.createdAt ? p.createdAt.split("T")[0] : "",
      amount: Number(p.totalValue || 0),
      material: UNSPECIFIED_MATERIAL,
    }));
  }, [poRes]);
  const rows = React.useMemo(
    () => ledger.filter(r => matchesDateFilter(r.date, analyticsFilter)),
    [ledger, analyticsFilter]
  );

  const periodLabel = React.useMemo(() => {
    const f = analyticsFilter;
    if (f.mode === "day" && f.day) return new Date(f.day).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    if (f.mode === "range") return `${f.from || "start"} → ${f.to || "today"}`;
    if (f.mode === "month" && f.month) { const [y, m] = f.month.split("-"); return `${MONTH_ABBR[+m - 1]} ${y}`; }
    if (f.mode === "year" && f.year) return f.year;
    return "All time";
  }, [analyticsFilter]);

  const totalSpendRaw = React.useMemo(() => rows.reduce((a, r) => a + r.amount, 0), [rows]);
  const totalOrdersInPeriod = rows.length;

  const spendByMonth = React.useMemo(() => {
    const m = new Map<string, { spend: number; orders: number }>();
    rows.forEach(r => {
      const key = r.date.slice(0, 7);
      const e = m.get(key) || { spend: 0, orders: 0 };
      e.spend += r.amount; e.orders += 1;
      m.set(key, e);
    });
    const all = [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, v]) => ({ month: `${MONTH_ABBR[+key.slice(5) - 1]} ${key.slice(2, 4)}`, ...v }));
    // "All time" spans 18 months — keep the trend readable at 12.
    return all.length > 12 ? all.slice(-12) : all;
  }, [rows]);

  const trendDelta = React.useMemo(() => {
    if (spendByMonth.length < 2) return null;
    const last = spendByMonth[spendByMonth.length - 1].spend;
    const prev = spendByMonth[spendByMonth.length - 2].spend;
    if (!prev) return null;
    return Math.round(((last - prev) / prev) * 100);
  }, [spendByMonth]);

  const spendByType = React.useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach(r => m.set(r.material, (m.get(r.material) || 0) + r.amount));
    return [...m.entries()]
      .map(([name, value]) => ({ name, value, fill: MATERIAL_FILL[name] ?? T.taupe }))
      .filter(d => d.value > 0);
  }, [rows]);

  const topVendors = React.useMemo(() => {
    const m = new Map<string, { spend: number; orders: number }>();
    rows.forEach(r => {
      const e = m.get(r.vendorId) || { spend: 0, orders: 0 };
      e.spend += r.amount; e.orders += 1;
      m.set(r.vendorId, e);
    });
    return [...m.entries()]
      // A PO's vendorId can outlive the vendor row it points to (vendor
      // deleted, or the vendors list here is paginated/filtered) — skip
      // rather than crash the whole analytics page on a missing lookup.
      .flatMap(([id, agg]) => {
        const v = vendors.find(x => x.id === id);
        if (!v) return [];
        return [{
          id, name: v.name,
          short: v.name.length > 18 ? v.name.slice(0, 17) + "…" : v.name,
          initials: v.initials, status: v.status, ...agg,
        }];
      })
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 5);
  }, [rows, vendors]);

  // Share of wallet held by the top 5 — flags over-dependence on few suppliers.
  const top5Share = totalSpendRaw
    ? Math.round((topVendors.reduce((a, v) => a + v.spend, 0) / totalSpendRaw) * 100)
    : 0;

  const outstandingList = React.useMemo(
    () => vendors
      .filter(v => num(v.outstanding) > 0)
      .map(v => ({ ...v, out: num(v.outstanding) }))
      .sort((a, b) => b.out - a.out),
    [vendors]
  );
  const totalOutstanding = outstandingList.reduce((a, v) => a + v.out, 0);

  const spendByState = React.useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach(r => {
      const st = vendors.find(v => v.id === r.vendorId)?.state;
      if (st) m.set(st, (m.get(st) || 0) + r.amount);
    });
    return [...m.entries()]
      .map(([state, spend]) => ({ state, short: state.split(" ").map(w => w[0]).join(""), spend }))
      .sort((a, b) => b.spend - a.spend);
  }, [rows, vendors]);

  // Vendors that actually transacted in the selected period. On-time-delivery
  // % and quality-reject % are NOT computed here — see the gap comment above
  // the (now-removed) DELIVERY_PERF export in ./data.ts for why: PurchaseOrder
  // has no actual-received timestamp joinable to a GRN, and no backend model
  // tracks quality rejects at all.
  const activeVendors = React.useMemo(() => {
    const active = new Set(rows.map(r => r.vendorId));
    return vendors
      .filter(v => active.has(v.id))
      .map(v => {
        const own = rows.filter(r => r.vendorId === v.id);
        return { ...v, periodOrders: own.length, avgOrder: own.length ? own.reduce((a, r) => a + r.amount, 0) / own.length : 0 };
      })
      .sort((a, b) => b.rating - a.rating);
  }, [rows, vendors]);

  const avgOrderValue = totalOrdersInPeriod ? totalSpendRaw / totalOrdersInPeriod : 0;
  const avgRating = activeVendors.length
    ? activeVendors.reduce((a, v) => a + v.rating, 0) / activeVendors.length
    : 0;

  const L = (n: number) => formatMoney(rupees(n), { compact: true });
  const cardStyle: React.CSSProperties = {
    background: "#FFF", borderRadius: 20, border: `1.5px solid ${T.borderDef}`,
    padding: "24px 28px", boxShadow: "0 2px 12px rgba(74,6,27,0.05)",
  };
  const cardTitle: React.CSSProperties = {
    fontFamily: F.display, fontSize: 16, fontWeight: 600, color: T.luxuryBrown,
  };
  const tipStyle = {
    fontFamily: F.ui, fontSize: 12, borderRadius: 10,
    border: `1px solid ${T.borderDef}`, boxShadow: "0 8px 24px rgba(74,6,27,0.12)",
  };

  return (
    <div style={{ padding: "48px 56px 0" }}>
      <FadeUp>
      <SectionCard
        icon={ChartBar}
        title="Vendor Analytics"
        subtitle="Spend, top vendors, delivery reliability, and procurement health across your vendor base."
        actions={
          <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, letterSpacing: "1px", color: "#FFFDF9", background: "rgba(255,255,255,0.14)", padding: "6px 14px", borderRadius: 20, textTransform: "uppercase" as const }}>{periodLabel}</span>
        }
      >
        {/* Timeline scope — drives every chart in this section */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" as const, marginBottom: 10 }}>
          <DateFilterBar filter={analyticsFilter} onChange={setAnalyticsFilter} />
          <div style={{ display: "flex", gap: 20, marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, letterSpacing: "1px", color: T.taupe }}>SPEND IN PERIOD</div>
              <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.royalBurgundy }}>{L(totalSpendRaw)}</div>
            </div>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, letterSpacing: "1px", color: T.taupe }}>PURCHASE ORDERS</div>
              <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.luxuryBrown }}>{totalOrdersInPeriod}</div>
            </div>
          </div>
        </div>

        {posLoading && (
          <div style={{ ...cardStyle, textAlign: "center" as const, padding: "48px 24px" }}>
            <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Loading vendor purchase orders…</div>
          </div>
        )}

        {!posLoading && posError && (
          <div style={{ ...cardStyle, textAlign: "center" as const, padding: "48px 24px" }}>
            <AlertTriangle size={40} color={T.crimson} style={{ marginBottom: 12 }} />
            <div style={{ fontFamily: F.display, fontSize: 16, color: T.crimson }}>Failed to load vendor purchase orders.</div>
            <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: 6 }}>Please retry or check your connection.</div>
          </div>
        )}

        {!posLoading && !posError && rows.length === 0 && (
          <div style={{ ...cardStyle, textAlign: "center" as const, padding: "48px 24px" }}>
            <Building2 size={40} color={T.taupe} style={{ marginBottom: 12 }} />
            <div style={{ fontFamily: F.display, fontSize: 16, color: T.taupe }}>No vendor purchases recorded in this period.</div>
            <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: 6 }}>Widen the date range to see analytics.</div>
          </div>
        )}

        {!posLoading && !posError && rows.length > 0 && <>
        {/* Row 1 — spend trend + material mix */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr]" style={{ gap: 24 }}>
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={cardTitle}>Monthly Vendor Spend</div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 3 }}>Purchase value against order count</div>
              </div>
              {trendDelta !== null && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: trendDelta >= 0 ? T.greenBg : T.crimsonBg, padding: "4px 10px", borderRadius: 20 }}>
                  <TrendingUp size={13} color={trendDelta >= 0 ? T.greenMid : T.crimson} style={{ transform: trendDelta >= 0 ? "none" : "scaleY(-1)" }} />
                  <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: trendDelta >= 0 ? T.greenMid : T.crimson }}>{trendDelta >= 0 ? "+" : ""}{trendDelta}% vs prev month</span>
                </div>
              )}
            </div>
            <ChartFigure title="Monthly Vendor Spend" summary={`${L(totalSpendRaw)} total spend across ${totalOrdersInPeriod} purchase orders.`}>
              <ResponsiveContainer width="100%" height={210}>
                <ComposedChart data={spendByMonth} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(110,15,45,0.06)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontFamily: F.ui, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="l" hide />
                  <YAxis yAxisId="r" orientation="right" hide />
                  <RechartsTooltip contentStyle={tipStyle}
                    formatter={(v: any, n: any) => n === "Spend" ? [L(v), "Spend"] : [`${v} POs`, "Orders"]} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, paddingTop: 8 }} />
                  <Bar yAxisId="l" name="Spend" dataKey="spend" fill={T.royalBurgundy} radius={[6, 6, 0, 0]} />
                  <Line yAxisId="r" name="Orders" dataKey="orders" stroke={semantic.chart.series[1]} strokeWidth={2.5}
                    dot={{ r: 4, fill: T.antiqueGold, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartFigure>
          </div>
          <div style={cardStyle}>
            <div style={{ ...cardTitle, marginBottom: 20 }}>Spend by Material Type</div>
            <ChartFigure title="Spend by Material Type" summary={spendByType.map(s => `${s.name} ${L(s.value)}`).join(", ") + "."}>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={spendByType} dataKey="value" cx="50%" cy="50%" outerRadius={60} innerRadius={32}>
                    {spendByType.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <RechartsTooltip formatter={(v: any) => [L(v)]} contentStyle={tipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </ChartFigure>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {spendByType.map(s => (
                <div key={s.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: s.fill }} />
                    <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{s.name}</span>
                  </div>
                  <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.luxuryBrown }}>{L(s.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2 — top 5 vendors + outstanding exposure */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr]" style={{ gap: 24, marginTop: 24 }}>
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Trophy size={17} color={T.antiqueGold} />
                <div>
                  <div style={cardTitle}>Top 5 Vendors by Spend</div>
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 3 }}>Where the purchase budget actually goes</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, letterSpacing: "1px", color: T.taupe }}>TOP 5 SHARE</div>
                <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: top5Share > 80 ? T.crimson : T.royalBurgundy }}>{top5Share}%</div>
              </div>
            </div>
            <ChartFigure title="Top 5 Vendors by Spend" summary={`Top ${topVendors.length} vendors account for ${top5Share}% of ${L(totalSpendRaw)} spent.`}>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={topVendors} layout="vertical" barSize={20} margin={{ left: 8, right: 56 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(110,15,45,0.06)" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="short" width={132} tick={{ fontFamily: F.ui, fontSize: 12, fill: T.luxuryBrown }} axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{ fill: "rgba(110,15,45,0.04)" }} contentStyle={tipStyle}
                    formatter={(v: any, _n: any, p: any) => [`${L(v)} · ${p.payload.orders} orders`, p.payload.name]} />
                  <Bar dataKey="spend" radius={[0, 6, 6, 0]} label={{ position: "right", formatter: (v: any) => L(v), fontFamily: F.mono, fontSize: 12, fontWeight: 700, fill: T.luxuryBrown }}>
                    {topVendors.map((v, i) => (
                      <Cell key={v.id} fill={semantic.chart.series[i % semantic.chart.series.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartFigure>
            <div style={{ display: "flex", gap: 8, marginTop: 14, borderTop: `1px solid ${T.borderDef}`, paddingTop: 14 }}>
              {topVendors.map((v, i) => (
                <div key={v.id} style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, background: i === 0 ? `linear-gradient(135deg,${T.antiqueGold},${T.goldLight})` : T.silkCream, border: `1px solid ${T.borderGold}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.mono, fontSize: 12, fontWeight: 800, color: i === 0 ? T.darkBurgundy : T.taupe }}>{i + 1}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.luxuryBrown, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.initials}</div>
                    <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{totalSpendRaw ? Math.round((v.spend / totalSpendRaw) * 100) : 0}% share</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <AlertTriangle size={16} color={T.crimson} />
              <div style={cardTitle}>Outstanding Exposure</div>
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 18 }}>Unsettled dues by vendor · current balance, not period-scoped</div>
            <div style={{ background: totalOutstanding > 0 ? T.crimsonBg : T.greenBg, borderRadius: 14, padding: "16px 18px", marginBottom: 16 }}>
              <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, letterSpacing: "1.1px", color: T.taupe, marginBottom: 6 }}>TOTAL PAYABLE</div>
              <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: totalOutstanding > 0 ? T.crimson : T.green, lineHeight: 1 }}>{L(totalOutstanding)}</div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 6 }}>
                {outstandingList.length} of {vendors.length} vendors pending settlement
              </div>
            </div>
            {outstandingList.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontSize: 12, color: T.greenMid }}>
                <CheckCircle2 size={14} /> All vendor accounts are settled.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {outstandingList.slice(0, 4).map(v => (
                  <div key={v.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                      <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown }}>{v.name}</span>
                      <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.crimson }}>{formatMoney(rupees(v.out))}</span>
                    </div>
                    <div style={{ height: 7, borderRadius: 4, background: T.silkCream, overflow: "hidden" }}>
                      <div style={{ width: `${(v.out / (outstandingList[0].out || 1)) * 100}%`, height: "100%", borderRadius: 4, background: `linear-gradient(90deg,#C0392B,#E74C3C)` }} />
                    </div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 4 }}>Terms {v.terms} · last order {v.lastOrder}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Row 3 — reliability, regional concentration, efficiency KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 24, marginTop: 24 }}>
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <Timer size={16} color={T.royalBurgundy} />
              <div style={cardTitle}>Delivery Reliability</div>
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 14 }}>On-time GRN receipts, vendor by vendor</div>
            <div style={{ textAlign: "center" as const, padding: "24px 8px" }}>
              <Timer size={28} color={T.taupe} style={{ marginBottom: 10, opacity: 0.6 }} />
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, lineHeight: 1.5 }}>
                Not tracked yet. Purchase orders don't record an actual-received
                date joinable back to a GRN, so on-time delivery % can't be
                calculated from real data.
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <MapPin size={16} color={T.royalBurgundy} />
              <div style={cardTitle}>Sourcing by Region</div>
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 14 }}>Geographic supply concentration</div>
            <ChartFigure title="Sourcing by Region" summary={`${spendByState.length} states supplying; top state is ${spendByState[0]?.state ?? "—"}.`}>
              <ResponsiveContainer width="100%" height={168}>
                <BarChart data={spendByState} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(110,15,45,0.06)" vertical={false} />
                  <XAxis dataKey="short" tick={{ fontFamily: F.ui, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <RechartsTooltip cursor={{ fill: "rgba(110,15,45,0.04)" }} contentStyle={tipStyle}
                    formatter={(v: any, _n: any, p: any) => [L(v), p.payload.state]} />
                  <Bar dataKey="spend" fill={T.royalBurgundy} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartFigure>
            <div style={{ borderTop: `1px solid ${T.borderDef}`, marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between", fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
              <span>{spendByState.length} states supplying</span>
              <span style={{ color: T.luxuryBrown, fontWeight: 600 }}>Top: {spendByState[0]?.state ?? "—"}</span>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <Percent size={16} color={T.royalBurgundy} />
              <div style={cardTitle}>Procurement Health</div>
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 10 }}>Efficiency snapshot across all vendors</div>
            <ChartFigure title="Procurement Health" summary={`Average vendor rating ${avgRating.toFixed(1)} / 5 across ${activeVendors.length} active vendors.`}>
              <ResponsiveContainer width="100%" height={132}>
                <RadialBarChart innerRadius="62%" outerRadius="100%" startAngle={210} endAngle={-30}
                  data={[{ name: "Rating", value: (avgRating / 5) * 100, fill: avgRating >= 4 ? T.greenMid : avgRating >= 3 ? T.antiqueGold : T.crimson }]}>
                  <RadialBar dataKey="value" background={{ fill: T.silkCream }} cornerRadius={10} />
                  <text x="50%" y="62%" textAnchor="middle" style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, fill: T.luxuryBrown }}>{avgRating.toFixed(1)}</text>
                  <text x="50%" y="82%" textAnchor="middle" style={{ fontFamily: F.ui, fontSize: 12, fill: T.taupe }}>AVG VENDOR RATING</text>
                </RadialBarChart>
              </ResponsiveContainer>
            </ChartFigure>
            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 10, marginTop: 6 }}>
              {[
                { label: "Avg Order Value", value: L(avgOrderValue) },
                { label: "POs in Period", value: String(totalOrdersInPeriod) },
                { label: "Avg Rating", value: `${avgRating.toFixed(1)} / 5` },
                { label: "Active Vendors", value: String(activeVendors.length) },
              ].map(k => (
                <div key={k.label} style={{ background: T.silkCream, borderRadius: 10, padding: "10px 12px", border: `1px solid ${T.borderDef}` }}>
                  <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, letterSpacing: "0.5px", color: T.taupe, marginBottom: 4 }}>{k.label.toUpperCase()}</div>
                  <div style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>{k.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </>}
      </SectionCard>
      </FadeUp>
    </div>
  );
}
