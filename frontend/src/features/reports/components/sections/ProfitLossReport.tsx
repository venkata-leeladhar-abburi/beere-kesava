import React from "react";
import { FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useFirms } from "../../../firms/contexts/FirmsContext";
import { DownloadGate } from "../../../../shared/ui/DownloadAccess";
import { T, F } from "../theme";
import { FadeUp, ChartCard, TabTitle, ReportDLBar, ChartTip, AnimBar, TH, TD } from "../common/primitives";

const pnlMonthlyData = [
  { month: "Dec", income: 1820000, expenses: 980000 },
  { month: "Jan", income: 2140000, expenses: 1060000 },
  { month: "Feb", income: 2380000, expenses: 1140000 },
  { month: "Mar", income: 2450000, expenses: 1200000 },
  { month: "Apr", income: 2680000, expenses: 1240000 },
  { month: "May", income: 3260000, expenses: 1280000 },
];
const expenseDonut = [
  { name: "Weaver Making Charges", value: 420000, color: T.royalBurgundy },
  { name: "Vendor Raw Material",   value: 860000, color: T.antiqueGold },
];

export function ProfitLossReport() {
  const { firms, financials } = useFirms();
  const ledgerLabelStyle: React.CSSProperties = { fontFamily: F.ui, fontSize: 14, color: T.taupe, padding: "11px 20px" };
  const ledgerAmtStyle: React.CSSProperties = { fontFamily: F.mono, fontSize: 14, fontWeight: 700, padding: "11px 20px", textAlign: "right" as const };

  const hasData = financials.some(f => f.income.length > 0 || f.expenses.length > 0 || f.misc.length > 0);

  const sumIncomeByCategory = (cat: string) =>
    financials.reduce((s, f) => s + f.income.filter(e => e.category === cat).reduce((a, e) => a + e.amount, 0), 0);
  const sumExpenseByCategory = (cat: string) =>
    financials.reduce((s, f) => s + f.expenses.filter(e => e.category === cat).reduce((a, e) => a + e.amount, 0), 0);
  const sumMiscByType = (type: "income" | "expense") =>
    financials.reduce((s, f) => s + f.misc.filter(m => m.type === type).reduce((a, m) => a + m.amount, 0), 0);

  const wholesaleSales = sumIncomeByCategory("Wholesale Sale");
  const retailSales = sumIncomeByCategory("Retail Sale");
  const otherIncome = sumIncomeByCategory("Other") + sumMiscByType("income");
  const totalIncome = wholesaleSales + retailSales + otherIncome;

  const weaverPayments = sumExpenseByCategory("Weaver Payments");
  const materialPurchases = sumExpenseByCategory("Material Purchase");
  const shopMaintenance = sumExpenseByCategory("Shop Maintenance");
  const factoryMaintenance = sumExpenseByCategory("Factory Maintenance");
  const salaries = sumExpenseByCategory("Salaries");
  const otherExpenses = sumExpenseByCategory("Other") + sumMiscByType("expense");
  const totalExpenses = weaverPayments + materialPurchases + shopMaintenance + factoryMaintenance + salaries + otherExpenses;

  const netProfit = totalIncome - totalExpenses;

  const perFirm = firms.map(firm => {
    const fin = financials.find(f => f.firmId === firm.id) ?? { income: [] as { amount: number }[], expenses: [] as { amount: number }[], misc: [] as { type: string; amount: number }[] };
    let income = 0; (fin.income as any[]).forEach(e => income += (e.amount || 0)); (fin.misc as any[]).filter(m => m.type === "income").forEach(m => income += (m.amount || 0));
    let expenses = 0; (fin.expenses as any[]).forEach(e => expenses += (e.amount || 0)); (fin.misc as any[]).filter(m => m.type === "expense").forEach(m => expenses += (m.amount || 0));
    return { name: firm.firmName, income, expenses, net: income - expenses };
  });

  return (
    <div id="rep-pnl" style={{ padding: "32px 40px" }}>
      <TabTitle title="Profit & Loss Report"
        sub="A complete picture of the firm's income and expenses. See how much money came in from sales, how much went out to weavers and vendors, and what was left as profit." />
      <ReportDLBar />

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20, marginBottom: 28 }}>
        <ChartCard title="Income vs Expenses — Last 6 Months" sub="Green = income · Crimson = expenses">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={pnlMonthlyData} barGap={6}>
              <CartesianGrid key="pnl-grid" strokeDasharray="3 3" stroke="rgba(110,15,45,0.07)" vertical={false} />
              <XAxis key="pnl-x" dataKey="month" tick={{ fontFamily: F.mono, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} />
              <YAxis key="pnl-y" tick={{ fontFamily: F.mono, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `₹${(v / 100000).toFixed(0)}L`} width={42} />
              <Tooltip key="pnl-tip" content={<ChartTip prefix="₹" />} />
              <Bar key="pnl-income"   dataKey="income"   name="Income"   fill={T.green}  radius={[4,4,0,0] as any} />
              <Bar key="pnl-expenses" dataKey="expenses" name="Expenses" fill={T.crimson} radius={[4,4,0,0] as any} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Where Did the Money Go" sub="Expense breakdown — May 2026">
          <div style={{ position: "relative" }}>
            <PieChart width={200} height={160}>
              <Pie key="exp-pie" data={expenseDonut} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" stroke="none" paddingAngle={3}>
                {expenseDonut.map(e => <Cell key={`exp-cell-${e.name}`} fill={e.color} />)}
              </Pie>
              <Tooltip key="exp-tip" formatter={(v: any, n: any) => [`₹${Number(v).toLocaleString("en-IN")}`, n]} contentStyle={{ fontFamily: F.ui, fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 8px" }}>
            {expenseDonut.map(d => (
              <div key={d.name}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 9, height: 9, borderRadius: "50%", background: d.color }} />
                    <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{d.name}</span>
                  </div>
                  <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: d.color }}>₹{(d.value / 100000).toFixed(1)}L</span>
                </div>
                <AnimBar pct={Math.round((d.value / 1280000) * 100)} color={d.color} height={5} />
              </div>
            ))}
            <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.crimson, textAlign: "right", marginTop: 4 }}>Total: ₹12,80,000</div>
          </div>
        </ChartCard>
      </div>

      {/* P&L Ledger — live from FirmsContext */}
      <FadeUp>
        <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, boxShadow: "0 4px 20px rgba(74,6,27,0.08)", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px 14px", borderBottom: `1px solid ${T.borderDef}` }}>
            <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 600, color: T.luxuryBrown }}>Profit & Loss Summary — All Firms</div>
          </div>

          {!hasData && (
            <div style={{ padding: "14px 24px", background: "rgba(200,155,71,0.08)", borderBottom: `1px solid ${T.borderGold}`, fontFamily: F.ui, fontSize: 13, color: "#7B5C18" }}>
              No income or expense entries yet. Add entries in the Firms page to see data here.
            </div>
          )}

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            {/* INCOME */}
            <tbody>
              <tr style={{ background: T.greenBg }}>
                <td colSpan={2} style={{ padding: "10px 20px", fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.green, textTransform: "uppercase", letterSpacing: "1.5px" }}>▼ INCOME</td>
              </tr>
              <tr style={{ borderBottom: `1px solid rgba(30,102,64,0.10)` }}>
                <td style={ledgerLabelStyle}>Wholesale Sales</td>
                <td style={{ ...ledgerAmtStyle, color: T.green }}>₹{wholesaleSales.toLocaleString("en-IN")}</td>
              </tr>
              <tr style={{ borderBottom: `1px solid rgba(30,102,64,0.10)` }}>
                <td style={ledgerLabelStyle}>Retail Sales</td>
                <td style={{ ...ledgerAmtStyle, color: T.green }}>₹{retailSales.toLocaleString("en-IN")}</td>
              </tr>
              <tr style={{ borderBottom: `1px solid rgba(30,102,64,0.10)` }}>
                <td style={ledgerLabelStyle}>Other Income</td>
                <td style={{ ...ledgerAmtStyle, color: T.green }}>₹{otherIncome.toLocaleString("en-IN")}</td>
              </tr>
              <tr style={{ background: T.greenBg, borderBottom: `2px solid rgba(30,102,64,0.20)` }}>
                <td style={{ ...ledgerLabelStyle, fontFamily: F.ui, fontWeight: 700, color: T.green }}>Total Income</td>
                <td style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: T.green, padding: "12px 20px", textAlign: "right" }}>₹{totalIncome.toLocaleString("en-IN")}</td>
              </tr>

              {/* EXPENSES */}
              <tr style={{ background: T.crimsonBg }}>
                <td colSpan={2} style={{ padding: "10px 20px", fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.crimson, textTransform: "uppercase", letterSpacing: "1.5px" }}>▼ EXPENSES</td>
              </tr>
              <tr style={{ borderBottom: `1px solid rgba(192,57,43,0.10)` }}>
                <td style={ledgerLabelStyle}>Weaver Payments</td>
                <td style={{ ...ledgerAmtStyle, color: T.crimson }}>₹{weaverPayments.toLocaleString("en-IN")}</td>
              </tr>
              <tr style={{ borderBottom: `1px solid rgba(192,57,43,0.10)` }}>
                <td style={ledgerLabelStyle}>Material Purchases</td>
                <td style={{ ...ledgerAmtStyle, color: T.crimson }}>₹{materialPurchases.toLocaleString("en-IN")}</td>
              </tr>
              <tr style={{ borderBottom: `1px solid rgba(192,57,43,0.10)` }}>
                <td style={ledgerLabelStyle}>Shop Maintenance</td>
                <td style={{ ...ledgerAmtStyle, color: T.crimson }}>₹{shopMaintenance.toLocaleString("en-IN")}</td>
              </tr>
              <tr style={{ borderBottom: `1px solid rgba(192,57,43,0.10)` }}>
                <td style={ledgerLabelStyle}>Factory Maintenance</td>
                <td style={{ ...ledgerAmtStyle, color: T.crimson }}>₹{factoryMaintenance.toLocaleString("en-IN")}</td>
              </tr>
              <tr style={{ borderBottom: `1px solid rgba(192,57,43,0.10)` }}>
                <td style={ledgerLabelStyle}>Salaries</td>
                <td style={{ ...ledgerAmtStyle, color: T.crimson }}>₹{salaries.toLocaleString("en-IN")}</td>
              </tr>
              <tr style={{ borderBottom: `1px solid rgba(192,57,43,0.10)` }}>
                <td style={ledgerLabelStyle}>Other Expenses</td>
                <td style={{ ...ledgerAmtStyle, color: T.crimson }}>₹{otherExpenses.toLocaleString("en-IN")}</td>
              </tr>
              <tr style={{ background: T.crimsonBg, borderBottom: `2px solid rgba(192,57,43,0.20)` }}>
                <td style={{ ...ledgerLabelStyle, fontFamily: F.ui, fontWeight: 700, color: T.crimson }}>Total Expenses</td>
                <td style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: T.crimson, padding: "12px 20px", textAlign: "right" }}>₹{totalExpenses.toLocaleString("en-IN")}</td>
              </tr>

              {/* NET PROFIT / LOSS */}
              <tr style={{ background: "rgba(200,155,71,0.12)", borderBottom: `2px solid rgba(200,155,71,0.30)` }}>
                <td style={{ ...ledgerLabelStyle, fontFamily: F.display, fontSize: 20, fontWeight: 700, color: netProfit >= 0 ? T.antiqueGold : T.crimson }}>{netProfit >= 0 ? "Net Profit" : "Net Loss"}</td>
                <td style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: netProfit >= 0 ? T.antiqueGold : T.crimson, padding: "16px 20px", textAlign: "right" }}>₹{Math.abs(netProfit).toLocaleString("en-IN")}</td>
              </tr>
            </tbody>
          </table>

          <DownloadGate>
            <div style={{ padding: "12px 20px", background: "rgba(200,155,71,0.06)", borderTop: `1px solid ${T.borderGold}`, display: "flex", alignItems: "center", gap: 10 }}>
              <FileText size={13} color={T.antiqueGold} />
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Download this report as PDF for your monthly records and year-end accounting.</span>
              <button style={{ marginLeft: "auto", padding: "6px 14px", background: T.royalBurgundy, border: "none", borderRadius: 7, fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: "#FFFDF9", cursor: "pointer" }}>Download PDF</button>
            </div>
          </DownloadGate>
        </div>
      </FadeUp>

      {/* Per-firm breakdown */}
      <FadeUp>
        <div style={{ marginTop: 24 }}>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: T.luxuryBrown, marginBottom: 12 }}>Per-Firm Breakdown</div>
          <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={TH}>Firm Name</th>
                  <th style={{ ...TH, textAlign: "right" }}>Total Income</th>
                  <th style={{ ...TH, textAlign: "right" }}>Total Expenses</th>
                  <th style={{ ...TH, textAlign: "right" }}>Net</th>
                </tr>
              </thead>
              <tbody>
                {perFirm.map((f, i) => (
                  <tr key={f.name} style={{ background: i % 2 === 0 ? "#FFFDF9" : T.silkCream, borderLeft: `3px solid ${f.net >= 0 ? T.green : T.crimson}` }}>
                    <td style={TD}><span style={{ fontFamily: F.ui, fontWeight: 600 }}>{f.name}</span></td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, color: T.green, fontWeight: 600 }}>₹{f.income.toLocaleString("en-IN")}</td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, color: T.crimson, fontWeight: 600 }}>₹{f.expenses.toLocaleString("en-IN")}</td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.display, fontSize: 14, fontWeight: 700, color: f.net >= 0 ? T.green : T.crimson }}>{f.net >= 0 ? "₹" : "−₹"}{Math.abs(f.net).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </FadeUp>
    </div>
  );
}

