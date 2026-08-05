import React from "react";
import { IndianRupee, TrendingDown, CheckCircle2, Users, BarChart2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useWeaverPayments } from "../../../weavers/contexts/WeaverPaymentsContext";
import { T, F } from "../theme";
import { FadeUp, ChartCard, SumCard, TabTitle, ReportDLBar, ChartTip, AnimBar, TablePager, TH, TD } from "../common/primitives";

const weaverPayMonthly = [
  { month: "Dec", amt: 380000 },
  { month: "Jan", amt: 395000 },
  { month: "Feb", amt: 410000 },
  { month: "Mar", amt: 400000 },
  { month: "Apr", amt: 405000 },
  { month: "May", amt: 420000 },
];
const deductionDonut = [
  { name: "No Deductions",         value: 65, color: T.green },
  { name: "Advance Deductions",    value: 17, color: T.antiqueGold },
  { name: "Defective Sarees",      value: 2,  color: T.crimson },
];
// Saree-type breakdown per weaver (sb/hz/ps/bs/st counts — matches PaymentsPage WEAVERS pattern)
const weaverPayRows = [
  { code: "WV-001", name: "Ravi Kumar",   village: "Varanasi",      sb: 8, hz: 0, ps: 0, bs: 0, st: 0 },
  { code: "WV-002", name: "Padma Veni",   village: "Rajatalab",     sb: 0, hz: 5, ps: 0, bs: 0, st: 0 },
  { code: "WV-007", name: "Suresh Murti", village: "Bhelupura",     sb: 0, hz: 0, ps: 4, bs: 0, st: 0 },
  { code: "WV-005", name: "Anand K.",     village: "Sigra",         sb: 0, hz: 0, ps: 0, bs: 5, st: 0 },
  { code: "WV-012", name: "Meena R.",     village: "Orderly Bazar", sb: 4, hz: 0, ps: 0, bs: 0, st: 0 },
  { code: "WV-031", name: "Kamala B.",    village: "Varanasi",      sb: 0, hz: 6, ps: 0, bs: 0, st: 0 },
  { code: "WV-024", name: "Venkat Rao",   village: "Lanka",         sb: 0, hz: 0, ps: 8, bs: 0, st: 0 },
  { code: "WV-018", name: "Lakshmi D.",   village: "Lahurabir",     sb: 5, hz: 0, ps: 0, bs: 0, st: 0 },
];
function sareeBreakdown(r: typeof weaverPayRows[0]): string {
  return [
    r.sb > 0 && `SB×${r.sb}`,
    r.hz > 0 && `HZ×${r.hz}`,
    r.ps > 0 && `PS×${r.ps}`,
    r.bs > 0 && `BS×${r.bs}`,
    r.st > 0 && `ST×${r.st}`,
  ].filter(Boolean).join(", ") || "—";
}

export function WeaverPaymentReport() {
  const { getPaymentsForWeaver } = useWeaverPayments();
  return (
    <div id="rep-weaver-payments" style={{ padding: "32px 40px" }}>
      <TabTitle title="Weaver Payment Report"
        sub="Complete breakdown of making charges earned, deductions applied, and net amounts paid to every weaver. Download the monthly payment sheet for your records." />
      <ReportDLBar />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24, alignItems: "stretch" }}>
        <ChartCard title="Total Making Charges Paid Each Month" sub="Last 6 months — gold bars" icon={<IndianRupee size={22} color={T.antiqueGold} />}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weaverPayMonthly}>
              <CartesianGrid key="wp-grid" strokeDasharray="3 3" stroke="rgba(110,15,45,0.07)" vertical={false} />
              <XAxis key="wp-x" dataKey="month" tick={{ fontFamily: F.mono, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} />
              <YAxis key="wp-y" tick={{ fontFamily: F.mono, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `₹${(v / 100000).toFixed(1)}L`} width={44} />
              <Tooltip key="wp-tip" content={<ChartTip prefix="₹" />} />
              <Bar key="wp-amt" dataKey="amt" name="Making Charges">
                {weaverPayMonthly.map((e, i) => (
                  <Cell key={`wp-cell-${e.month}`} fill={e.month === "May" ? T.antiqueGold : "rgba(200,155,71,0.40)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="What Caused Deductions This Period" sub="May 2026 deduction breakdown" icon={<TrendingDown size={22} color={T.crimson} />}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <PieChart width={160} height={160}>
                <Pie key="ded-pie" data={deductionDonut} cx="50%" cy="50%" innerRadius={48} outerRadius={68} dataKey="value" stroke="none" paddingAngle={3}>
                  {deductionDonut.map(e => <Cell key={`ded-cell-${e.name}`} fill={e.color} />)}
                </Pie>
                <Tooltip key="ded-tip" formatter={(v: any, n: any) => [`${v} weavers`, n]}
                  contentStyle={{ fontFamily: F.ui, fontSize: 12, borderRadius: 8 }} />
              </PieChart>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
                <div style={{ fontFamily: F.mono, fontSize: 16, fontWeight: 700, color: T.crimson }}>₹18,400</div>
                <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>TOTAL DEDUCTIONS</div>
              </div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              {deductionDonut.map(d => (
                <div key={d.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 9, height: 9, borderRadius: "50%", background: d.color }} />
                      <span style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>{d.name}</span>
                    </div>
                    <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: d.color }}>{d.value}</span>
                  </div>
                  <AnimBar pct={Math.round((d.value / 84) * 100)} color={d.color} height={5} />
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24, alignItems: "stretch" }}>
        <SumCard icon={<Users size={22} color={T.royalBurgundy} />} label="Total Weavers Paid" value="72 of 84" sub="12 payments pending" />
        <SumCard icon={<IndianRupee size={22} color={T.antiqueGold} />} label="Total Making Charges" value="₹4,20,000" sub="For May 2026" hi />
        <SumCard icon={<TrendingDown size={22} color={T.crimson} />} label="Total Deductions" value="₹18,400" sub="Advance amounts deducted" crimsonHi />
        <SumCard icon={<CheckCircle2 size={22} color={T.green} />} label="Total Net Paid" value="₹4,01,600" sub="After all deductions" greenHi />
      </div>

      <div style={{ background: "rgba(200,155,71,0.08)", border: `1px solid ${T.borderGold}`, borderRadius: 10, padding: "12px 18px", marginBottom: 18, display: "flex", alignItems: "center", gap: 10 }}>
        <BarChart2 size={18} color={T.antiqueGold} />
        <span style={{ fontFamily: F.ui, fontSize: 14, color: "#7B5C18" }}>This report is commonly used for payment reconciliation and record keeping. Download as Excel for full weaver payment sheet.</span>
      </div>

      <FadeUp>
        <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1000 }}>
              <thead>
                <tr>
                  <th style={TH}>Weaver ID</th>
                  <th style={TH}>Weaver Name</th>
                  <th style={TH}>Sarees Produced</th>
                  <th style={{ ...TH, textAlign: "right" }}>Amount Paid</th>
                  <th style={TH}>UTR Number</th>
                  <th style={TH}>Firm Name</th>
                  <th style={TH}>Payment Date</th>
                </tr>
              </thead>
              <tbody>
                {weaverPayRows.map((r, i) => {
                  const payments = getPaymentsForWeaver(r.code);
                  const latest = payments[payments.length - 1];
                  const amountPaid = latest?.amountPaid;
                  const utr = latest?.utrNumber ?? "—";
                  const firmName = latest?.firmName ?? "—";
                  const paymentDate = latest?.paymentDate ?? "—";
                  return (
                    <tr key={r.code} style={{ background: i % 2 === 0 ? "#FFFDF9" : T.silkCream, borderLeft: `3px solid ${latest ? T.green : T.antiqueGold}` }}>
                      <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 13, color: T.royalBurgundy }}>{r.code}</span></td>
                      <td style={TD}><span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600 }}>{r.name}</span></td>
                      <td style={TD}><span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{sareeBreakdown(r)}</span></td>
                      <td style={{ ...TD, textAlign: "right", fontFamily: F.display, fontSize: 16, fontWeight: 700, color: latest ? T.green : T.taupe }}>{amountPaid !== undefined ? `₹${amountPaid.toLocaleString("en-IN")}` : "—"}</td>
                      <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 12, color: latest ? T.green : T.taupe }}>{utr}</span></td>
                      <td style={TD}><span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{firmName}</span></td>
                      <td style={TD}><span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{paymentDate}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <TablePager total={84} showing={8} />
        </div>
      </FadeUp>
    </div>
  );
}

