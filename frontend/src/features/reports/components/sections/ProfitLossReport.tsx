import React, { useMemo } from "react";
import { FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useFirms } from "../../../firms/contexts/FirmsContext";
import { DownloadGate } from "../../../../shared/ui/DownloadAccess";
import { useMoneyVisible } from "../../../../shared/ui/MoneyValue";
import { T, F } from "../theme";
import { FadeUp, ChartCard, TabTitle, ReportDLBar, ChartTip, AnimBar } from "../common/primitives";
import { Button } from "../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";

export function ProfitLossReport() {
  const { firms, financials } = useFirms();
  const moneyVisible = useMoneyVisible();
  const inr = (n: number) => (moneyVisible ? `₹${n.toLocaleString("en-IN")}` : "—");
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

  const perFirmColumns: ColumnDef<{ name: string; income: number; expenses: number; net: number }>[] = [
    {
      id: "name", header: "Firm Name", accessor: f => f.name,
      cell: (_v, f) => <span style={{ fontFamily: F.ui, fontWeight: 600 }}>{f.name}</span>,
    },
    {
      id: "income", header: "Total Income", accessor: f => f.income, type: "number",
      cell: (_v, f) => <span style={{ fontFamily: F.mono, color: T.green, fontWeight: 600 }}>₹{f.income.toLocaleString("en-IN")}</span>,
    },
    {
      id: "expenses", header: "Total Expenses", accessor: f => f.expenses, type: "number",
      cell: (_v, f) => <span style={{ fontFamily: F.mono, color: T.crimson, fontWeight: 600 }}>₹{f.expenses.toLocaleString("en-IN")}</span>,
    },
    {
      id: "net", header: "Net", accessor: f => f.net, type: "number",
      cell: (_v, f) => <span style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: f.net >= 0 ? T.green : T.crimson }}>{f.net >= 0 ? "₹" : "−₹"}{Math.abs(f.net).toLocaleString("en-IN")}</span>,
    },
  ];

  const perFirm = firms.map(firm => {
    const fin = financials.find(f => f.firmId === firm.id) ?? { income: [] as { amount: number }[], expenses: [] as { amount: number }[], misc: [] as { type: string; amount: number }[] };
    let income = 0; (fin.income as any[]).forEach(e => income += (e.amount || 0)); (fin.misc as any[]).filter(m => m.type === "income").forEach(m => income += (m.amount || 0));
    let expenses = 0; (fin.expenses as any[]).forEach(e => expenses += (e.amount || 0)); (fin.misc as any[]).filter(m => m.type === "expense").forEach(m => expenses += (m.amount || 0));
    return { name: firm.firmName, income, expenses, net: income - expenses };
  });

  // Dynamic monthly income vs expenses aggregated from real firm financial entries
  const pnlMonthlyData = useMemo(() => {
    const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const incomeMap: Record<string, number> = {};
    const expenseMap: Record<string, number> = {};

    for (const f of financials) {
      for (const e of f.income) {
        const d = new Date(e.date);
        if (!isNaN(d.getTime())) {
          const m = d.toLocaleString("en-US", { month: "short" });
          incomeMap[m] = (incomeMap[m] || 0) + e.amount;
        }
      }
      for (const e of f.expenses) {
        const d = new Date(e.date);
        if (!isNaN(d.getTime())) {
          const m = d.toLocaleString("en-US", { month: "short" });
          expenseMap[m] = (expenseMap[m] || 0) + e.amount;
        }
      }
    }

    const activeMonths = monthOrder.filter(m => incomeMap[m] !== undefined || expenseMap[m] !== undefined);
    if (activeMonths.length === 0) return [];
    return activeMonths.map(m => ({
      month: m,
      income: incomeMap[m] || 0,
      expenses: expenseMap[m] || 0,
    }));
  }, [financials]);

  // Dynamic expense breakdown pie chart
  const expenseDonut = useMemo(() => {
    const categories: { name: string; value: number; color: string }[] = [
      { name: "Weaver Payments", value: weaverPayments, color: T.royalBurgundy },
      { name: "Material Purchases", value: materialPurchases, color: T.antiqueGold },
      { name: "Shop Maintenance", value: shopMaintenance, color: T.green },
      { name: "Factory Maintenance", value: factoryMaintenance, color: "#2B5278" },
      { name: "Salaries", value: salaries, color: "#8E44AD" },
      { name: "Other Expenses", value: otherExpenses, color: T.taupe },
    ];

    return categories.filter(c => c.value > 0);
  }, [weaverPayments, materialPurchases, shopMaintenance, factoryMaintenance, salaries, otherExpenses]);

  return (
    <div id="rep-pnl" style={{ padding: "32px 40px" }}>
      <TabTitle title="Profit & Loss Report"
        sub="A complete picture of the firm's income and expenses. See how much money came in from sales, how much went out to weavers and vendors, and what was left as profit." />
      <ReportDLBar />

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20, marginBottom: 28 }}>
        <ChartCard title="Income vs Expenses — Monthly" sub="Green = income · Crimson = expenses">
          {pnlMonthlyData.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
              No financial entries recorded yet. Add ledger entries in Firms & Vendor Management.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={pnlMonthlyData} barGap={6}>
                <CartesianGrid key="pnl-grid" strokeDasharray="3 3" stroke="rgba(110,15,45,0.07)" vertical={false} />
                <XAxis key="pnl-x" dataKey="month" tick={{ fontFamily: F.mono, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} />
                <YAxis key="pnl-y" tick={{ fontFamily: F.mono, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} width={55} />
                <Tooltip key="pnl-tip" content={<ChartTip prefix="₹" />} />
                <Bar key="pnl-income"   dataKey="income"   name="Income"   fill={T.green}  radius={[4,4,0,0] as any} />
                <Bar key="pnl-expenses" dataKey="expenses" name="Expenses" fill={T.crimson} radius={[4,4,0,0] as any} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Where Did the Money Go" sub="Expense breakdown by category">
          {expenseDonut.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
              No expenses recorded yet.
            </div>
          ) : (
            <>
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
                      <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: d.color }}>₹{d.value.toLocaleString("en-IN")}</span>
                    </div>
                    <AnimBar pct={totalExpenses > 0 ? Math.round((d.value / totalExpenses) * 100) : 0} color={d.color} height={5} />
                  </div>
                ))}
                <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.crimson, textAlign: "right", marginTop: 4 }}>Total: ₹{totalExpenses.toLocaleString("en-IN")}</div>
              </div>
            </>
          )}
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
                <td style={{ ...ledgerAmtStyle, color: T.green }}>{inr(wholesaleSales)}</td>
              </tr>
              <tr style={{ borderBottom: `1px solid rgba(30,102,64,0.10)` }}>
                <td style={ledgerLabelStyle}>Retail Sales</td>
                <td style={{ ...ledgerAmtStyle, color: T.green }}>{inr(retailSales)}</td>
              </tr>
              <tr style={{ borderBottom: `1px solid rgba(30,102,64,0.10)` }}>
                <td style={ledgerLabelStyle}>Other Income</td>
                <td style={{ ...ledgerAmtStyle, color: T.green }}>{inr(otherIncome)}</td>
              </tr>
              <tr style={{ background: T.greenBg, borderBottom: `2px solid rgba(30,102,64,0.20)` }}>
                <td style={{ ...ledgerLabelStyle, fontFamily: F.ui, fontWeight: 700, color: T.green }}>Total Income</td>
                <td style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: T.green, padding: "12px 20px", textAlign: "right" }}>{inr(totalIncome)}</td>
              </tr>

              {/* EXPENSES */}
              <tr style={{ background: T.crimsonBg }}>
                <td colSpan={2} style={{ padding: "10px 20px", fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.crimson, textTransform: "uppercase", letterSpacing: "1.5px" }}>▼ EXPENSES</td>
              </tr>
              <tr style={{ borderBottom: `1px solid rgba(192,57,43,0.10)` }}>
                <td style={ledgerLabelStyle}>Weaver Payments</td>
                <td style={{ ...ledgerAmtStyle, color: T.crimson }}>{inr(weaverPayments)}</td>
              </tr>
              <tr style={{ borderBottom: `1px solid rgba(192,57,43,0.10)` }}>
                <td style={ledgerLabelStyle}>Material Purchases</td>
                <td style={{ ...ledgerAmtStyle, color: T.crimson }}>{inr(materialPurchases)}</td>
              </tr>
              <tr style={{ borderBottom: `1px solid rgba(192,57,43,0.10)` }}>
                <td style={ledgerLabelStyle}>Shop Maintenance</td>
                <td style={{ ...ledgerAmtStyle, color: T.crimson }}>{inr(shopMaintenance)}</td>
              </tr>
              <tr style={{ borderBottom: `1px solid rgba(192,57,43,0.10)` }}>
                <td style={ledgerLabelStyle}>Factory Maintenance</td>
                <td style={{ ...ledgerAmtStyle, color: T.crimson }}>{inr(factoryMaintenance)}</td>
              </tr>
              <tr style={{ borderBottom: `1px solid rgba(192,57,43,0.10)` }}>
                <td style={ledgerLabelStyle}>Salaries</td>
                <td style={{ ...ledgerAmtStyle, color: T.crimson }}>{inr(salaries)}</td>
              </tr>
              <tr style={{ borderBottom: `1px solid rgba(192,57,43,0.10)` }}>
                <td style={ledgerLabelStyle}>Other Expenses</td>
                <td style={{ ...ledgerAmtStyle, color: T.crimson }}>{inr(otherExpenses)}</td>
              </tr>
              <tr style={{ background: T.crimsonBg, borderBottom: `2px solid rgba(192,57,43,0.20)` }}>
                <td style={{ ...ledgerLabelStyle, fontFamily: F.ui, fontWeight: 700, color: T.crimson }}>Total Expenses</td>
                <td style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: T.crimson, padding: "12px 20px", textAlign: "right" }}>{inr(totalExpenses)}</td>
              </tr>

              {/* NET PROFIT / LOSS */}
              <tr style={{ background: "rgba(200,155,71,0.12)", borderBottom: `2px solid rgba(200,155,71,0.30)` }}>
                <td style={{ ...ledgerLabelStyle, fontFamily: F.display, fontSize: 20, fontWeight: 700, color: netProfit >= 0 ? T.antiqueGold : T.crimson }}>{netProfit >= 0 ? "Net Profit" : "Net Loss"}</td>
                <td style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: netProfit >= 0 ? T.antiqueGold : T.crimson, padding: "16px 20px", textAlign: "right" }}>{inr(Math.abs(netProfit))}</td>
              </tr>
            </tbody>
          </table>

          <DownloadGate>
            <div style={{ padding: "12px 20px", background: "rgba(200,155,71,0.06)", borderTop: `1px solid ${T.borderGold}`, display: "flex", alignItems: "center", gap: 10 }}>
              <FileText size={13} color={T.antiqueGold} />
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Download this report as PDF for your monthly records and year-end accounting.</span>
              <Button variant="primary" size="sm" className="ml-auto">Download PDF</Button>
            </div>
          </DownloadGate>
        </div>
      </FadeUp>

      {/* Per-firm breakdown */}
      <FadeUp>
        <div style={{ marginTop: 24 }}>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: T.luxuryBrown, marginBottom: 12 }}>Per-Firm Breakdown</div>
          <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
            <DataTable columns={perFirmColumns} data={perFirm} getRowId={f => f.name} />
          </div>
        </div>
      </FadeUp>
    </div>
  );
}
