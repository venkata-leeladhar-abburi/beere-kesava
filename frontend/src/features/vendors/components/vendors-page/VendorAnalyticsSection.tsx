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
import { MobileFilterBar } from "../../../../shared/ui/filter/MobileFilterBar";
import { T, F, MONTH_ABBR } from "./theme";
import { Vendor } from "./types";
import { FadeUp } from "./FadeUp";
import { SectionCard } from "./SharedBits";
import { purchaseOrdersApi } from "../../../../shared/api/purchase-orders";
import { ChartFigure } from "../../../../shared/ui/data";
import { rupees, formatMoney } from "@/lib/domain/money";
import { toPaise, fromPaise } from "@/lib/gst";

// ── Shared card style tokens ────────────────────────────────────────────────
const CARD_BG = "#FFFFFF";
const CARD_BORDER = `1.5px solid ${T.royalBurgundy}`;
const CARD_SHADOW = "0 1px 2px rgba(74,6,27,0.03), 0 6px 18px rgba(74,6,27,0.05)";
const CARD_RADIUS = 16;

/** Subtle warm bloom in the top-right of each card. */
function CardBloom() {
  return (
    <span aria-hidden style={{
      position: "absolute", top: -70, right: -70, width: 200, height: 200, borderRadius: "50%",
      background: "radial-gradient(circle, rgba(110,15,45,0.05) 0%, rgba(110,15,45,0) 70%)",
      pointerEvents: "none",
    }} />
  );
}

// ── Card header (dark burgundy gradient header band) ─────────────────────────
function CardHeader({ icon: Icon, title, subtitle, rightElement }: {
  icon: typeof Trophy;
  title: string;
  subtitle: string;
  rightElement?: React.ReactNode;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", justifyContent: "space-between",
      margin: "-24px -28px 18px -28px", padding: "16px 20px",
      background: `linear-gradient(100deg, ${T.deepWine} 0%, ${T.royalBurgundy} 100%)`,
      borderRadius: "14px 14px 0 0",
    }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{
          width: 36, height: 36, minWidth: 36, borderRadius: 10, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(255,255,255,0.12)",
        }}>
          <Icon size={18} color="#FFFDF9" />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 15, color: "#FFFDF9", letterSpacing: "-0.1px", lineHeight: 1.25 }}>
            {title}
          </div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,253,249,0.65)", marginTop: 3, lineHeight: 1.4 }}>
            {subtitle}
          </div>
        </div>
      </div>
      {rightElement}
    </div>
  );
}

const UNSPECIFIED_MATERIAL = "Unspecified";
const MATERIAL_FILL: Record<string, string> = { Warp: T.royalBurgundy, Resham: T.antiqueGold, Jari: T.green, [UNSPECIFIED_MATERIAL]: T.taupe };

export function VendorAnalyticsSection({ vendors }: { vendors: Vendor[] }) {
  const [analyticsFilter, setAnalyticsFilter] = React.useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [search, setSearch] = React.useState("");

  // ---- Derived analytics -------------------------------------------------
  const numPaise = (s: string) => toPaise(Number(s.replace(/,/g, "")) || 0);

  const { data: poRes, isLoading: posLoading, isError: posError } = useQuery({
    queryKey: ["all-vendor-pos"],
    queryFn: () => purchaseOrdersApi.list(),
  });

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
    () => ledger.filter(r => matchesDateFilter(r.date, analyticsFilter) && (!search || vendors.find(v => v.id === r.vendorId)?.name.toLowerCase().includes(search.toLowerCase()))),
    [ledger, analyticsFilter, search, vendors]
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

  const top5Share = totalSpendRaw
    ? Math.round((topVendors.reduce((a, v) => a + v.spend, 0) / totalSpendRaw) * 100)
    : 0;

  const outstandingList = React.useMemo(
    () => vendors
      .filter(v => numPaise(v.outstanding) > 0)
      .map(v => ({ ...v, out: fromPaise(numPaise(v.outstanding)) }))
      .sort((a, b) => b.out - a.out),
    [vendors]
  );
  const totalOutstanding = fromPaise(outstandingList.reduce((a, v) => a + toPaise(v.out), 0));

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
    background: CARD_BG, borderRadius: CARD_RADIUS, border: CARD_BORDER,
    padding: "24px 28px", boxShadow: CARD_SHADOW, position: "relative", overflow: "hidden",
    display: "flex", flexDirection: "column",
  };
  const tipStyle = {
    fontFamily: F.ui, fontSize: 12, borderRadius: 10,
    border: `1px solid rgba(200,155,71,0.25)`, boxShadow: CARD_SHADOW,
  };

  return (
    <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 48 }}>
      <FadeUp>
      <SectionCard
        icon={ChartBar}
        title="Vendor Analytics"
        subtitle="Spend, top vendors, delivery reliability, and procurement health across your vendor base."
        actions={
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, letterSpacing: "1px", color: "#FFFDF9", background: "rgba(255,255,255,0.14)", padding: "6px 14px", borderRadius: 20, textTransform: "uppercase" as const }}>{periodLabel}</span>
        }
      >
        {/* Mobile Flipkart-style Filter Bar */}
        <div className="md:hidden mb-4 bg-white p-3.5 rounded-2xl border border-[var(--border-default)] shadow-xs">
          <MobileFilterBar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search vendor analytics..."
            filterGroups={[
              {
                id: "time",
                label: "Time Period",
                value: analyticsFilter.mode,
                defaultValue: "all",
                options: [
                  { value: "all", label: "All Time" },
                  { value: "day", label: "Specific Date" },
                  { value: "range", label: "Date Range" },
                  { value: "month", label: "Monthly" },
                  { value: "year", label: "Yearly" },
                ],
                onChange: (m: string) => {
                  const mode = m as DateFilterState["mode"];
                  if (mode === "day") setAnalyticsFilter({ mode, day: new Date().toISOString().slice(0, 10), from: "", to: "", month: "", year: "" });
                  else if (mode === "month") setAnalyticsFilter({ mode, day: "", from: "", to: "", month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`, year: "" });
                  else if (mode === "year") setAnalyticsFilter({ mode, day: "", from: "", to: "", month: "", year: String(new Date().getFullYear()) });
                  else setAnalyticsFilter({ mode, day: "", from: "", to: "", month: "", year: "" });
                },
              },
            ]}
            onResetAll={() => {
              setSearch("");
              setAnalyticsFilter(DEFAULT_DATE_FILTER);
            }}
          />
        </div>

        {/* Desktop Filter Bar */}
        <div className="hidden md:flex items-center justify-between gap-4 mb-4 flex-wrap">
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
          <div style={{ ...cardStyle, alignItems: "center", justifyContent: "center", textAlign: "center", padding: "48px 24px" }}>
            <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Loading vendor purchase orders…</div>
          </div>
        )}

        {!posLoading && posError && (
          <div style={{ ...cardStyle, alignItems: "center", justifyContent: "center", textAlign: "center", padding: "48px 24px" }}>
            <AlertTriangle size={40} color={T.crimson} style={{ marginBottom: 12 }} />
            <div style={{ fontFamily: F.display, fontSize: 16, color: T.crimson }}>Failed to load vendor purchase orders.</div>
            <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: 6 }}>Please retry or check your connection.</div>
          </div>
        )}

        {!posLoading && !posError && rows.length === 0 && (
          <div style={{ ...cardStyle, alignItems: "center", justifyContent: "center", textAlign: "center", padding: "48px 24px" }}>
            <Building2 size={40} color={T.taupe} style={{ marginBottom: 12 }} />
            <div style={{ fontFamily: F.display, fontSize: 16, color: T.taupe }}>No vendor purchases recorded in this period.</div>
            <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: 6 }}>Widen the date range to see analytics.</div>
          </div>
        )}

        {!posLoading && !posError && rows.length > 0 && <>
        {/* Row 1 — spend trend + material mix */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr]" style={{ gap: 20 }}>
          <div style={cardStyle}>
            <CardBloom />
            <CardHeader
              icon={TrendingUp}
              title="Monthly Vendor Spend"
              subtitle="Purchase value against order count"
              rightElement={
                trendDelta !== null ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.15)", padding: "4px 10px", borderRadius: 20 }}>
                    <TrendingUp size={13} color="#FFFDF9" style={{ transform: trendDelta >= 0 ? "none" : "scaleY(-1)" }} />
                    <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: "#FFFDF9" }}>{trendDelta >= 0 ? "+" : ""}{trendDelta}% vs prev</span>
                  </div>
                ) : undefined
              }
            />
            <ChartFigure title="Monthly Vendor Spend" summary={`${L(totalSpendRaw)} total spend across ${totalOrdersInPeriod} purchase orders.`}>
              <ResponsiveContainer width="100%" height={210}>
                <ComposedChart data={spendByMonth} barSize={26}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(200,155,71,0.15)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontFamily: F.ui, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="l" hide />
                  <YAxis yAxisId="r" orientation="right" hide />
                  <RechartsTooltip contentStyle={tipStyle}
                    formatter={(v: number | string, n: React.ReactNode) => n === "Spend" ? [L(Number(v)), "Spend"] : [`${v} POs`, "Orders"]} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, paddingTop: 8 }} />
                  <Bar yAxisId="l" name="Spend" dataKey="spend" fill={T.royalBurgundy} radius={[10, 10, 10, 10]} />
                  <Line yAxisId="r" name="Orders" dataKey="orders" stroke={semantic.chart.series[1]} strokeWidth={2.5}
                    dot={{ r: 4, fill: T.antiqueGold, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartFigure>
          </div>
          <div style={cardStyle}>
            <CardBloom />
            <CardHeader icon={ChartBar} title="Spend by Material Type" subtitle="Distribution across materials" />
            <ChartFigure title="Spend by Material Type" summary={spendByType.map(s => `${s.name} ${L(s.value)}`).join(", ") + "."}>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={spendByType} dataKey="value" cx="50%" cy="50%" outerRadius={65} innerRadius={35} paddingAngle={5} cornerRadius={8} stroke="none">
                    {spendByType.map((e) => <Cell key={e.name} fill={e.fill} />)}
                  </Pie>
                  <RechartsTooltip formatter={(v: number | string) => [L(Number(v))]} contentStyle={tipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </ChartFigure>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {spendByType.map(s => (
                <div key={s.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 9, height: 9, borderRadius: "50%", background: s.fill }} />
                    <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{s.name}</span>
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: T.luxuryBrown }}>{L(s.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2 — top 5 vendors + outstanding exposure */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr]" style={{ gap: 20, marginTop: 20 }}>
          <div style={cardStyle}>
            <CardBloom />
            <CardHeader
              icon={Trophy}
              title="Top 5 Vendors by Spend"
              subtitle="Where the purchase budget actually goes"
              rightElement={
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "1px", color: "rgba(255,253,249,0.70)" }}>TOP 5 SHARE</div>
                  <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: "#FFFDF9" }}>{top5Share}%</div>
                </div>
              }
            />
            <ChartFigure title="Top 5 Vendors by Spend" summary={`Top ${topVendors.length} vendors account for ${top5Share}% of ${L(totalSpendRaw)} spent.`}>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={topVendors} layout="vertical" barSize={18} margin={{ left: 8, right: 56 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(200,155,71,0.15)" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="short" width={132} tick={{ fontFamily: F.ui, fontSize: 12, fill: T.luxuryBrown }} axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{ fill: "rgba(200,155,71,0.06)" }} contentStyle={tipStyle}
                    formatter={(v: number | string, _n: React.ReactNode, p: { payload: { orders: number; name: string } }) => [`${L(Number(v))} · ${p.payload.orders} orders`, p.payload.name]} />
                  <Bar dataKey="spend" radius={[10, 10, 10, 10]} label={{ position: "right", formatter: (v: number | string) => L(Number(v)), fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, fill: T.luxuryBrown }}>
                    {topVendors.map((v, i) => (
                      <Cell key={v.id} fill={i === 0 ? T.royalBurgundy : i === 1 ? T.antiqueGold : i === 2 ? T.greenMid : "rgba(200,155,71,0.45)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartFigure>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-[rgba(200,155,71,0.18)] pt-3.5 mt-3.5">
              {topVendors.map((v, i) => (
                <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, background: i === 0 ? T.royalBurgundy : "rgba(200,155,71,0.14)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: i === 0 ? "#FFF" : T.antiqueGold }}>#{i + 1}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.luxuryBrown, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.initials}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: T.taupe }}>{totalSpendRaw ? Math.round((v.spend / totalSpendRaw) * 100) : 0}% share</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={cardStyle}>
            <CardBloom />
            <CardHeader icon={AlertTriangle} title="Outstanding Exposure" subtitle="Unsettled dues by vendor" />
            <div style={{ background: totalOutstanding > 0 ? "rgba(192,57,43,0.06)" : T.greenBg, border: `1px solid ${totalOutstanding > 0 ? "rgba(192,57,43,0.15)" : "rgba(30,102,64,0.15)"}`, borderRadius: 14, padding: "14px 16px", marginBottom: 16 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "1.1px", color: T.taupe, marginBottom: 4 }}>TOTAL PAYABLE</div>
              <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 700, color: totalOutstanding > 0 ? T.crimson : T.green, lineHeight: 1 }}>{L(totalOutstanding)}</div>
              <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 4 }}>
                {outstandingList.length} of {vendors.length} vendors pending settlement
              </div>
            </div>
            {outstandingList.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontSize: 12, color: T.greenMid }}>
                <CheckCircle2 size={14} /> All vendor accounts are settled.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {outstandingList.slice(0, 4).map(v => (
                  <div key={v.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown }}>{v.name}</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: T.crimson }}>{formatMoney(rupees(v.out))}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: "rgba(110,15,45,0.06)", overflow: "hidden" }}>
                      <div style={{ width: `${(v.out / (outstandingList[0].out || 1)) * 100}%`, height: "100%", borderRadius: 3, background: `linear-gradient(90deg, ${T.royalBurgundy}, #C0392B)` }} />
                    </div>
                    <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 3 }}>Terms {v.terms} · last order {v.lastOrder}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Row 3 — reliability, regional concentration, efficiency KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 20, marginTop: 20 }}>
          <div style={cardStyle}>
            <CardBloom />
            <CardHeader icon={Timer} title="Delivery Reliability" subtitle="On-time GRN receipts by vendor" />
            <div style={{ textAlign: "center" as const, padding: "24px 8px" }}>
              <Timer size={28} color={T.taupe} style={{ marginBottom: 10, opacity: 0.6 }} />
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, lineHeight: 1.5 }}>
                Not tracked yet. Purchase orders don't record an actual-received
                date joinable back to a GRN.
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <CardBloom />
            <CardHeader icon={MapPin} title="Sourcing by Region" subtitle="Geographic supply concentration" />
            <ChartFigure title="Sourcing by Region" summary={`${spendByState.length} states supplying; top state is ${spendByState[0]?.state ?? "—"}.`}>
              <ResponsiveContainer width="100%" height={168}>
                <BarChart data={spendByState} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(200,155,71,0.15)" vertical={false} />
                  <XAxis dataKey="short" tick={{ fontFamily: F.ui, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <RechartsTooltip cursor={{ fill: "rgba(200,155,71,0.06)" }} contentStyle={tipStyle}
                    formatter={(v: number | string, _n: React.ReactNode, p: { payload: { state: string } }) => [L(Number(v)), p.payload.state]} />
                  <Bar dataKey="spend" fill={T.royalBurgundy} radius={[10, 10, 10, 10]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartFigure>
            <div style={{ borderTop: `1px solid rgba(200,155,71,0.18)`, marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between", fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
              <span>{spendByState.length} states supplying</span>
              <span style={{ color: T.luxuryBrown, fontWeight: 600 }}>Top: {spendByState[0]?.state ?? "—"}</span>
            </div>
          </div>

          <div style={cardStyle}>
            <CardBloom />
            <CardHeader icon={Percent} title="Procurement Health" subtitle="Efficiency snapshot across all vendors" />
            <ChartFigure title="Procurement Health" summary={`Average vendor rating ${avgRating.toFixed(1)} / 5 across ${activeVendors.length} active vendors.`}>
              <ResponsiveContainer width="100%" height={175}>
                <RadialBarChart innerRadius="68%" outerRadius="100%" startAngle={210} endAngle={-30}
                  data={[{ name: "Rating", value: (avgRating / 5) * 100, fill: T.royalBurgundy }]}>
                  <RadialBar dataKey="value" background={{ fill: "rgba(110,15,45,0.06)" }} cornerRadius={14} />
                  <text x="50%" y="58%" textAnchor="middle" style={{ fontFamily: F.display, fontSize: 32, fontWeight: 700, fill: T.royalBurgundy }}>{avgRating.toFixed(1)}</text>
                  <text x="50%" y="78%" textAnchor="middle" style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 600, fill: T.taupe, letterSpacing: "1px" }}>AVG VENDOR RATING</text>
                </RadialBarChart>
              </ResponsiveContainer>
            </ChartFigure>
            <div className="grid grid-cols-2 gap-3" style={{ marginTop: 12 }}>
              {[
                { label: "Avg Order Value", value: L(avgOrderValue) },
                { label: "POs in Period", value: String(totalOrdersInPeriod) },
                { label: "Avg Rating", value: `${avgRating.toFixed(1)} / 5` },
                { label: "Active Vendors", value: String(activeVendors.length) },
              ].map(k => (
                <div key={k.label} style={{ background: "rgba(255,255,255,0.80)", borderRadius: 12, padding: "10px 12px", border: `1px solid rgba(200,155,71,0.18)` }}>
                  <div style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 600, letterSpacing: "0.5px", color: T.taupe, marginBottom: 4 }}>{k.label.toUpperCase()}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>{k.value}</div>
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
