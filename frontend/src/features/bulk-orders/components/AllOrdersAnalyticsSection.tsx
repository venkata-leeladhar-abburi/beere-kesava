import React, { useMemo } from "react";
import { semantic } from "../../../design-system/tokens";
import {
  ShoppingBag, TrendingUp, Trophy, Timer, Percent, IndianRupee, Layers,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Line, Legend,
  RadialBarChart, RadialBar,
} from "recharts";
import { BulkOrder } from "../../production/components/ProductionPage";
import { DateFilterState } from "../../../shared/ui/DateFilterBar";
import { resolveOrderMoney, computeBulkOrderProducedSareeIds } from "../utils/BulkOrderLinking";
import { useBulkOrders } from "../contexts/BulkOrderContext";
import { useFinishing } from "../../finishing/contexts/FinishingContext";
import { INVOICES } from "../../payments/data/invoices";
import { ChartFigure } from "../../../shared/ui/data";
import { rupees, formatMoney } from "@/lib/domain/money";

const T = {
  silkCream: "#F7F2EA",
  royalBurgundy: "#6E0F2D",
  deepWine: "#4A061B",
  luxuryBrown: "#3B2314",
  taupe: "#69635E",
  borderDef: "rgba(110,15,45,0.10)",
  antiqueGold: "#C89B47",
  green: "#1E6640",
  crimson: "#C0392B",
};
const F = { display: "'Plus Jakarta Sans', sans-serif", ui: "'Inter', sans-serif", mono: "'JetBrains Mono', monospace" };

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const STATUS_META: Record<string, { label: string; color: string }> = {
  "on-track": { label: "On Track", color: T.green },
  "at-risk":  { label: "At Risk",  color: T.antiqueGold },
  "overdue":  { label: "Overdue",  color: T.crimson },
};
const TYPE_FILLS = [T.royalBurgundy, T.antiqueGold, T.green, "#5A3E6B", "#2D6B6B", "#8A2440"];
const PAY_META: Record<string, { label: string; color: string; bg: string }> = {
  paid:    { label: "Paid",    color: T.green,       bg: "rgba(30,102,64,0.10)" },
  partial: { label: "Partial", color: "#8B6018",     bg: "rgba(200,155,71,0.14)" },
  pending: { label: "Pending", color: T.crimson,     bg: "rgba(192,57,43,0.09)" },
};

interface AllOrdersAnalyticsSectionProps {
  filteredOrders: BulkOrder[];
  dateFilter: DateFilterState;
}

export function AllOrdersAnalyticsSection({ filteredOrders, dateFilter }: AllOrdersAnalyticsSectionProps) {
  const { bulkOrders } = useBulkOrders();
  const { readySarees, returns, quotations } = useFinishing();
  // o.done is a manually-set DB column nothing keeps in sync with actual
  // production — derive the real per-order produced count the same way the
  // order detail page's Sarees tab (and BulkOrderCard) do, so every view of
  // "sarees done" agrees.
  const producedByRef = useMemo(() => {
    const m = new Map<string, number>();
    filteredOrders.forEach(o => {
      m.set(o.ref, computeBulkOrderProducedSareeIds(o.ref, bulkOrders, readySarees, returns, quotations).size);
    });
    return m;
  }, [filteredOrders, bulkOrders, readySarees, returns, quotations]);
  const producedOf = (o: BulkOrder) => producedByRef.get(o.ref) ?? 0;

  const periodLabel = useMemo(() => {
    if (dateFilter.mode === "day" && dateFilter.day) return new Date(dateFilter.day).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    if (dateFilter.mode === "range") return `${dateFilter.from || "start"} → ${dateFilter.to || "today"}`;
    if (dateFilter.mode === "month" && dateFilter.month) { const [y, m] = dateFilter.month.split("-"); return `${MONTH_ABBR[+m - 1]} ${y}`; }
    if (dateFilter.mode === "year" && dateFilter.year) return dateFilter.year;
    return "All time";
  }, [dateFilter]);

  const money = useMemo(
    () => new Map(filteredOrders.map(o => [o.ref, resolveOrderMoney(o, INVOICES)])),
    [filteredOrders]
  );

  const totalOrdered = filteredOrders.reduce((a, o) => a + o.total, 0);
  const totalDone = filteredOrders.reduce((a, o) => a + producedOf(o), 0);
  const totalShortage = filteredOrders.reduce((a, o) => a + (o.shortage ?? 0), 0);
  const completionPct = totalOrdered ? Math.round((totalDone / totalOrdered) * 100) : 0;
  const billed = filteredOrders.reduce((a, o) => a + (money.get(o.ref)?.amountDue ?? 0), 0);
  const collected = filteredOrders.reduce((a, o) => a + (money.get(o.ref)?.amountPaid ?? 0), 0);
  const outstanding = Math.max(0, billed - collected);
  const collectionRate = billed ? Math.round((collected / billed) * 100) : 0;
  const atRisk = filteredOrders.filter(o => o.status === "at-risk" || o.status === "overdue").length;

  const monthly = useMemo(() => {
    const m = new Map<string, { ordered: number; done: number; orders: number }>();
    filteredOrders.forEach(o => {
      const d = new Date(o.due);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const e = m.get(key) || { ordered: 0, done: 0, orders: 0 };
      e.ordered += o.total; e.done += producedOf(o); e.orders += 1;
      m.set(key, e);
    });
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([key, v]) => ({
      month: `${MONTH_ABBR[+key.slice(5) - 1]} ${key.slice(2, 4)}`,
      ...v,
      rate: v.ordered ? Math.round((v.done / v.ordered) * 100) : 0,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredOrders, producedByRef]);

  const statusMix = useMemo(() => (["on-track", "at-risk", "overdue"] as const)
    .map(s => ({ name: STATUS_META[s].label, value: filteredOrders.filter(o => o.status === s).length, color: STATUS_META[s].color }))
    .filter(d => d.value > 0), [filteredOrders]);

  const topCustomers = useMemo(() => {
    const m = new Map<string, { value: number; sarees: number; orders: number }>();
    filteredOrders.forEach(o => {
      const e = m.get(o.customer) || { value: 0, sarees: 0, orders: 0 };
      e.value += money.get(o.ref)?.amountDue ?? 0;
      e.sarees += o.total; e.orders += 1;
      m.set(o.customer, e);
    });
    return [...m.entries()]
      .map(([customer, v]) => ({ customer, short: customer.length > 18 ? customer.slice(0, 17) + "…" : customer, ...v }))
      .sort((a, b) => b.value - a.value || b.sarees - a.sarees)
      .slice(0, 5);
  }, [filteredOrders, money]);

  const today = new Date();
  const pipeline = useMemo(() => filteredOrders
    .map(o => {
      const due = new Date(o.due);
      const daysLeft = isNaN(due.getTime()) ? null : Math.ceil((due.getTime() - today.getTime()) / 86400000);
      const done = producedOf(o);
      return { ...o, done, daysToGo: daysLeft, pct: o.total ? Math.round((done / o.total) * 100) : 0 };
    })
    .sort((a, b) => (a.daysToGo ?? 9999) - (b.daysToGo ?? 9999))
    .slice(0, 6),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredOrders, producedByRef]);

  const byType = useMemo(() => {
    const m = new Map<string, number>();
    filteredOrders.forEach(o => {
      const label = o.sareeType.split(" · ")[0];
      m.set(label, (m.get(label) || 0) + o.total);
    });
    return [...m.entries()]
      .map(([type, sarees], i) => ({ type, sarees, fill: TYPE_FILLS[i % TYPE_FILLS.length] }))
      .sort((a, b) => b.sarees - a.sarees);
  }, [filteredOrders]);

  const payMix = useMemo(() => (["paid", "partial", "pending"] as const)
    .map(k => ({ key: k, ...PAY_META[k], count: filteredOrders.filter(o => (o.paymentStatus ?? "pending") === k).length }))
    .filter(d => d.count > 0), [filteredOrders]);

  const inr = (n: number) => formatMoney(rupees(n));
  const L = (n: number) => formatMoney(rupees(n), { compact: true });
  const card: React.CSSProperties = {
    background: "#FFFFFF", borderRadius: 18, border: `1.5px solid ${T.borderDef}`,
    padding: "22px 24px", boxShadow: "0 4px 18px rgba(74,6,27,0.04)",
  };
  const cardTitle: React.CSSProperties = { fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown };
  const cardSub: React.CSSProperties = { fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 3 };
  const tip = { fontFamily: F.ui, fontSize: 12, borderRadius: 10, border: `1px solid ${T.borderDef}`, boxShadow: "0 8px 24px rgba(74,6,27,0.12)" };

  return (
    <div style={{ padding: "32px 48px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ width: 3, height: 26, background: T.antiqueGold, borderRadius: 2 }} />
        <h2 style={{ fontFamily: F.display, fontSize: 24, color: T.luxuryBrown, margin: 0, fontWeight: 600 }}>Order Analytics</h2>
        <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, letterSpacing: "1px", color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", padding: "4px 10px", borderRadius: 20, textTransform: "uppercase" }}>{periodLabel}</span>
        <div style={{ display: "flex", gap: 24, marginLeft: "auto", flexWrap: "wrap" }}>
          {[
            { label: "ORDERS", value: String(filteredOrders.length), color: T.royalBurgundy },
            { label: "SAREES ORDERED", value: totalOrdered.toLocaleString("en-IN"), color: T.luxuryBrown },
            { label: "COMPLETION", value: `${completionPct}%`, color: completionPct >= 80 ? T.green : T.antiqueGold },
            { label: "OUTSTANDING", value: L(outstanding), color: outstanding > 0 ? T.crimson : T.green },
          ].map(k => (
            <div key={k.label}>
              <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, letterSpacing: "1px", color: T.taupe }}>{k.label}</div>
              <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div style={{ ...card, textAlign: "center", padding: "40px 24px" }}>
          <ShoppingBag size={34} color={T.taupe} style={{ marginBottom: 10 }} />
          <div style={{ fontFamily: F.display, fontSize: 16, color: T.taupe }}>No orders in this period.</div>
          <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: 5 }}>Widen the timeline or clear the filters to see analytics.</div>
        </div>
      ) : (
        <>
          {/* Row 1 — fulfilment trend + status mix */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 22, marginBottom: 22 }}>
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={cardTitle}>Order Fulfilment by Deadline</div>
                  <div style={cardSub}>Sarees committed against sarees completed</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: completionPct >= 80 ? "rgba(30,102,64,0.09)" : "rgba(200,155,71,0.14)", padding: "4px 10px", borderRadius: 20 }}>
                  <TrendingUp size={13} color={completionPct >= 80 ? T.green : "#8B6018"} />
                  <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: completionPct >= 80 ? T.green : "#8B6018" }}>
                    {totalOrdered - totalDone} sarees remaining
                  </span>
                </div>
              </div>
              <div style={{ fontFamily: F.display, fontSize: 38, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1.1, margin: "10px 0 2px" }}>
                {totalDone.toLocaleString("en-IN")}
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 8 }}>
                of {totalOrdered.toLocaleString("en-IN")} sarees across {filteredOrders.length} order{filteredOrders.length === 1 ? "" : "s"}
              </div>
              <ChartFigure title="Order Fulfilment by Deadline" summary={`${totalDone.toLocaleString("en-IN")} of ${totalOrdered.toLocaleString("en-IN")} sarees completed (${completionPct}%) across ${filteredOrders.length} orders.`}>
                <ResponsiveContainer width="100%" height={205}>
                  <ComposedChart data={monthly} barSize={24}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(110,15,45,0.06)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontFamily: F.ui, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontFamily: F.ui, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} width={34} allowDecimals={false} />
                    <YAxis yAxisId="r" orientation="right" domain={[0, 100]} hide />
                    <RechartsTooltip contentStyle={tip} formatter={(v: any, n: any) => n === "Completion" ? [`${v}%`, n] : [`${v} sarees`, n]} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, paddingTop: 8 }} />
                    <Bar name="Ordered" dataKey="ordered" fill={T.royalBurgundy} radius={[5, 5, 0, 0]} />
                    <Bar name="Completed" dataKey="done" fill={semantic.chart.series[1]} radius={[5, 5, 0, 0]} />
                    <Line yAxisId="r" name="Completion" dataKey="rate" stroke={T.green} strokeWidth={2.5} dot={{ r: 3.5, fill: T.green, strokeWidth: 0 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartFigure>
            </div>

            <div style={card}>
              <div style={cardTitle}>Order Status Mix</div>
              <div style={cardSub}>Delivery risk across the queue</div>
              <ChartFigure title="Order Status Mix" summary={`${filteredOrders.length} orders: ${statusMix.map(d => `${d.name} ${d.value}`).join(", ")}.`}>
                <div style={{ position: "relative", marginTop: 12 }}>
                  <ResponsiveContainer width="100%" height={172}>
                    <PieChart>
                      <Pie data={statusMix} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={54} outerRadius={78} paddingAngle={3} stroke="none">
                        {statusMix.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <RechartsTooltip contentStyle={tip} formatter={(v: any, _n: any, p: any) => [`${v} order${v === 1 ? "" : "s"}`, p.payload.name]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                    <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1 }}>{filteredOrders.length}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 3 }}>orders</div>
                  </div>
                </div>
              </ChartFigure>
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
              {totalShortage > 0 && (
                <div style={{ borderTop: `1px solid ${T.borderDef}`, marginTop: 14, paddingTop: 14, display: "flex", justifyContent: "space-between", fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                  <span>Total shortage</span>
                  <span style={{ fontFamily: F.mono, fontWeight: 700, color: T.crimson }}>{totalShortage} sarees</span>
                </div>
              )}
            </div>
          </div>

          {/* Row 2 — top customers + payment collection */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 22, marginBottom: 22 }}>
            <div style={card}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <Trophy size={17} color={T.antiqueGold} />
                <div>
                  <div style={cardTitle}>Top Customers by Order Value</div>
                  <div style={cardSub}>Where the order book is concentrated</div>
                </div>
              </div>
              <ChartFigure title="Top Customers by Order Value" summary={`Top ${topCustomers.length} customers, led by ${topCustomers[0]?.customer ?? "—"} at ${inr(topCustomers[0]?.value ?? 0)}.`}>
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={topCustomers} layout="vertical" barSize={20} margin={{ left: 4, right: 70 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(110,15,45,0.06)" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="short" width={140} tick={{ fontFamily: F.ui, fontSize: 12, fill: T.luxuryBrown }} axisLine={false} tickLine={false} />
                    <RechartsTooltip cursor={{ fill: "rgba(110,15,45,0.04)" }} contentStyle={tip}
                      formatter={(v: any, _n: any, p: any) => [`${inr(v)} · ${p.payload.sarees} sarees · ${p.payload.orders} order(s)`, p.payload.customer]} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}
                      label={{ position: "right", formatter: (v: any) => L(v), fontFamily: F.mono, fontSize: 12, fontWeight: 700, fill: T.luxuryBrown }}>
                      {topCustomers.map((c, i) => (
                        <Cell key={c.customer} fill={semantic.chart.series[i % semantic.chart.series.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartFigure>
              <div style={{ borderTop: `1px solid ${T.borderDef}`, marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between", fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                <span>{new Set(filteredOrders.map(o => o.customer)).size} customers in this period</span>
                <span style={{ color: T.luxuryBrown, fontWeight: 600 }}>Order book {L(billed)}</span>
              </div>
            </div>

            <div style={card}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <IndianRupee size={16} color={T.royalBurgundy} />
                <div style={cardTitle}>Payment Collection</div>
              </div>
              <div style={cardSub}>Billed against collected</div>
              <div style={{ background: outstanding > 0 ? "rgba(192,57,43,0.07)" : "rgba(30,102,64,0.09)", borderRadius: 14, padding: "16px 18px", margin: "16px 0" }}>
                <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, letterSpacing: "1.1px", color: T.taupe, marginBottom: 6 }}>OUTSTANDING</div>
                <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: outstanding > 0 ? T.crimson : T.green, lineHeight: 1 }}>{inr(outstanding)}</div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 6 }}>{collectionRate}% of {inr(billed)} collected</div>
              </div>
              <div style={{ height: 10, borderRadius: 5, background: T.silkCream, overflow: "hidden", border: `1px solid ${T.borderDef}`, marginBottom: 14 }}>
                <div style={{ width: `${collectionRate}%`, height: "100%", background: `linear-gradient(90deg,${T.deepWine},${T.royalBurgundy})` }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {payMix.map(p => (
                  <div key={p.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: p.color }} />
                      <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{p.label}</span>
                    </div>
                    <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.luxuryBrown }}>{p.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3 — deadline pipeline, demand mix, order health */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 22, marginBottom: 8 }}>
            <div style={card}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Timer size={16} color={atRisk ? T.crimson : T.royalBurgundy} />
                <div style={cardTitle}>Deadline Pipeline</div>
              </div>
              <div style={cardSub}>Nearest deadlines first</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 13, marginTop: 16 }}>
                {pipeline.map(o => {
                  const late = o.daysToGo !== null && o.daysToGo < 0;
                  const soon = o.daysToGo !== null && o.daysToGo >= 0 && o.daysToGo <= 5;
                  return (
                    <div key={o.ref}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{o.ref}</span>
                        <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: late ? T.crimson : soon ? "#E67E22" : T.taupe }}>
                          {o.daysToGo === null ? o.due : late ? `${Math.abs(o.daysToGo)}d overdue` : `${o.daysToGo}d left`}
                        </span>
                      </div>
                      <div style={{ height: 8, borderRadius: 4, background: T.silkCream, overflow: "hidden" }}>
                        <div style={{ width: `${o.pct}%`, height: "100%", borderRadius: 4, background: late ? "linear-gradient(90deg,#C0392B,#E74C3C)" : `linear-gradient(90deg,${T.deepWine},${T.royalBurgundy})` }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 4 }}>
                        <span>{o.customer}</span>
                        <span>{o.done}/{o.total} · {o.pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={card}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Layers size={16} color={T.royalBurgundy} />
                <div style={cardTitle}>Demand by Saree Type</div>
              </div>
              <div style={cardSub}>Sarees ordered per product line</div>
              <ChartFigure title="Demand by Saree Type" summary={`${byType.length} product lines; top line is ${byType[0]?.type ?? "—"} with ${byType[0]?.sarees ?? 0} sarees.`}>
                <ResponsiveContainer width="100%" height={186}>
                  <BarChart data={byType} barSize={26} margin={{ top: 16, left: -20, right: 6 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(110,15,45,0.06)" vertical={false} />
                    <XAxis dataKey="type" tick={{ fontFamily: F.ui, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} interval={0} />
                    <YAxis tick={{ fontFamily: F.ui, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} width={34} allowDecimals={false} />
                    <RechartsTooltip cursor={{ fill: "rgba(110,15,45,0.04)" }} contentStyle={tip}
                      formatter={(v: any, _n: any, p: any) => [`${v} sarees`, p.payload.type]} />
                    <Bar dataKey="sarees" radius={[5, 5, 0, 0]}>
                      {byType.map(d => <Cell key={d.type} fill={d.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartFigure>
              <div style={{ borderTop: `1px solid ${T.borderDef}`, marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between", fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                <span>{byType.length} product line{byType.length === 1 ? "" : "s"}</span>
                <span style={{ color: T.luxuryBrown, fontWeight: 600 }}>Top: {byType[0]?.type ?? "—"}</span>
              </div>
            </div>

            <div style={card}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Percent size={16} color={T.royalBurgundy} />
                <div style={cardTitle}>Order Book Health</div>
              </div>
              <div style={cardSub}>Delivery and value snapshot</div>
              <ChartFigure title="Order Book Health" summary={`${completionPct}% completed, ${atRisk} at risk, ${totalShortage} sarees short.`}>
                <ResponsiveContainer width="100%" height={142}>
                  <RadialBarChart innerRadius="62%" outerRadius="100%" startAngle={210} endAngle={-30}
                    data={[{ name: "Completion", value: completionPct, fill: completionPct >= 80 ? T.green : completionPct >= 50 ? T.antiqueGold : T.crimson }]}>
                    <RadialBar dataKey="value" background={{ fill: T.silkCream }} cornerRadius={10} />
                    <text x="50%" y="60%" textAnchor="middle" style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, fill: T.luxuryBrown }}>{completionPct}%</text>
                    <text x="50%" y="80%" textAnchor="middle" style={{ fontFamily: F.ui, fontSize: 12, fill: T.taupe }}>COMPLETED</text>
                  </RadialBarChart>
                </ResponsiveContainer>
              </ChartFigure>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 }}>
                {[
                  { label: "At Risk", value: String(atRisk) },
                  { label: "Shortage", value: `${totalShortage} pcs` },
                  { label: "Avg Order", value: `${filteredOrders.length ? Math.round(totalOrdered / filteredOrders.length) : 0} pcs` },
                  { label: "Tallied", value: `${filteredOrders.filter(o => o.tallied).length}/${filteredOrders.length}` },
                ].map(k => (
                  <div key={k.label} style={{ background: T.silkCream, borderRadius: 10, padding: "10px 12px", border: `1px solid ${T.borderDef}` }}>
                    <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, letterSpacing: "0.5px", color: T.taupe, marginBottom: 4, textTransform: "uppercase" }}>{k.label}</div>
                    <div style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>{k.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
