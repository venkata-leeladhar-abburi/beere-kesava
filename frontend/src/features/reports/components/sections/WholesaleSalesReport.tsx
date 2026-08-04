import React from "react";
import { ReceiptText, Banknote, CheckCircle2, BellRing } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useBulkOrders } from "../../../bulk-orders/contexts/BulkOrderContext";
import { T, F } from "../theme";
import { FadeUp, ChartCard, SumCard, TabTitle, ReportDLBar, ChartTip, AnimBar, TablePager, StatusPill, TH, TD } from "../common/primitives";

const wsMonthlyRev = [
  { month: "Dec", rev: 2100000 },
  { month: "Jan", rev: 2350000 },
  { month: "Feb", rev: 2600000 },
  { month: "Mar", rev: 2450000 },
  { month: "Apr", rev: 2680000 },
  { month: "May", rev: 2840000 },
];
const wsOutstanding = [
  { customer: "Padmavathi Textiles", amt: 135000,  color: T.crimson },
  { customer: "Narayana Emporium",   amt: 45600,   color: T.crimson },
  { customer: "Meenakshi Silks",     amt: 420000,  color: T.antiqueGold },
  { customer: "Kalavathi Exports",   amt: 45600,   color: T.crimson },
  { customer: "Vijaya Silk House",   amt: 0,       color: T.green },
];
const wsInvStatus = [
  { name: "Paid",          value: 2, color: T.green },
  { name: "Partially Paid",value: 1, color: T.antiqueGold },
  { name: "Overdue",       value: 3, color: T.crimson },
];
const wsTableRows = [
  { inv: "INV-2026-041", customer: "Lakshmi Silks",          date: "08 Apr 2026", sarees: 18, type: "Mixed",          total: 900000,  recv: 900000,  due: 0,      dueDate: "28 Apr 2026", status: "Paid",    daysLeft: 0   },
  { inv: "INV-2026-038", customer: "Padmavathi Textiles",    date: "05 Apr 2026", sarees: 12, type: "Bridal Special", total: 600000,  recv: 465000,  due: 135000, dueDate: "25 Apr 2026", status: "Overdue", daysLeft: -5  },
  { inv: "INV-2026-035", customer: "Vijaya Silk House",      date: "10 Apr 2026", sarees: 8,  type: "Heavy Zari",     total: 280000,  recv: 280000,  due: 0,      dueDate: "30 Apr 2026", status: "Paid",    daysLeft: 0   },
  { inv: "INV-2026-032", customer: "Narayana Silk Emporium", date: "01 Apr 2026", sarees: 10, type: "Mixed",          total: 300000,  recv: 254400,  due: 45600,  dueDate: "20 Apr 2026", status: "Overdue", daysLeft: -3  },
  { inv: "INV-2026-029", customer: "Meenakshi Silks",        date: "15 Apr 2026", sarees: 20, type: "Bridal Special", total: 840000,  recv: 420000,  due: 420000, dueDate: "05 May 2026", status: "Partial", daysLeft: 0   },
  { inv: "INV-2026-027", customer: "Kalavathi Exports",      date: "18 Apr 2026", sarees: 15, type: "Self Brocade",   total: 660000,  recv: 614400,  due: 45600,  dueDate: "02 May 2026", status: "Overdue", daysLeft: -2  },
];
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
                <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Sarees This Month</div>
                <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.royalBurgundy }}>{wholesaleWeeklyData.reduce((s, w) => s + w.sarees, 0)}</div>
              </div>
              <div>
                <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Revenue This Month</div>
                <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.green }}>₹{wholesaleWeeklyData.reduce((s, w) => s + w.revenue, 0).toLocaleString("en-IN")}</div>
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
            {wsOutstanding.map((d, i) => (
              <div key={d.customer}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                  <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{d.customer}</span>
                  <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: d.color }}>{d.amt === 0 ? "Paid ✓" : `₹${d.amt.toLocaleString("en-IN")}`}</span>
                </div>
                <AnimBar pct={d.amt === 0 ? 100 : Math.round((d.amt / 500000) * 100)} color={d.color} height={6} delay={i * 0.06} />
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Invoice Status This Period" sub="May 2026 invoices">
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
        </ChartCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24, alignItems: "stretch" }}>
        <SumCard icon={<ReceiptText size={22} color={T.royalBurgundy} />} label="Total Invoices Raised" value="12 invoices" sub="May 2026" />
        <SumCard icon={<Banknote size={22} color={T.royalBurgundy} />} label="Total Invoiced Amount" value="₹28,40,000" sub="Across all customers" />
        <SumCard icon={<CheckCircle2 size={22} color={T.green} />} label="Total Collected" value="₹18,60,000" sub="Payments received" greenHi />
        <SumCard icon={<BellRing size={22} color={T.crimson} />} label="Total Outstanding" value="₹9,80,000" sub="Yet to be collected" crimsonHi />
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

