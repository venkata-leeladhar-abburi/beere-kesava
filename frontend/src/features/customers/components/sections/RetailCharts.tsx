import { useMemo } from "react";
import { semantic } from "../../../../design-system/tokens";
import { useQuery } from "@tanstack/react-query";
import {
  Star, Calendar, AlertTriangle, Users, PieChart as PieIcon
} from "lucide-react";
import { T, F } from "../theme";
import { Button } from "../../../../shared/ui/primitives";
import { ChartFigure } from "../../../../shared/ui/data";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { customersApi } from "../../../../shared/api/customers";
import { salesApi } from "../../../../shared/api/sales";
import { rupees, formatMoney } from "@/lib/domain/money";
import { batchesApi } from "../../../../shared/api/batches";

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
function CardHeader({ icon: Icon, title, subtitle }: {
  icon: typeof Star;
  title: string;
  subtitle: string;
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

const barColor = (i: number) =>
  i === 0 ? T.royalBurgundy : i === 1 ? T.antiqueGold : i === 2 ? T.greenMid : "rgba(200,155,71,0.45)";

// ── Row 1: Top 10 Customers · Category Split · New vs Returning ─────────────
export function RetailChartsRow1() {
  const { data: customersRes } = useQuery({
    queryKey: ["retail-charts-customers"],
    queryFn: () => customersApi.list(),
  });
  const { data: salesRes } = useQuery({
    queryKey: ["retail-charts-sales"],
    queryFn: () => salesApi.list(),
  });
  const { data: batchesRes } = useQuery({
    queryKey: ["retail-charts-batches"],
    queryFn: () => batchesApi.list(),
  });
  const { data: returnsRes } = useQuery({
    queryKey: ["retail-charts-returns"],
    queryFn: () => salesApi.listReturns(200),
  });

  const returnedSareeIds = useMemo(
    () => new Set((returnsRes?.items ?? []).map(r => r.sareeId)),
    [returnsRes],
  );

  const retailSales = useMemo(() => {
    return (salesRes?.items ?? []).filter(s => s.channel === "RETAIL" && !returnedSareeIds.has(s.sareeId));
  }, [salesRes, returnedSareeIds]);

  const customerMap = useMemo(() => {
    return new Map((customersRes?.items ?? []).map(c => [c.id, c]));
  }, [customersRes]);

  // Top 10 retail customers by spend
  const top10RetailCustomers = useMemo(() => {
    const spends: Record<string, { customerId: string; name: string; spend: number }> = {};
    for (const sale of retailSales) {
      if (sale.customerId) {
        const cust = customerMap.get(sale.customerId);
        const name = cust?.name ?? "Walk-in Customer";
        if (!spends[sale.customerId]) spends[sale.customerId] = { customerId: sale.customerId, name, spend: 0 };
        spends[sale.customerId].spend += Number(sale.amount);
      }
    }
    return Object.values(spends).sort((a, b) => b.spend - a.spend).slice(0, 10);
  }, [retailSales, customerMap]);

  // Saree type mapping from batches
  const sareeInfoMap = useMemo(() => {
    const map = new Map<string, string>();
    if (batchesRes?.items) {
      for (const b of batchesRes.items) {
        for (const r of b.rows) {
          if (r.sareeId && r.sareeTypeCode) {
            map.set(r.sareeId, r.sareeTypeCode);
          }
        }
      }
    }
    return map;
  }, [batchesRes]);

  // Category split (Revenue by saree type)
  const retailCategorySplit = useMemo(() => {
    const split: Record<string, number> = {};
    const colors = [T.royalBurgundy, T.antiqueGold, T.greenMid, "#845E04", "#69635E"];

    for (const sale of retailSales) {
      const type = sareeInfoMap.get(sale.sareeId) ?? "Silk Saree";
      split[type] = (split[type] || 0) + Number(sale.amount);
    }

    const entries = Object.entries(split);
    if (entries.length === 0) return [];
    return entries.map(([name, value], i) => ({
      name,
      value,
      fill: colors[i % colors.length],
    }));
  }, [retailSales, sareeInfoMap]);

  const totalRetailRevenue = useMemo(() => {
    return retailSales.reduce((s, sale) => s + Number(sale.amount), 0);
  }, [retailSales]);

  // New vs Returning monthly chart
  const newVsReturningRetail = useMemo(() => {
    const monthsOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthMap: Record<string, { new: number; returning: number }> = {};

    const retailCustomers = (customersRes?.items ?? []).filter(c => c.type === "RETAIL");
    for (const c of retailCustomers) {
      const d = new Date(c.createdAt);
      if (!isNaN(d.getTime())) {
        const m = d.toLocaleString("en-US", { month: "short" });
        if (!monthMap[m]) monthMap[m] = { new: 0, returning: 0 };
        monthMap[m].new += 1;
      }
    }

    const activeMonths = monthsOrder.filter(m => monthMap[m] !== undefined);
    if (activeMonths.length === 0) return [];
    return activeMonths.map(m => ({ month: m, ...monthMap[m] }));
  }, [customersRes]);

  const maxSpend = top10RetailCustomers[0]?.spend || 1;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 20, marginBottom: 20, alignItems: "stretch" }}>
      {/* Chart 1: Top Retail Customers */}
      <div style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: CARD_RADIUS, padding: "22px 24px", display: "flex", flexDirection: "column", height: 380, boxShadow: CARD_SHADOW, position: "relative", overflow: "hidden" }}>
        <CardBloom />
        <CardHeader icon={Star} title="Top 10 Retail Customers" subtitle="By purchase value" />
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
          {top10RetailCustomers.length === 0 ? (
            <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, padding: "20px 0", textAlign: "center" as const }}>
              No retail sales recorded yet.
            </div>
          ) : (
            top10RetailCustomers.slice(0, 5).map((c, i) => {
              const pct = Math.round((c.spend / maxSpend) * 100);
              const isTop = i === 0;
              const rankBg = i === 0 ? T.royalBurgundy : i === 1 ? "rgba(200,155,71,0.18)" : i === 2 ? T.greenBg : "rgba(200,155,71,0.08)";
              const rankColor = i === 0 ? "#FFF" : i === 1 ? T.antiqueGold : i === 2 ? T.greenMid : T.taupe;
              return (
                <div key={c.customerId} style={{ display: "flex", alignItems: "center", gap: 8, padding: isTop ? "6px 8px" : "3px 4px", borderRadius: 8, background: isTop ? "rgba(110,15,45,0.04)" : "transparent", border: isTop ? `1px solid rgba(110,15,45,0.08)` : "1px solid transparent" }}>
                  <div style={{ width: 20, height: 20, minWidth: 20, borderRadius: "50%", background: rankBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: rankColor }}>{i + 1}</span>
                  </div>
                  <div style={{ width: 80, minWidth: 80, fontFamily: F.ui, fontSize: 12, fontWeight: i < 3 ? 600 : 500, color: i < 3 ? T.luxuryBrown : T.taupe, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c.name}
                  </div>
                  <SlimBar pct={pct} color={barColor(i)} />
                  <div style={{ width: 54, textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: i < 3 ? T.luxuryBrown : T.taupe }}>
                    {formatMoney(rupees(c.spend || 0))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chart 2: Category Split */}
      <div style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: CARD_RADIUS, padding: "22px 24px", display: "flex", flexDirection: "column", height: 380, boxShadow: CARD_SHADOW, position: "relative", overflow: "hidden" }}>
        <CardBloom />
        <CardHeader icon={PieIcon} title="Category Split" subtitle="Revenue by saree type" />
        {retailCategorySplit.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
            No retail sales recorded yet.
          </div>
        ) : (
          <>
            <ChartFigure
              title="Category Split"
              summary={`Total retail revenue ${formatMoney(rupees(totalRetailRevenue))} across ${retailCategorySplit.map(i => i.name).join(", ")}.`}
            >
            <div style={{ position: "relative", height: 200, flexShrink: 0 }}>
              <ResponsiveContainer key="rc-rt-2" width="100%" height="100%">
                <PieChart key="pie-chart-rt" id="retail-category-pie-chart">
                  <Pie key="rt-pie" id="rt-pie" data={retailCategorySplit} innerRadius={60} outerRadius={85} paddingAngle={5} cornerRadius={8} dataKey="value" nameKey="name" stroke="none">
                    {retailCategorySplit.map((entry) => (
                      <Cell key={`cell-pie-rt-${entry.name}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", pointerEvents: "none" }}>
                <span style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.luxuryBrown }}>{formatMoney(rupees(totalRetailRevenue))}</span>
                <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 2 }}>Total Retail</span>
              </div>
            </div>
            </ChartFigure>
            <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 14, flexWrap: "wrap" as const }}>
              {retailCategorySplit.map((item) => (
                <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: item.fill, flexShrink: 0 }} />
                  <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, fontWeight: 500 }}>{item.name}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Chart 3: New vs Returning */}
      <div style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: CARD_RADIUS, padding: "22px 24px", display: "flex", flexDirection: "column", height: 380, boxShadow: CARD_SHADOW, position: "relative", overflow: "hidden" }}>
        <CardBloom />
        <CardHeader icon={Users} title="New vs Returning" subtitle="Retail customers" />
        {newVsReturningRetail.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
            No retail customer records yet.
          </div>
        ) : (
          <ChartFigure title="New vs Returning" summary={`New and returning retail customers by month over ${newVsReturningRetail.length} months.`}>
          <div style={{ height: 200, flexShrink: 0 }}>
            <ResponsiveContainer key="rc-rt-3" width="100%" height="100%">
              <BarChart key="bar-chart-rt-new" id="retail-new-vs-returning-chart" data={newVsReturningRetail} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid key="grid-rt" strokeDasharray="3 3" vertical={false} stroke="rgba(200,155,71,0.15)" />
                <XAxis key="x-axis-rt-2" id="x-axis-rt-2" dataKey="month" axisLine={false} tickLine={false} tick={{ fontFamily: F.ui, fontSize: 12, fill: T.taupe }} dy={10} />
                <YAxis key="y-axis-rt-2" id="y-axis-rt-2" axisLine={false} tickLine={false} tick={{ fontFamily: F.ui, fontSize: 12, fill: T.taupe }} />
                <RechartsTooltip key="tooltip-rt-2" cursor={{fill: 'rgba(200,155,71,0.06)'}} contentStyle={{fontFamily: F.ui, fontSize: 13, borderRadius: 10, border: `1px solid rgba(200,155,71,0.25)`, boxShadow: CARD_SHADOW}} />
                <Legend key="legend-rt" iconType="circle" wrapperStyle={{ fontFamily: F.ui, fontSize: 12 }} />
                <Bar key="bar-rt-new" id="bar-rt-new" dataKey="new" name="New" fill={T.royalBurgundy} radius={[10, 10, 10, 10]} barSize={16} />
                <Bar key="bar-rt-returning" id="bar-rt-returning" dataKey="returning" name="Returning" fill={semantic.chart.series[1]} radius={[10, 10, 10, 10]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          </ChartFigure>
        )}
      </div>
    </div>
  );
}

// ── Row 2: Frequent Buyers · Inactive Customers ──────────────────────────────
export function RetailChartsRow2() {
  const { data: customersRes } = useQuery({
    queryKey: ["retail-charts-row2-cust"],
    queryFn: () => customersApi.list(),
  });
  const { data: salesRes } = useQuery({
    queryKey: ["retail-charts-row2-sales"],
    queryFn: () => salesApi.list(),
  });
  const { data: returnsRes } = useQuery({
    queryKey: ["retail-charts-row2-returns"],
    queryFn: () => salesApi.listReturns(200),
  });

  const returnedSareeIds = useMemo(
    () => new Set((returnsRes?.items ?? []).map(r => r.sareeId)),
    [returnsRes],
  );

  const retailSales = useMemo(() => {
    return (salesRes?.items ?? []).filter(s => s.channel === "RETAIL" && !returnedSareeIds.has(s.sareeId));
  }, [salesRes, returnedSareeIds]);

  const customerMap = useMemo(() => {
    return new Map((customersRes?.items ?? []).map(c => [c.id, c]));
  }, [customersRes]);

  // Frequent retail buyers
  const frequentRetailBuyers = useMemo(() => {
    const counts: Record<string, { customerId: string; name: string; count: number }> = {};
    for (const sale of retailSales) {
      if (sale.customerId) {
        const cust = customerMap.get(sale.customerId);
        const name = cust?.name ?? "Walk-in Customer";
        if (!counts[sale.customerId]) counts[sale.customerId] = { customerId: sale.customerId, name, count: 0 };
        counts[sale.customerId].count += 1;
      }
    }

    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [retailSales, customerMap]);

  // Inactive retail customers (no sale in > 6 months)
  const inactiveRetailAlerts = useMemo(() => {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - 180 * 86400000);
    const lastSaleByCust: Record<string, { customerId: string; name: string; time: string; date: Date }> = {};

    for (const sale of retailSales) {
      if (sale.customerId) {
        const cust = customerMap.get(sale.customerId);
        const name = cust?.name ?? "Customer";
        const d = new Date(sale.saleDate);
        if (!lastSaleByCust[sale.customerId] || d.getTime() > lastSaleByCust[sale.customerId].date.getTime()) {
          lastSaleByCust[sale.customerId] = {
            customerId: sale.customerId,
            name,
            time: d.toLocaleDateString("en-IN"),
            date: d,
          };
        }
      }
    }

    return Object.values(lastSaleByCust).filter(c => c.date.getTime() < sixMonthsAgo.getTime()).slice(0, 5);
  }, [retailSales, customerMap]);

  const maxCount = frequentRetailBuyers[0]?.count || 1;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 20, marginBottom: 32, alignItems: "stretch" }}>
      {/* Chart 4: Frequent Buyers */}
      <div style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: CARD_RADIUS, padding: "22px 24px", display: "flex", flexDirection: "column", boxShadow: CARD_SHADOW, position: "relative", overflow: "hidden" }}>
        <CardBloom />
        <CardHeader icon={Calendar} title="Frequent Retail Buyers" subtitle="By number of purchases" />
        <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
          {frequentRetailBuyers.length === 0 ? (
            <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, padding: "20px 0", textAlign: "center" as const }}>
              No retail sales recorded yet.
            </div>
          ) : (
            frequentRetailBuyers.map((fb, i) => (
              <div key={fb.customerId} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 26, height: 26, minWidth: 26, borderRadius: "50%",
                  background: i === 0 ? T.royalBurgundy : "rgba(200,155,71,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: i === 0 ? "#FFF" : T.antiqueGold }}>#{i+1}</span>
                </div>
                <div style={{ flex: "0 0 100px", fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>{fb.name}</div>
                <SlimBar pct={Math.round((fb.count / maxCount) * 100)} color={barColor(i)} height={6} />
                <div style={{ width: 100, textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>{fb.count} orders</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chart 5: Inactive Customers */}
      <div style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: CARD_RADIUS, padding: "22px 24px", display: "flex", flexDirection: "column", boxShadow: CARD_SHADOW, position: "relative", overflow: "hidden" }}>
        <CardBloom />
        <CardHeader icon={AlertTriangle} title="Inactive Retail Customers" subtitle="No purchase in 6 months" />
        <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
          {inactiveRetailAlerts.length === 0 ? (
            <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, padding: "20px 0", textAlign: "center" as const }}>
              No inactive retail customers detected.
            </div>
          ) : (
            inactiveRetailAlerts.map((al) => (
              <div key={al.customerId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "rgba(255,255,255,0.70)", border: `1px solid rgba(200,155,71,0.18)`, borderRadius: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(200,155,71,0.08)", border: `1px solid rgba(200,155,71,0.18)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: 14, color: T.royalBurgundy, fontWeight: 700 }}>
                    {al.name.replace("Smt. ", "").substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>{al.name}</span>
                    </div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Last purchase: {al.time}</div>
                  </div>
                </div>
                <Button variant="tertiary" size="sm">Reach Out</Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
