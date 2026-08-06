import React from "react";
import { ReceiptText, Banknote, CheckCircle2, BellRing } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useBulkOrders } from "../../../bulk-orders/contexts/BulkOrderContext";
import { T, F } from "../theme";
import { FadeUp, ChartCard, SumCard, TabTitle, ReportDLBar, ChartTip, AnimBar, TablePager, StatusPill, TH, TD } from "../common/primitives";

// MOCK: no backend endpoint aggregates wholesale revenue by calendar month
// or by week — GET /bulk-orders returns the current snapshot of each order
// (amountDue/amountPaid/dueDate) with no historical monthly rollup. This
// trend chart stays on static demo data; the outstanding-by-customer bar,
// invoice-status donut, summary cards, and table below are all computed
// live from useBulkOrders (GET /bulk-orders).
const wsMonthlyRev = [
  { month: "Dec", rev: 2100000 },
  { month: "Jan", rev: 2350000 },
  { month: "Feb", rev: 2600000 },
  { month: "Mar", rev: 2450000 },
  { month: "Apr", rev: 2680000 },
  { month: "May", rev: 2840000 },
];
// Same gap as above — no weekly dispatch-count aggregation on the backend.
const wholesaleWeeklyData = [
  { week: "Week 1", sarees: 20, revenue: 900000 },
  { week: "Week 2", sarees: 12, revenue: 600000 },
  { week: "Week 3", sarees: 8,  revenue: 280000 },
  { week: "Week 4", sarees: 18, revenue: 1060000 },
];
function WholesaleWeeklyTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: "#FFFFFF", border: `1px solid ${T.borderDef}`, borderRadius: 8, padding: "8px 12px", boxShadow: "0 4px 16px rgba(74,6,27,0.12)" }}>
      <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, fontWeight: 600 }}>
        {label} — {d.sarees} sarees dispatched — ₹{d.revenue.toLocaleString("en-IN")} revenue
      </span>
    </div>
  );
}

export function WholesaleSalesReport() {
  const { bulkOrders } = useBulkOrders();

  const maxOutstanding = Math.max(1, ...bulkOrders.map(o => (o.amountDue ?? 0) - (o.amountPaid ?? 0)));
  const wsOutstanding = bulkOrders.map(o => {
    const amt = Math.max(0, (o.amountDue ?? 0) - (o.amountPaid ?? 0));
    return { customer: o.customer, amt, color: amt === 0 ? T.green : (o.status === "overdue" ? T.crimson : T.antiqueGold) };
  });

  const wsInvStatus = (["paid", "partial", "pending"] as const).map(status => ({
    name: status === "paid" ? "Paid" : status === "partial" ? "Partially Paid" : "Pending",
    value: bulkOrders.filter(o => (o.paymentStatus ?? "pending") === status).length,
    color: status === "paid" ? T.green : status === "partial" ? T.antiqueGold : T.crimson,
  })).filter(d => d.value > 0);

  const totalInvoiced = bulkOrders.reduce((s, o) => s + (o.amountDue ?? 0), 0);
  const totalCollected = bulkOrders.reduce((s, o) => s + (o.amountPaid ?? 0), 0);
  const totalOutstanding = totalInvoiced - totalCollected;

  return (
    <div id="rep-wholesale" style={{ padding: "32px 40px" }}>
      <TabTitle title="Wholesale Sales Report"
        sub="Track all wholesale dispatches, invoices raised, payments received, and outstanding dues from every wholesale customer." />
      <ReportDLBar />

      {/* Weekly sarees dispatched — summary strip + bar chart (same pattern as Retail) */}
      <FadeUp>
        <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, padding: "20px 24px", marginBottom: 24, boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 16, color: T.luxuryBrown }}>Wholesale Sarees Dispatched Each Week</div>
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: 2 }}>May 2026 — weekly breakdown</div>
            </div>
            <div style={{ display: "flex", gap: 24 }}>
              <div>
                <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Sarees (All Orders)</div>
                <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.royalBurgundy }}>{bulkOrders.reduce((s, o) => s + o.total, 0)}</div>
              </div>
              <div>
                <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Invoiced (All Orders)</div>
                <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.green }}>₹{totalInvoiced.toLocaleString("en-IN")}</div>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={wholesaleWeeklyData}>
              <CartesianGrid key="wsw-grid" strokeDasharray="3 3" stroke="rgba(110,15,45,0.07)" vertical={false} />
              <XAxis key="wsw-x" dataKey="week" tick={{ fontFamily: F.mono, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} />
              <YAxis key="wsw-y" tick={{ fontFamily: F.mono, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} width={30} />
              <Tooltip key="wsw-tip" content={<WholesaleWeeklyTooltip />} cursor={{ fill: "rgba(110,15,45,0.04)" }} />
              <Bar key="wsw-bar" dataKey="sarees" name="Sarees Dispatched" fill={T.royalBurgundy} radius={[6, 6, 0, 0] as any} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </FadeUp>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 24 }}>
        <ChartCard title="Wholesale Revenue — Last 6 Months" sub="Monthly invoiced amount">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={wsMonthlyRev}>
              <CartesianGrid key="ws-grid" strokeDasharray="3 3" stroke="rgba(110,15,45,0.07)" vertical={false} />
              <XAxis key="ws-x" dataKey="month" tick={{ fontFamily: F.mono, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} />
              <YAxis key="ws-y" tick={{ fontFamily: F.mono, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `₹${(v / 100000).toFixed(0)}L`} width={42} />
              <Tooltip key="ws-tip" content={<ChartTip prefix="₹" />} />
              <Bar key="ws-rev" dataKey="rev" name="Revenue">
                {wsMonthlyRev.map(e => <Cell key={`ws-cell-${e.month}`} fill={e.month === "May" ? T.antiqueGold : "rgba(200,155,71,0.38)"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="How Much Each Customer Still Owes" sub="Outstanding balance per customer">
          <div style={{ display: "flex", flexDirection: "column", gap: 11, padding: "8px 0" }}>
            {wsOutstanding.length === 0 && (
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>No bulk orders recorded yet.</div>
            )}
            {wsOutstanding.map((d, i) => (
              <div key={d.customer}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                  <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{d.customer}</span>
                  <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: d.color }}>{d.amt === 0 ? "Paid ✓" : `₹${d.amt.toLocaleString("en-IN")}`}</span>
                </div>
                <AnimBar pct={d.amt === 0 ? 100 : Math.round((d.amt / maxOutstanding) * 100)} color={d.color} height={6} delay={i * 0.06} />
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Invoice Status — All Bulk Orders" sub="Live payment status breakdown">
          {wsInvStatus.length === 0 ? (
            <div style={{ padding: "20px 0", textAlign: "center", fontFamily: F.ui, fontSize: 13, color: T.taupe }}>No bulk orders recorded yet.</div>
          ) : (
          <>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie key="ws-inv-pie" data={wsInvStatus} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" stroke="none" paddingAngle={3}>
                {wsInvStatus.map(e => <Cell key={`ws-inv-cell-${e.name}`} fill={e.color} />)}
              </Pie>
              <Tooltip key="ws-inv-tip" formatter={(v: any, n: any) => [`${v} invoices`, n]} contentStyle={{ fontFamily: F.ui, fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 8px" }}>
            {wsInvStatus.map(d => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: d.color }} />
                  <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{d.name}</span>
                </div>
                <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: d.color }}>{d.value}</span>
              </div>
            ))}
          </div>
          </>
          )}
        </ChartCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24, alignItems: "stretch" }}>
        <SumCard icon={<ReceiptText size={22} color={T.royalBurgundy} />} label="Total Bulk Orders" value={`${bulkOrders.length} orders`} sub="All-time" />
        <SumCard icon={<Banknote size={22} color={T.royalBurgundy} />} label="Total Invoiced Amount" value={`₹${totalInvoiced.toLocaleString("en-IN")}`} sub="Across all customers" />
        <SumCard icon={<CheckCircle2 size={22} color={T.green} />} label="Total Collected" value={`₹${totalCollected.toLocaleString("en-IN")}`} sub="Payments received" greenHi />
        <SumCard icon={<BellRing size={22} color={T.crimson} />} label="Total Outstanding" value={`₹${Math.max(totalOutstanding, 0).toLocaleString("en-IN")}`} sub="Yet to be collected" crimsonHi />
      </div>

      <FadeUp>
        <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
              <thead>
                <tr>
                  <th style={TH}>Bulk Order Ref</th><th style={TH}>Customer Name</th>
                  <th style={{ ...TH, textAlign: "center" }}>Sarees</th>
                  <th style={{ ...TH, textAlign: "right" }}>Invoice Amount</th><th style={{ ...TH, textAlign: "right" }}>Collected</th>
                  <th style={{ ...TH, textAlign: "right" }}>Balance Due</th><th style={TH}>Dispatch Date</th>
                  <th style={{ ...TH, textAlign: "center" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {bulkOrders.map((o, i) => {
                  const invoiceAmt = o.amountDue ?? 0;
                  const collected = o.amountPaid ?? 0;
                  const balance = invoiceAmt - collected;
                  const statusColor = o.paymentStatus === "paid" ? T.green : o.paymentStatus === "partial" ? T.antiqueGold : T.crimson;
                  return (
                    <tr key={o.ref} style={{ background: i % 2 === 0 ? "#FFFDF9" : T.silkCream, borderLeft: `3px solid ${statusColor}` }}>
                      <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy }}>{o.ref}</span></td>
                      <td style={TD}><span style={{ fontFamily: F.ui, fontWeight: 600 }}>{o.customer}</span></td>
                      <td style={{ ...TD, textAlign: "center", fontFamily: F.mono, fontWeight: 700 }}>{o.total}</td>
                      <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, fontWeight: 700 }}>{invoiceAmt > 0 ? `₹${invoiceAmt.toLocaleString("en-IN")}` : "—"}</td>
                      <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, color: T.green, fontWeight: 600 }}>{collected > 0 ? `₹${collected.toLocaleString("en-IN")}` : "—"}</td>
                      <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, fontWeight: 700, color: balance <= 0 ? T.green : T.crimson }}>{balance > 0 ? `₹${balance.toLocaleString("en-IN")}` : "— Paid"}</td>
                      <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 12 }}>{o.dispatchDate || "—"}</span></td>
                      <td style={{ ...TD, textAlign: "center" }}>
                        <StatusPill label={o.paymentStatus === "paid" ? "✓ Paid" : o.paymentStatus === "partial" ? "◑ Partial" : "⚠ Pending"} type={o.paymentStatus === "paid" ? "ok" : o.paymentStatus === "partial" ? "warn" : "bad"} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <TablePager total={bulkOrders.length} showing={bulkOrders.length} />
        </div>
      </FadeUp>
    </div>
  );
}

