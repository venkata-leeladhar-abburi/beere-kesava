import { useMemo } from "react";
import { semantic } from "../../../../design-system/tokens";
import {
  Download, Star, IndianRupee, Users, Calendar, AlertTriangle, MapPin, BarChart3 as ChartBar,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { DateFilterBar, DateFilterState } from "../../../../shared/ui/DateFilterBar";
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

// ── SECTION 3: CUSTOMER ANALYTICS ───────────────────────────────────────────
export function CustomerAnalyticsSection({ analyticsDateFilter, setAnalyticsDateFilter }: CustomerAnalyticsSectionProps) {
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
    });
  }, [customersRes, invoicesRes, salesRes]);

  // Top 10 customers by total spend.
  const top10Customers = useMemo(
    () => [...custRows].filter(c => c.spend > 0).sort((a, b) => b.spend - a.spend).slice(0, 10)
      .map(c => ({ name: c.name, spend: c.spend })),
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
        return { name: c.name, count: c.purchases, freq };
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

  return (
    <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 96 }}>
    <SectionCard
      icon={ChartBar}
      title="Customer Analytics"
      subtitle="Overview of customer behaviour — who spends the most, who buys most frequently, who has not bought recently, and where your customers are from."
      actions={<SectionDownloadAction label="Download Analytics Report" />}
    >
      <div style={{ marginBottom: 32 }}>
        <DateFilterBar filter={analyticsDateFilter} onChange={setAnalyticsDateFilter} />
      </div>

      {/* Charts Row 1 — equal 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 22, marginBottom: 22, alignItems: "stretch" }}>

        {/* Chart 1: Top Customers */}
        <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 18, padding: "28px", display: "flex", flexDirection: "column", boxShadow: "0 2px 14px rgba(74,6,27,0.05)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ width: 52, height: 52, minWidth: 52, borderRadius: 14, background: "rgba(200,155,71,0.10)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(200,155,71,0.12)" }}>
                <Star size={24} color={T.antiqueGold} />
              </div>
              <div>
                <h3 style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, margin: "0 0 4px 0", lineHeight: 1.3 }}>Top 10 Customers by Purchase Value</h3>
                <p style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, margin: 0 }}>Wholesale and retail combined</p>
              </div>
            </div>
            <DownloadGate><IconButton
              icon={Download}
              label="Download CSV"
              onClick={() => downloadDataAsCSV("top_10_customers.csv", ["Rank", "Customer Name", "Total Spend (₹)"], top10Customers.map((c, i) => [i + 1, c.name, c.spend]))}
              title="Download CSV"
              variant="ghost"
              shape="circle"
              size="sm"
              className="self-start"
            /></DownloadGate>
          </div>
          {/* Summary strip */}
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            {[
              { label: "Top Spender", val: formatMoney(rupees(topSpend)), color: T.royalBurgundy },
              { label: "Combined Value", val: formatMoney(rupees(combinedTop10)), color: T.antiqueGold },
              { label: "Avg Spend", val: formatMoney(rupees(avgTop10)), color: T.greenMid },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, background: "#FFF", border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 500, letterSpacing: "0.4px", marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: s.color }}>{s.val}</div>
              </div>
            ))}
          </div>
          {/* Custom ranked bar rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
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
              const barBg = i === 0 ? `linear-gradient(90deg, ${T.royalBurgundy}, #A01535)` : i === 1 ? `linear-gradient(90deg, ${T.antiqueGold}, #E7C983)` : i === 2 ? `linear-gradient(90deg, ${T.greenMid}, #3BA86A)` : `linear-gradient(90deg, rgba(200,155,71,0.40), rgba(200,155,71,0.20))`;
              const rankBg = i === 0 ? T.royalBurgundy : i === 1 ? "rgba(200,155,71,0.22)" : i === 2 ? T.greenBg : T.silkCream;
              const rankColor = i === 0 ? "#FFF" : i === 1 ? T.antiqueGold : i === 2 ? T.greenMid : T.taupe;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: isTop ? "8px 10px" : "4px 6px", borderRadius: 8, background: isTop ? "rgba(110,15,45,0.04)" : "transparent", border: isTop ? `1px solid rgba(110,15,45,0.08)` : "1px solid transparent" }}>
                  <div style={{ width: 22, height: 22, minWidth: 22, borderRadius: "50%", background: rankBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: rankColor }}>{i + 1}</span>
                  </div>
                  <div style={{ width: 96, minWidth: 96, fontFamily: F.ui, fontSize: 12, fontWeight: i < 3 ? 700 : 500, color: i < 3 ? T.luxuryBrown : T.taupe, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c.name}
                  </div>
                  <div style={{ flex: 1, height: 7, background: T.silkCream, borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", backgroundImage: barBg, borderRadius: 4 }} />
                  </div>
                  <div style={{ width: 44, textAlign: "right", fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: i < 3 ? T.luxuryBrown : T.taupe }}>
                    {c.spend >= 100000 ? `${(c.spend / 100000).toFixed(1)}L` : `${Math.round(c.spend / 1000)}K`}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 14, textAlign: "right" }}>
            <span style={{ fontFamily: F.ui, fontSize: 14, color: T.antiqueGold, fontWeight: 600, cursor: "pointer" }}>View Full List →</span>
          </div>
        </div>

        {/* Chart 2: Revenue Split */}
        <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 18, padding: "28px", display: "flex", flexDirection: "column", boxShadow: "0 2px 14px rgba(74,6,27,0.05)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ width: 52, height: 52, minWidth: 52, borderRadius: 14, background: "rgba(110,15,45,0.07)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(110,15,45,0.08)" }}>
                <IndianRupee size={24} color={T.royalBurgundy} />
              </div>
              <div>
                <h3 style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, margin: "0 0 4px 0", lineHeight: 1.3 }}>Wholesale vs Retail Revenue Split</h3>
                <p style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, margin: 0 }}>Revenue from each sales channel</p>
              </div>
            </div>
            <DownloadGate><IconButton
              icon={Download}
              label="Download CSV"
              onClick={() => downloadDataAsCSV("revenue_split.csv", ["Channel", "Revenue Value (₹)"], liveRevSplit.map(item => [item.name, item.value]))}
              title="Download CSV"
              variant="ghost"
              shape="circle"
              size="sm"
              className="self-start"
            /></DownloadGate>
          </div>
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
                <Pie key="revenue-pie" id="revenue-pie" data={liveRevSplit} innerRadius={75} outerRadius={108} paddingAngle={3} dataKey="value" nameKey="name" stroke="none">
                  {liveRevSplit.map((entry, index) => (
                    <Cell key={`cell-pie-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
              <span style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: T.luxuryBrown }}>{formatMoney(rupees(revSplitRes?.total ?? 0), { compact: true })}</span>
              <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: 2 }}>Total Revenue</span>
            </div>
          </div>
          </ChartFigure>
          <div style={{ display: "flex", justifyContent: "center", gap: 28, marginTop: 18 }}>
            {liveRevSplit.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: item.fill }} />
                <span style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, fontWeight: 500 }}>{item.name}: {formatMoney(rupees(item.value), { compact: true })}</span>
              </div>
            ))}
          </div>
          </>
          )}
        </div>

        {/* Chart 3: New vs Returning */}
        <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 18, padding: "28px", display: "flex", flexDirection: "column", boxShadow: "0 2px 14px rgba(74,6,27,0.05)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ width: 52, height: 52, minWidth: 52, borderRadius: 14, background: "rgba(30,102,64,0.08)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(30,102,64,0.10)" }}>
                <Users size={24} color={T.greenMid} />
              </div>
              <div>
                <h3 style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, margin: "0 0 4px 0", lineHeight: 1.3 }}>New vs Returning Customers</h3>
                <p style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, margin: 0 }}>Last 6 months trend</p>
              </div>
            </div>
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
          </div>
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
                <CartesianGrid key="grid" strokeDasharray="3 3" vertical={false} stroke={T.borderDef} />
                <XAxis key="x-axis-2" id="x-axis-2" dataKey="month" axisLine={false} tickLine={false} tick={{ fontFamily: F.ui, fontSize: 13, fill: T.taupe }} dy={10} />
                <YAxis key="y-axis-2" id="y-axis-2" axisLine={false} tickLine={false} tick={{ fontFamily: F.ui, fontSize: 13, fill: T.taupe }} />
                <RechartsTooltip key="tooltip-2" cursor={{fill: 'rgba(110,15,45,0.04)'}} contentStyle={{fontFamily: F.ui, fontSize: 13, borderRadius: 8, border: `1px solid ${T.borderDef}`}} />
                <Legend key="legend" iconType="circle" wrapperStyle={{ fontFamily: F.ui, fontSize: 13 }} />
                <Bar key="bar-new" id="bar-new" dataKey="new" name="New" fill={T.royalBurgundy} radius={[5, 5, 0, 0]} barSize={14} />
                <Bar key="bar-returning" id="bar-returning" dataKey="returning" name="Returning" fill={semantic.chart.series[1]} radius={[5, 5, 0, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
            </ChartFigure>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 2 — equal 2 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 22, marginBottom: 22, alignItems: "stretch" }}>

        {/* Chart 4: Frequent Buyers */}
        <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 18, padding: "28px", display: "flex", flexDirection: "column", boxShadow: "0 2px 14px rgba(74,6,27,0.05)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ width: 52, height: 52, minWidth: 52, borderRadius: 14, background: "rgba(200,155,71,0.10)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(200,155,71,0.12)" }}>
                <Calendar size={24} color={T.antiqueGold} />
              </div>
              <div>
                <h3 style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, margin: "0 0 4px 0", lineHeight: 1.3 }}>Customers Who Buy Most Often</h3>
                <p style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, margin: 0 }}>By number of purchases — all time</p>
              </div>
            </div>
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
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, flex: 1 }}>
            {custDataLoading ? (
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Loading frequent buyers…</div>
            ) : custDataError ? (
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.crimson, fontWeight: 600 }}>Failed to load frequent buyers.</div>
            ) : frequentBuyers.length === 0 ? (
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>No customer purchases recorded yet.</div>
            ) : null}
            {!custDataLoading && !custDataError && frequentBuyers.map((fb, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 30, height: 30, minWidth: 30, borderRadius: "50%", background: i === 0 ? T.royalBurgundy : "rgba(200,155,71,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: i === 0 ? "#FFF" : T.antiqueGold }}>#{i+1}</span>
                </div>
                <div style={{ flex: 1, fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>{fb.name}</div>
                <div style={{ flex: 2 }}>
                  <div style={{ height: 10, background: "rgba(200,155,71,0.13)", borderRadius: 5 }}>
                    <div style={{ width: `${Math.round((fb.count/maxFreqCount)*100)}%`, height: "100%", background: i === 0 ? T.royalBurgundy : T.antiqueGold, borderRadius: 5 }} />
                  </div>
                </div>
                <div style={{ width: 120, textAlign: "right" }}>
                  <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{fb.count} orders</div>
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>{fb.freq}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 5: Inactive Customers */}
        <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 18, padding: "28px", display: "flex", flexDirection: "column", boxShadow: "0 2px 14px rgba(74,6,27,0.05)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ width: 52, height: 52, minWidth: 52, borderRadius: 14, background: "rgba(192,57,43,0.08)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(192,57,43,0.10)" }}>
                <AlertTriangle size={24} color={T.crimson} />
              </div>
              <div>
                <h3 style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, margin: "0 0 4px 0", lineHeight: 1.3 }}>Customers Who Have Not Bought Recently</h3>
                <p style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, margin: 0 }}>No purchase in 6 months — consider reaching out</p>
              </div>
            </div>
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
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
            {custDataLoading ? (
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Loading inactive customers…</div>
            ) : custDataError ? (
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.crimson, fontWeight: 600 }}>Failed to load inactive customers.</div>
            ) : inactiveAlerts.length === 0 ? (
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>No inactive customers — everyone has purchased recently.</div>
            ) : null}
            {!custDataLoading && !custDataError && inactiveAlerts.map((al, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "#FFF", border: `1px solid ${T.borderDef}`, borderRadius: 10, boxShadow: "0 1px 4px rgba(74,6,27,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: T.silkCream, border: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: 16, color: T.royalBurgundy, fontWeight: 700 }}>
                    {al.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{al.name}</span>
                      <span style={{ padding: "2px 8px", background: al.type === "Wholesale" ? T.crimsonBg : T.greenBg, color: al.type === "Wholesale" ? T.crimson : T.greenMid, fontSize: 12, borderRadius: 5, fontWeight: 600, fontFamily: F.ui }}>{al.type}</span>
                    </div>
                    <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Last purchase: {al.time}</div>
                  </div>
                </div>
                <Button variant="tertiary" size="sm">Reach Out</Button>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "right", marginTop: 16 }}>
            <span style={{ fontFamily: F.ui, fontSize: 14, color: T.antiqueGold, fontWeight: 600, cursor: "pointer" }}>Mark as Inactive →</span>
          </div>
        </div>
      </div>

      {/* Charts Row 3 — Geographic (grouped by city — the Customer model has
          no separate state field, see backend/prisma/schema.prisma) */}
      <div className="flex-col xl:flex-row" style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 18, padding: "28px 36px", display: "flex", gap: 48, boxShadow: "0 2px 14px rgba(74,6,27,0.05)" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 26 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ width: 52, height: 52, minWidth: 52, borderRadius: 14, background: "rgba(45,145,88,0.09)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(30,102,64,0.10)" }}>
                <MapPin size={24} color={T.greenMid} />
              </div>
              <div>
                <h3 style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, margin: "0 0 4px 0", lineHeight: 1.3 }}>Customer Locations — City-wise Distribution</h3>
                <p style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, margin: 0 }}>Which cities your wholesale and retail customers are from</p>
              </div>
            </div>
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
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {custDataLoading ? (
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Loading customer locations…</div>
            ) : custDataError ? (
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.crimson, fontWeight: 600 }}>Failed to load customer locations.</div>
            ) : locationData.length === 0 ? (
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>No customers on record yet.</div>
            ) : null}
            {!custDataLoading && !custDataError && locationData.map((loc, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <div style={{ width: 28, display: "flex", justifyContent: "center" }}>
                  <div style={{ width: loc.size, height: loc.size, borderRadius: "50%", background: loc.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{loc.state}</div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: 2 }}>{loc.count} customers</div>
                </div>
                <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: T.luxuryBrown, minWidth: 52, textAlign: "right" }}>{loc.pct}%</div>
                <div style={{ width: "clamp(60px, 22vw, 130px)", flexShrink: 0, height: 8, background: T.silkCream, borderRadius: 4 }}>
                  <div style={{ width: `${loc.pct}%`, height: "100%", background: loc.color, borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>

          <DownloadGate>
            <Button variant="tertiary" iconLeft={Download} className="mt-8">
              Download Customer List with Locations
            </Button>
          </DownloadGate>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#FFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, padding: "28px 24px", minHeight: 300 }}>
          <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown, marginBottom: 4 }}>City-wise Share</div>
          <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginBottom: 20 }}>{totalCustomers} customers across {totalCities} cities</div>
          <ChartFigure
            title="Customer Locations — City-wise Distribution"
            summary={`${totalCustomers} customers across ${totalCities} cities: ${locationData.map(l => `${l.state} ${l.count}`).join(", ")}.`}
            className="w-full h-full"
          >
          <div style={{ position: "relative", width: 200, height: 200, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={locationData.map(l => ({ name: l.state, value: l.count, fill: l.color }))}
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  stroke="none"
                >
                  {locationData.map((l, i) => <Cell key={`loc-cell-${i}`} fill={l.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <span style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: T.luxuryBrown }}>{totalCities}</span>
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 1 }}>Cities</span>
            </div>
          </div>
          </ChartFigure>
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "10px 18px", marginTop: 22, justifyContent: "center" }}>
            {locationData.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, fontWeight: 500 }}>{s.state}</span>
                <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, fontWeight: 600 }}>{s.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
    </div>
  );
}
