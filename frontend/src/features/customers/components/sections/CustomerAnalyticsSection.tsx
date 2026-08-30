import { useMemo, useState } from "react";
import { semantic } from "../../../../design-system/tokens";
import {
  Download, Star, IndianRupee, Users, Calendar, AlertTriangle, MapPin, BarChart3 as ChartBar,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { DateFilterBar, DateFilterState } from "../../../../shared/ui/DateFilterBar";
import { MobileFilterBar } from "../../../../shared/ui/filter/MobileFilterBar";
import { DownloadGate } from "../../../../shared/ui/DownloadAccess";
import { T, F } from "../theme";
import { SectionCard, SectionDownloadAction } from "../common/primitives";
import { Button, IconButton } from "../../../../shared/ui/primitives";
import { ChartFigure } from "../../../../shared/ui/data";
import { downloadDataAsCSV } from "../utils";
import { rupees, formatMoney } from "@/lib/domain/money";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "../../../../shared/api/analytics";
import { customersApi, BackendCustomer } from "../../../../shared/api/customers";
import { invoicesApi } from "../../../../shared/api/invoices";
import { salesApi } from "../../../../shared/api/sales";

const LOC_PALETTE = [T.royalBurgundy, T.antiqueGold, T.greenMid, "#845E04", "#69635E"];

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

function formatMonthLabel(month: string): string {
  const [year, m] = month.split("-").map(Number);
  if (!year || !m) return month;
  return new Date(year, m - 1, 1).toLocaleDateString("en-IN", { month: "short" });
}

interface CustRow {
  id: string;
  name: string;
  type: "Wholesale" | "Retail";
  city: string;
  purchases: number;
  spend: number;
  dates: string[];
}

export interface CustomerAnalyticsSectionProps {
  analyticsDateFilter: DateFilterState;
  setAnalyticsDateFilter: (f: DateFilterState) => void;
}

// ── Card header (icon tile + title + subtitle) ──────────────────────────────
function CardHeader({ icon: Icon, title, subtitle, iconBg, iconColor, downloadBtn }: {
  icon: typeof Star;
  title: string;
  subtitle: string;
  iconBg: string;
  iconColor: string;
  downloadBtn?: React.ReactNode;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", justifyContent: "space-between",
      margin: "-22px -24px 18px -24px", padding: "16px 20px",
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
      {downloadBtn && <div style={{ filter: "brightness(0) invert(1)", opacity: 0.7 }}>{downloadBtn}</div>}
    </div>
  );
}

// ── Slim progress bar ────────────────────────────────────────────────────────
function SlimBar({ pct, color, height = 5 }: { pct: number; color: string; height?: number }) {
  return (
    <div style={{ flex: 1, height, background: "rgba(110,15,45,0.06)", borderRadius: height / 2, overflow: "hidden" }}>
      <div style={{
        width: `${pct}%`, height: "100%", borderRadius: height / 2,
        background: color,
        transition: "width 0.6s cubic-bezier(0.22,1,0.36,1)",
      }} />
    </div>
  );
}

// ── SECTION 3: CUSTOMER ANALYTICS ───────────────────────────────────────────
export function CustomerAnalyticsSection({
  analyticsDateFilter, setAnalyticsDateFilter,
}: CustomerAnalyticsSectionProps) {
  const [search, setSearch] = useState("");

  const { data: revSplitRes, isLoading: revSplitLoading, isError: revSplitError } = useQuery({
    queryKey: ["analytics-revenue-split"],
    queryFn: () => analyticsApi.getRevenueSplit(),
  });
  const { data: customersRes, isLoading: customersLoading, isError: customersError } = useQuery({
    queryKey: ["customer-analytics-customers"],
    queryFn: () => customersApi.list(),
  });
  const { data: invoicesRes, isLoading: invoicesLoading, isError: invoicesError } = useQuery({
    queryKey: ["customer-analytics-invoices"],
    queryFn: () => invoicesApi.list(),
  });
  const { data: salesRes, isLoading: salesLoading, isError: salesError } = useQuery({
    queryKey: ["customer-analytics-sales"],
    queryFn: () => salesApi.list(),
  });
  // custRows (Top 10 Customers, Frequent Buyers, Inactive, Locations charts)
  // is a join of customers + invoices + sales — a failure in any of those
  // three real-backend queries makes the derived rows wrong/incomplete.
  const custDataLoading = customersLoading || invoicesLoading || salesLoading;
  const custDataError = customersError || invoicesError || salesError;
  const {
    data: newVsReturningRes,
    isLoading: newVsReturningLoading,
    isError: newVsReturningError,
  } = useQuery({
    queryKey: ["analytics-customers-new-vs-returning-monthly"],
    queryFn: () => analyticsApi.getCustomersNewVsReturningMonthly(6),
  });
  const newVsReturning = (newVsReturningRes?.items ?? []).map(d => ({
    month: formatMonthLabel(d.month),
    new: d.newCustomers,
    returning: d.returningCustomers,
  }));

  const liveRevSplit = [
    { name: "Retail Store", value: revSplitRes?.retail ?? 0, fill: T.greenMid },
    { name: "Wholesale Sales", value: revSplitRes?.wholesale ?? 0, fill: T.royalBurgundy },
  ];

  // Same aggregation approach as CustomerReport.tsx (reports feature): join
  // customers with invoices (wholesale) or sales (retail) to get per-customer
  // purchase count, total spend, and purchase dates.
  const custRows: CustRow[] = useMemo(() => {
    const customers = customersRes?.items ?? [];
    const invoices = invoicesRes?.items ?? [];
    const sales = (salesRes?.items ?? []).filter(s => s.channel === "RETAIL");

    return customers.map((c: BackendCustomer) => {
      if (c.type === "WHOLESALE") {
        const custInvoices = invoices.filter(i => i.customerId === c.id);
        const spend = custInvoices.reduce((s, i) => s + Number(i.paid), 0);
        return {
          id: c.id, name: c.name, type: "Wholesale" as const, city: c.city ?? "Unknown",
          purchases: custInvoices.length, spend,
          dates: custInvoices.map(i => i.invoiceDate).sort(),
        };
      }
      const custSales = sales.filter(s => s.customerId === c.id);
      const spend = custSales.reduce((s, sale) => s + Number(sale.amount), 0);
      return {
        id: c.id, name: c.name, type: "Retail" as const, city: c.city ?? "Unknown",
        purchases: custSales.length, spend,
        dates: custSales.map(s => s.saleDate).sort(),
      };
    }).filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.city.toLowerCase().includes(search.toLowerCase()));
  }, [customersRes, invoicesRes, salesRes, search]);

  // Top 10 customers by total spend.
  const top10Customers = useMemo(
    () => [...custRows].filter(c => c.spend > 0).sort((a, b) => b.spend - a.spend).slice(0, 10)
      .map(c => ({ id: c.id, name: c.name, spend: c.spend })),
    [custRows],
  );
  const topSpend = top10Customers[0]?.spend ?? 0;
  const combinedTop10 = top10Customers.reduce((s, c) => s + c.spend, 0);
  const avgTop10 = top10Customers.length > 0 ? Math.round(combinedTop10 / top10Customers.length) : 0;

  // Customers who buy most often — ranked by purchase count, with an
  // approximate cadence derived from the span between first and last
  // purchase (real dates, not a mock).
  const frequentBuyers = useMemo(() => {
    return [...custRows]
      .filter(c => c.purchases > 0)
      .sort((a, b) => b.purchases - a.purchases)
      .slice(0, 8)
      .map(c => {
        let freq = "Single purchase";
        if (c.purchases > 1) {
          const first = new Date(c.dates[0]).getTime();
          const last = new Date(c.dates[c.dates.length - 1]).getTime();
          const spanDays = Math.max(1, Math.round((last - first) / 86400000));
          const avgGap = Math.round(spanDays / (c.purchases - 1));
          freq = avgGap <= 1 ? "Daily" : `Every ~${avgGap} days`;
        }
        return { id: c.id, name: c.name, count: c.purchases, freq };
      });
  }, [custRows]);
  const maxFreqCount = frequentBuyers[0]?.count || 1;

  // Customers with no purchase in the last 6 months (but at least one
  // purchase on record — never-purchased customers aren't "inactive",
  // they're just new).
  const inactiveAlerts = useMemo(() => {
    const sixMonthsAgo = Date.now() - 1000 * 60 * 60 * 24 * 182;
    return custRows
      .filter(c => c.purchases > 0)
      .filter(c => new Date(c.dates[c.dates.length - 1]).getTime() < sixMonthsAgo)
      .map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        time: new Date(c.dates[c.dates.length - 1]).toLocaleDateString("en-IN"),
      }))
      .slice(0, 10);
  }, [custRows]);

  // Location distribution — grouped by city, since the Customer model has
  // no separate state field (see backend/prisma/schema.prisma model
  // Customer: only `city` exists).
  const locationData = useMemo(() => {
    const byCity = new Map<string, number>();
    for (const c of custRows) {
      byCity.set(c.city, (byCity.get(c.city) ?? 0) + 1);
    }
    const total = custRows.length;
    return Array.from(byCity.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([city, count], i) => ({
        state: city,
        count,
        pct: total > 0 ? Math.round((count / total) * 100) : 0,
        color: LOC_PALETTE[i % LOC_PALETTE.length],
        size: 14,
      }));
  }, [custRows]);
  const totalCustomers = custRows.length;
  const totalCities = new Set(custRows.map(c => c.city)).size;

  // ── Bar colour helper ────────────────────────────────────────────────────
  const barColor = (i: number) =>
    i === 0 ? T.royalBurgundy : i === 1 ? T.antiqueGold : i === 2 ? T.greenMid : "rgba(200,155,71,0.45)";

  return (
    <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 96 }}>
    <SectionCard
      icon={ChartBar}
      title="Customer Analytics"
      subtitle="Overview of customer behaviour — who spends the most, who buys most frequently, who has not bought recently, and where your customers are from."
      actions={<SectionDownloadAction label="Download Analytics Report" />}
    >
      {/* Mobile Flipkart-style Filter Bar */}
      <div className="md:hidden mb-4 bg-white p-3.5 rounded-2xl border border-[var(--border-default)] shadow-xs">
        <MobileFilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search customer analytics..."
          filterGroups={[
            {
              id: "time",
              label: "Time Period",
              value: analyticsDateFilter.mode,
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
                if (mode === "day") setAnalyticsDateFilter({ mode, day: new Date().toISOString().slice(0, 10), from: "", to: "", month: "", year: "" });
                else if (mode === "month") setAnalyticsDateFilter({ mode, day: "", from: "", to: "", month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`, year: "" });
                else if (mode === "year") setAnalyticsDateFilter({ mode, day: "", from: "", to: "", month: "", year: String(new Date().getFullYear()) });
                else setAnalyticsDateFilter({ mode, day: "", from: "", to: "", month: "", year: "" });
              },
            },
          ]}
          onResetAll={() => {
            setSearch("");
            setAnalyticsDateFilter({ mode: "all", day: "", from: "", to: "", month: "", year: "" });
          }}
        />
      </div>

      {/* Desktop Filter Bar */}
      <div className="hidden md:block mb-6">
        <DateFilterBar filter={analyticsDateFilter} onChange={setAnalyticsDateFilter} />
      </div>

      {/* Charts Row 1 — equal 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 20, marginBottom: 20, alignItems: "stretch" }}>

        {/* ── Card 1: Top 10 Customers by Purchase Value ──────────────── */}
        <div style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: CARD_RADIUS, padding: "22px 24px", display: "flex", flexDirection: "column", boxShadow: CARD_SHADOW, position: "relative", overflow: "hidden" }}>
          <CardBloom />
          <CardHeader
            icon={Star}
            title="Top 10 Customers by Purchase Value"
            subtitle="Wholesale and retail combined"
            iconBg="rgba(200,155,71,0.14)"
            iconColor={T.antiqueGold}
            downloadBtn={
              <DownloadGate><IconButton
                icon={Download}
                label="Download CSV"
                onClick={() => downloadDataAsCSV("top_10_customers.csv", ["Rank", "Customer Name", "Total Spend (INR)"], top10Customers.map((c, i) => [i + 1, c.name, c.spend]))}
                title="Download CSV"
                variant="ghost"
                shape="circle"
                size="sm"
                className="self-start"
              /></DownloadGate>
            }
          />

          {/* Summary strip */}
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            {[
              { label: "Top Spender", val: formatMoney(rupees(topSpend)), color: T.royalBurgundy },
              { label: "Combined Value", val: formatMoney(rupees(combinedTop10)), color: T.antiqueGold },
              { label: "Avg Spend", val: formatMoney(rupees(avgTop10)), color: T.greenMid },
            ].map((s) => (
              <div key={s.label} style={{ flex: 1, background: "rgba(255,255,255,0.70)", border: `1px solid rgba(200,155,71,0.18)`, borderRadius: 10, padding: "8px 10px" }}>
                <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, fontWeight: 500, letterSpacing: "0.3px", marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontFamily: F.display, fontSize: 13, fontWeight: 600, color: s.color }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Ranked bar rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
            {custDataLoading ? (
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, padding: "8px 0" }}>Loading top customers…</div>
            ) : custDataError ? (
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.crimson, fontWeight: 600, padding: "8px 0" }}>Failed to load top customers.</div>
            ) : top10Customers.length === 0 ? (
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, padding: "8px 0" }}>No customer purchases recorded yet.</div>
            ) : null}
            {!custDataLoading && !custDataError && top10Customers.map((c, i) => {
              const maxSpend = top10Customers[0]?.spend || 1;
              const pct = Math.round((c.spend / maxSpend) * 100);
              const isTop = i === 0;
              const rankBg = i === 0 ? T.royalBurgundy : i === 1 ? "rgba(200,155,71,0.18)" : i === 2 ? T.greenBg : "rgba(200,155,71,0.08)";
              const rankColor = i === 0 ? "#FFF" : i === 1 ? T.antiqueGold : i === 2 ? T.greenMid : T.taupe;
              return (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: isTop ? "6px 8px" : "3px 4px", borderRadius: 8, background: isTop ? "rgba(110,15,45,0.04)" : "transparent", border: isTop ? `1px solid rgba(110,15,45,0.08)` : "1px solid transparent" }}>
                  <div style={{ width: 20, height: 20, minWidth: 20, borderRadius: "50%", background: rankBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: rankColor }}>{i + 1}</span>
                  </div>
                  <div style={{ width: 80, minWidth: 80, fontFamily: F.ui, fontSize: 12, fontWeight: i < 3 ? 600 : 500, color: i < 3 ? T.luxuryBrown : T.taupe, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c.name}
                  </div>
                  <SlimBar pct={pct} color={barColor(i)} />
                  <div style={{ width: 42, textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: i < 3 ? T.luxuryBrown : T.taupe }}>
                    {c.spend >= 100000 ? `${(c.spend / 100000).toFixed(1)}L` : `${Math.round(c.spend / 1000)}K`}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 14, textAlign: "right" }}>
            <span style={{ fontFamily: F.ui, fontSize: 13, color: T.antiqueGold, fontWeight: 600, cursor: "pointer" }}>View Full List →</span>
          </div>
        </div>

        {/* ── Card 2: Revenue Split ───────────────────────────────────── */}
        <div style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: CARD_RADIUS, padding: "22px 24px", display: "flex", flexDirection: "column", boxShadow: CARD_SHADOW, position: "relative", overflow: "hidden" }}>
          <CardBloom />
          <CardHeader
            icon={IndianRupee}
            title="Wholesale vs Retail Revenue Split"
            subtitle="Revenue from each sales channel"
            iconBg="rgba(110,15,45,0.09)"
            iconColor={T.royalBurgundy}
            downloadBtn={
              <DownloadGate><IconButton
                icon={Download}
                label="Download CSV"
                onClick={() => downloadDataAsCSV("revenue_split.csv", ["Channel", "Revenue Value (INR)"], liveRevSplit.map(item => [item.name, item.value]))}
                title="Download CSV"
                variant="ghost"
                shape="circle"
                size="sm"
                className="self-start"
              /></DownloadGate>
            }
          />
          {revSplitLoading ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 240 }}>
              <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Loading revenue split…</span>
            </div>
          ) : revSplitError ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 240 }}>
              <span style={{ fontFamily: F.ui, fontSize: 13, color: T.crimson, fontWeight: 600 }}>Failed to load revenue split.</span>
            </div>
          ) : (
          <>
          <ChartFigure
            title="Wholesale vs Retail Revenue Split"
            summary={`Total revenue ${formatMoney(rupees(revSplitRes?.total ?? 0), { compact: true })} across ${liveRevSplit.map(i => `${i.name} ${formatMoney(rupees(i.value), { compact: true })}`).join(", ")}.`}
          >
          <div style={{ flex: 1, position: "relative", minHeight: 240 }}>
            <ResponsiveContainer key="rc-2" width="100%" height="100%">
              <PieChart key="pie-chart" id="revenue-pie-chart">
                <Pie key="revenue-pie" id="revenue-pie" data={liveRevSplit} innerRadius={72} outerRadius={105} paddingAngle={5} cornerRadius={8} dataKey="value" nameKey="name" stroke="none">
                  {liveRevSplit.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
              <span style={{ fontFamily: F.display, fontSize: 28, fontWeight: 700, color: T.luxuryBrown }}>{formatMoney(rupees(revSplitRes?.total ?? 0), { compact: true })}</span>
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>Total Revenue</span>
            </div>
          </div>
          </ChartFigure>
          <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 16 }}>
            {liveRevSplit.map((item) => (
              <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: item.fill }} />
                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, fontWeight: 500 }}>{item.name}: {formatMoney(rupees(item.value), { compact: true })}</span>
              </div>
            ))}
          </div>
          </>
          )}
        </div>

        {/* ── Card 3: New vs Returning ────────────────────────────────── */}
        <div style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: CARD_RADIUS, padding: "22px 24px", display: "flex", flexDirection: "column", boxShadow: CARD_SHADOW, position: "relative", overflow: "hidden" }}>
          <CardBloom />
          <CardHeader
            icon={Users}
            title="New vs Returning Customers"
            subtitle="Last 6 months trend"
            iconBg="rgba(30,102,64,0.10)"
            iconColor={T.greenMid}
            downloadBtn={
              <DownloadGate><IconButton
                icon={Download}
                label="Download CSV"
                onClick={() => downloadDataAsCSV("new_vs_returning.csv", ["Month", "New Customers", "Returning Customers"], newVsReturning.map(item => [item.month, item.new, item.returning]))}
                title="Download CSV"
                variant="ghost"
                shape="circle"
                size="sm"
                className="self-start"
              /></DownloadGate>
            }
          />
          <div style={{ flex: 1, minHeight: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {newVsReturningLoading ? (
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Loading customer trend…</div>
            ) : newVsReturningError ? (
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.crimson }}>Failed to load customer trend.</div>
            ) : newVsReturning.length === 0 ? (
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>No customer data yet.</div>
            ) : (
            <ChartFigure
              title="New vs Returning Customers"
              summary={`New and returning customers by month over the last ${newVsReturning.length} months.`}
              className="w-full h-full"
            >
            <ResponsiveContainer key="rc-3" width="100%" height="100%">
              <BarChart key="bar-chart-new" id="new-vs-returning-chart" data={newVsReturning} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid key="grid" strokeDasharray="3 3" vertical={false} stroke="rgba(200,155,71,0.15)" />
                <XAxis key="x-axis-2" id="x-axis-2" dataKey="month" axisLine={false} tickLine={false} tick={{ fontFamily: F.ui, fontSize: 12, fill: T.taupe }} dy={10} />
                <YAxis key="y-axis-2" id="y-axis-2" axisLine={false} tickLine={false} tick={{ fontFamily: F.ui, fontSize: 12, fill: T.taupe }} />
                <RechartsTooltip key="tooltip-2" cursor={{fill: 'rgba(200,155,71,0.06)'}} contentStyle={{fontFamily: F.ui, fontSize: 13, borderRadius: 10, border: `1px solid rgba(200,155,71,0.25)`, boxShadow: CARD_SHADOW}} />
                <Legend key="legend" iconType="circle" wrapperStyle={{ fontFamily: F.ui, fontSize: 12 }} />
                <Bar key="bar-new" id="bar-new" dataKey="new" name="New" fill={T.royalBurgundy} radius={[10, 10, 10, 10]} barSize={16} />
                <Bar key="bar-returning" id="bar-returning" dataKey="returning" name="Returning" fill={semantic.chart.series[1]} radius={[10, 10, 10, 10]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
            </ChartFigure>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 2 — equal 2 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 20, marginBottom: 20, alignItems: "stretch" }}>

        {/* ── Card 4: Frequent Buyers ─────────────────────────────────── */}
        <div style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: CARD_RADIUS, padding: "22px 24px", display: "flex", flexDirection: "column", boxShadow: CARD_SHADOW, position: "relative", overflow: "hidden" }}>
          <CardBloom />
          <CardHeader
            icon={Calendar}
            title="Customers Who Buy Most Often"
            subtitle="By number of purchases — all time"
            iconBg="rgba(200,155,71,0.14)"
            iconColor={T.antiqueGold}
            downloadBtn={
              <DownloadGate><IconButton
                icon={Download}
                label="Download CSV"
                onClick={() => downloadDataAsCSV("frequent_buyers.csv", ["Rank", "Customer Name", "Orders Count", "Frequency"], frequentBuyers.map((fb, i) => [i + 1, fb.name, fb.count, fb.freq]))}
                title="Download CSV"
                variant="ghost"
                shape="circle"
                size="sm"
                className="self-start"
              /></DownloadGate>
            }
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
            {custDataLoading ? (
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Loading frequent buyers…</div>
            ) : custDataError ? (
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.crimson, fontWeight: 600 }}>Failed to load frequent buyers.</div>
            ) : frequentBuyers.length === 0 ? (
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>No customer purchases recorded yet.</div>
            ) : null}
            {!custDataLoading && !custDataError && frequentBuyers.map((fb, i) => (
              <div key={fb.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 26, height: 26, minWidth: 26, borderRadius: "50%",
                  background: i === 0 ? T.royalBurgundy : "rgba(200,155,71,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: i === 0 ? "#FFF" : T.antiqueGold }}>#{i+1}</span>
                </div>
                <div style={{ flex: "0 0 100px", fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>{fb.name}</div>
                <SlimBar pct={Math.round((fb.count / maxFreqCount) * 100)} color={barColor(i)} height={6} />
                <div style={{ width: 110, textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>{fb.count} orders</div>
                  <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 1 }}>{fb.freq}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Card 5: Inactive Customers ──────────────────────────────── */}
        <div style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: CARD_RADIUS, padding: "22px 24px", display: "flex", flexDirection: "column", boxShadow: CARD_SHADOW, position: "relative", overflow: "hidden" }}>
          <CardBloom />
          <CardHeader
            icon={AlertTriangle}
            title="Customers Who Have Not Bought Recently"
            subtitle="No purchase in 6 months — consider reaching out"
            iconBg="rgba(192,57,43,0.08)"
            iconColor={T.crimson}
            downloadBtn={
              <DownloadGate><IconButton
                icon={Download}
                label="Download CSV"
                onClick={() => downloadDataAsCSV("inactive_customers.csv", ["Customer Name", "Type", "Last Purchase Date"], inactiveAlerts.map(al => [al.name, al.type, al.time]))}
                title="Download CSV"
                variant="ghost"
                shape="circle"
                size="sm"
                className="self-start"
              /></DownloadGate>
            }
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
            {custDataLoading ? (
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Loading inactive customers…</div>
            ) : custDataError ? (
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.crimson, fontWeight: 600 }}>Failed to load inactive customers.</div>
            ) : inactiveAlerts.length === 0 ? (
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>No inactive customers — everyone has purchased recently.</div>
            ) : null}
            {!custDataLoading && !custDataError && inactiveAlerts.map((al) => (
              <div key={al.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "rgba(255,255,255,0.70)", border: `1px solid rgba(200,155,71,0.18)`, borderRadius: 12, }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(200,155,71,0.08)", border: `1px solid rgba(200,155,71,0.18)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: 14, color: T.royalBurgundy, fontWeight: 700 }}>
                    {al.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>{al.name}</span>
                      <span style={{ padding: "2px 8px", background: al.type === "Wholesale" ? T.crimsonBg : T.greenBg, color: al.type === "Wholesale" ? T.crimson : T.greenMid, fontSize: 11, borderRadius: 5, fontWeight: 600, fontFamily: F.ui }}>{al.type}</span>
                    </div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Last purchase: {al.time}</div>
                  </div>
                </div>
                <Button variant="tertiary" size="sm">Reach Out</Button>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "right", marginTop: 14 }}>
            <span style={{ fontFamily: F.ui, fontSize: 13, color: T.antiqueGold, fontWeight: 600, cursor: "pointer" }}>Mark as Inactive →</span>
          </div>
        </div>
      </div>

      {/* ── Card 6: Customer Locations — City-wise Distribution ────────── */}
      <div className="flex flex-col xl:flex-row gap-6 xl:gap-10" style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW, padding: "22px 24px", position: "relative", overflow: "hidden" }}>
        <CardBloom />
        <div style={{ flex: 1, minWidth: 0 }}>
          <CardHeader
            icon={MapPin}
            title="Customer Locations — City-wise Distribution"
            subtitle="Which cities your wholesale and retail customers are from"
            iconBg="rgba(30,102,64,0.10)"
            iconColor={T.greenMid}
            downloadBtn={
              <DownloadGate><IconButton
                icon={Download}
                label="Download CSV"
                onClick={() => downloadDataAsCSV("customer_locations.csv", ["City", "Customers Count", "Percentage Share"], locationData.map(l => [l.state, l.count, `${l.pct}%`]))}
                title="Download CSV"
                variant="ghost"
                shape="circle"
                size="sm"
                className="self-start"
              /></DownloadGate>
            }
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {custDataLoading ? (
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Loading customer locations…</div>
            ) : custDataError ? (
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.crimson, fontWeight: 600 }}>Failed to load customer locations.</div>
            ) : locationData.length === 0 ? (
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>No customers on record yet.</div>
            ) : null}
            {!custDataLoading && !custDataError && locationData.map((loc) => (
              <div key={loc.state} className="flex items-center gap-2.5 sm:gap-4 w-full">
                <div style={{ width: 20, display: "flex", justifyContent: "center", flexShrink: 0 }}>
                  <div style={{ width: loc.size, height: loc.size, borderRadius: "50%", background: loc.color }} />
                </div>
                <div style={{ flex: "0 0 auto", minWidth: 80 }}>
                  <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{loc.state}</div>
                  <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 1 }}>{loc.count} customers</div>
                </div>
                <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, textAlign: "right", flexShrink: 0, width: 50 }}>{loc.pct}%</div>
                <SlimBar pct={loc.pct} color={loc.color} height={6} />
              </div>
            ))}
          </div>

          <DownloadGate>
            <Button
              variant="tertiary"
              iconLeft={Download}
              className="mt-8"
              onClick={() => downloadDataAsCSV(
                "customer_list_with_locations.csv",
                ["Customer Name", "Type", "City", "Total Spend"],
                custRows.map(c => [c.name, c.type, c.city, c.spend]),
              )}
            >
              Download Customer List with Locations
            </Button>
          </DownloadGate>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.60)", borderRadius: 14, border: `1px solid rgba(200,155,71,0.18)`, padding: "24px 20px", minHeight: 300 }}>
          <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, marginBottom: 3 }}>City-wise Share</div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 18 }}>{totalCustomers} customers across {totalCities} cities</div>
          <ChartFigure
            title="Customer Locations — City-wise Distribution"
            summary={`${totalCustomers} customers across ${totalCities} cities: ${locationData.map(l => `${l.state} ${l.count}`).join(", ")}.`}
            className="w-full h-full"
          >
          <div style={{ position: "relative", width: 200, height: 200, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={locationData.map((l) => ({ name: l.state, value: l.count, fill: l.color }))}
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  cornerRadius={8}
                  dataKey="value"
                  nameKey="name"
                  stroke="none"
                >
                  {locationData.map((l) => <Cell key={l.state} fill={l.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <span style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: T.luxuryBrown }}>{totalCities}</span>
              <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 1 }}>Cities</span>
            </div>
          </div>
          </ChartFigure>
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "8px 16px", marginTop: 18, justifyContent: "center" }}>
            {locationData.map((s) => (
              <div key={s.state} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, fontWeight: 500 }}>{s.state}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: T.taupe, fontWeight: 600 }}>{s.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
    </div>
  );
}
