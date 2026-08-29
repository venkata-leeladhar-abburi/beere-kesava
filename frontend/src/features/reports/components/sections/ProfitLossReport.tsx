import { useMemo } from "react";
import { FileText, BarChart2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import type { TooltipProps } from "recharts";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";
import { useFirms } from "@/features/firms";
import { DownloadGate } from "../../../../shared/ui/DownloadAccess";
import { useMoneyVisible } from "../../../../shared/ui/MoneyValue";
import { rupees, formatMoney } from "@/lib/domain/money";
import { T, F } from "../theme";
import { FadeUp, ChartCard, SectionCard, ReportDLBar, AnimBar } from "../common/primitives";
import { Button } from "../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";

// Same shape as reports/common/primitives.tsx's ChartTip, but routes the
// value through the Money system (formatMoney/rupees) instead of a raw "₹"
// prefix + toLocaleString — ChartTip itself is shared across non-money chart
// tooltips (kg, customers, sarees) and is out of scope for this pass.
function MoneyChartTip({ active, payload, label, moneyVisible }: TooltipProps<ValueType, NameType> & { moneyVisible: boolean }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#FFFDF9", border: `1px solid ${T.borderDef}`, borderRadius: 9, padding: "10px 14px", boxShadow: "0 4px 16px rgba(74,6,27,0.12)" }}>
      {label && <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe, marginBottom: 5, textTransform: "uppercase" }}>{label}</div>}
      {payload.map((p) => (
        <div key={p.dataKey ?? p.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color || p.fill || p.stroke }} />
          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{p.name}:</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: T.luxuryBrown }}>{!moneyVisible ? "••••" : typeof p.value === "number" ? formatMoney(rupees(p.value)) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function ProfitLossReport() {
  const { firms, financials, isLoading, error, refetch } = useFirms();
  const moneyVisible = useMoneyVisible();
  const inr = (n: number) => (moneyVisible ? formatMoney(rupees(n)) : "—");

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

  type LedgerRow = { id: string; label: string; amount: number | null; kind: "section" | "item" | "subtotal" | "net"; color: string; bg: string };

  const ledgerRows: LedgerRow[] = [
    { id: "income-section", label: "▼ INCOME", amount: null, kind: "section", color: T.green, bg: T.greenBg },
    { id: "wholesale", label: "Wholesale Sales", amount: wholesaleSales, kind: "item", color: T.green, bg: "transparent" },
    { id: "retail", label: "Retail Sales", amount: retailSales, kind: "item", color: T.green, bg: "transparent" },
    { id: "other-income", label: "Other Income", amount: otherIncome, kind: "item", color: T.green, bg: "transparent" },
    { id: "total-income", label: "Total Income", amount: totalIncome, kind: "subtotal", color: T.green, bg: T.greenBg },
    { id: "expenses-section", label: "▼ EXPENSES", amount: null, kind: "section", color: T.crimson, bg: T.crimsonBg },
    { id: "weaver-payments", label: "Weaver Payments", amount: weaverPayments, kind: "item", color: T.crimson, bg: "transparent" },
    { id: "material-purchases", label: "Material Purchases", amount: materialPurchases, kind: "item", color: T.crimson, bg: "transparent" },
    { id: "shop-maintenance", label: "Shop Maintenance", amount: shopMaintenance, kind: "item", color: T.crimson, bg: "transparent" },
    { id: "factory-maintenance", label: "Factory Maintenance", amount: factoryMaintenance, kind: "item", color: T.crimson, bg: "transparent" },
    { id: "salaries", label: "Salaries", amount: salaries, kind: "item", color: T.crimson, bg: "transparent" },
    { id: "other-expenses", label: "Other Expenses", amount: otherExpenses, kind: "item", color: T.crimson, bg: "transparent" },
    { id: "total-expenses", label: "Total Expenses", amount: totalExpenses, kind: "subtotal", color: T.crimson, bg: T.crimsonBg },
    {
      id: "net", label: netProfit >= 0 ? "Net Profit" : "Net Loss", amount: Math.abs(netProfit), kind: "net",
      color: netProfit >= 0 ? T.antiqueGold : T.crimson, bg: "rgba(200,155,71,0.12)",
    },
  ];

  const ledgerColumns: ColumnDef<LedgerRow>[] = [
    {
      id: "label", header: "", accessor: r => r.label,
      cell: (_v, r) => {
        if (r.kind === "section") return <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: r.color, textTransform: "uppercase", letterSpacing: "1px" }}>{r.label}</span>;
        if (r.kind === "subtotal") return <span style={{ fontFamily: F.ui, fontSize: "clamp(13px, 3.5vw, 15px)", fontWeight: 700, color: r.color }}>{r.label}</span>;
        if (r.kind === "net") return <span style={{ fontFamily: F.display, fontSize: "clamp(15px, 4vw, 18px)", fontWeight: 700, color: r.color }}>{r.label}</span>;
        return <span style={{ fontFamily: F.ui, fontSize: "clamp(12px, 3.2vw, 14px)", color: T.taupe }}>{r.label}</span>;
      },
    },
    {
      id: "amount", header: "", type: "currency", align: "end", accessor: r => r.amount,
      cell: (_v, r) => {
        if (r.amount == null) return null;
        if (r.kind === "subtotal") return <span style={{ fontFamily: F.display, fontSize: "clamp(15px, 4vw, 20px)", fontWeight: 700, color: r.color }}>{inr(r.amount)}</span>;
        if (r.kind === "net") return <span style={{ fontFamily: F.display, fontSize: "clamp(17px, 4.5vw, 24px)", fontWeight: 700, color: r.color }}>{inr(r.amount)}</span>;
        return <span style={{ fontFamily: "var(--font-mono)", fontSize: "clamp(12px, 3.2vw, 14px)", fontWeight: 700, color: r.color }}>{inr(r.amount)}</span>;
      },
    },
  ];

  function ledgerRowClassName(r: LedgerRow): string | undefined {
    if (r.bg === T.greenBg) return "bg-[rgba(30,102,64,0.09)]";
    if (r.bg === T.crimsonBg) return "bg-[rgba(192,57,43,0.08)]";
    if (r.kind === "net") return "bg-[rgba(200,155,71,0.12)]";
    return undefined;
  }

  const perFirmColumns: ColumnDef<{ name: string; income: number; expenses: number; net: number }>[] = [
    {
      id: "name", header: "Firm Name", accessor: f => f.name,
      cell: (_v, f) => <span style={{ fontFamily: F.ui, fontWeight: 600 }}>{f.name}</span>,
    },
    {
      id: "income", header: "Total Income", accessor: f => f.income, type: "number",
      cell: (_v, f) => <span style={{ fontFamily: "var(--font-mono)", color: T.green, fontWeight: 600 }}>{inr(f.income)}</span>,
    },
    {
      id: "expenses", header: "Total Expenses", accessor: f => f.expenses, type: "number",
      cell: (_v, f) => <span style={{ fontFamily: "var(--font-mono)", color: T.crimson, fontWeight: 600 }}>{inr(f.expenses)}</span>,
    },
    {
      id: "net", header: "Net", accessor: f => f.net, type: "number",
      cell: (_v, f) => <span style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: f.net >= 0 ? T.green : T.crimson }}>{inr(f.net)}</span>,
    },
  ];

  const perFirm = firms.map(firm => {
    const fin = financials.find(f => f.firmId === firm.id) ?? { income: [] as { amount: number }[], expenses: [] as { amount: number }[], misc: [] as { type: string; amount: number }[] };
    let income = 0; fin.income.forEach(e => income += (e.amount || 0)); fin.misc.filter(m => m.type === "income").forEach(m => income += (m.amount || 0));
    let expenses = 0; fin.expenses.forEach(e => expenses += (e.amount || 0)); fin.misc.filter(m => m.type === "expense").forEach(m => expenses += (m.amount || 0));
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
    <div id="rep-pnl" className="px-4 md:px-7 xl:px-10" style={{ paddingTop: 32 }}>
    <SectionCard
      icon={BarChart2}
      title="Profit & Loss Report"
      subtitle="A complete picture of the firm's income and expenses. See how much money came in from sales, how much went out to weavers and vendors, and what was left as profit."
    >
      <ReportDLBar />

      <div className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr]" style={{ gap: 20, marginBottom: 28 }}>
        <ChartCard title="Income vs Expenses — Monthly" sub="Green = income · Crimson = expenses">
          {pnlMonthlyData.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
              No financial entries recorded yet. Add ledger entries in Firms & Vendor Management.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={pnlMonthlyData} barGap={6}>
                <CartesianGrid key="pnl-grid" strokeDasharray="3 3" stroke="rgba(110,15,45,0.07)" vertical={false} />
                <XAxis key="pnl-x" dataKey="month" tick={{ fontFamily: "var(--font-mono)", fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} />
                <YAxis key="pnl-y" tick={{ fontFamily: "var(--font-mono)", fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} tickFormatter={(v: number) => (moneyVisible ? formatMoney(rupees(v)) : "••••")} width={55} />
                <Tooltip key="pnl-tip" content={<MoneyChartTip moneyVisible={moneyVisible} />} />
                <Bar key="pnl-income"   dataKey="income"   name="Income"   fill={T.green}  radius={[4, 4, 0, 0]} />
                <Bar key="pnl-expenses" dataKey="expenses" name="Expenses" fill={T.crimson} radius={[4, 4, 0, 0]} opacity={0.8} />
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
                  <Tooltip key="exp-tip" formatter={(v: ValueType, n: NameType) => [moneyVisible ? formatMoney(rupees(Number(v))) : "••••", n]} contentStyle={{ fontFamily: F.ui, fontSize: 12, borderRadius: 8 }} />
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
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: d.color }}>{inr(d.value)}</span>
                    </div>
                    <AnimBar pct={totalExpenses > 0 ? Math.round((d.value / totalExpenses) * 100) : 0} color={d.color} height={5} />
                  </div>
                ))}
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: T.crimson, textAlign: "right", marginTop: 4 }}>Total: {inr(totalExpenses)}</div>
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

          {/* Mobile View: Fitted 100% to screen width where numbers come immediately after text */}
          <div className="block sm:hidden p-3.5 space-y-2">
            {ledgerRows.map(r => {
              if (r.kind === "section") {
                return (
                  <div key={r.id} style={{ background: r.bg }} className="px-3 py-1.5 rounded-lg mt-3 mb-1.5">
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: r.color, letterSpacing: "1px" }}>
                      {r.label}
                    </span>
                  </div>
                );
              }
              if (r.kind === "subtotal") {
                return (
                  <div key={r.id} style={{ background: r.bg }} className="flex items-center justify-between px-3 py-2.5 rounded-lg my-1">
                    <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: r.color }}>{r.label}:</span>
                    <span style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: r.color }}>{r.amount != null ? inr(r.amount) : "—"}</span>
                  </div>
                );
              }
              if (r.kind === "net") {
                return (
                  <div key={r.id} style={{ background: r.bg }} className="flex items-center justify-between px-3.5 py-3 rounded-xl my-2 border border-[#E8DCC4]">
                    <span style={{ fontFamily: F.display, fontSize: 15, fontWeight: 700, color: r.color }}>{r.label}:</span>
                    <span style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: r.color }}>{r.amount != null ? inr(r.amount) : "—"}</span>
                  </div>
                );
              }
              return (
                <div key={r.id} className="flex items-center justify-between px-3 py-1.5 border-b border-stone-100/80">
                  <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{r.label}:</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: r.color }}>{r.amount != null ? inr(r.amount) : "—"}</span>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (sm:block hidden) */}
          <div className="hidden sm:block w-full overflow-hidden">
            <DataTable
              columns={ledgerColumns}
              data={ledgerRows}
              getRowId={r => r.id}
              caption="Profit & Loss Summary — All Firms"
              rowClassName={ledgerRowClassName}
              loading={isLoading}
              error={!!error}
              onRetry={refetch}
              pagination
            />
          </div>

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
          <div className="w-full overflow-x-auto section-nav-scroll border border-[#E8DCC4] rounded-xl bg-white p-2">
            <div className="min-w-[650px]">
              <DataTable columns={perFirmColumns} data={perFirm} getRowId={f => f.name} loading={isLoading} error={!!error} onRetry={refetch} pagination />
            </div>
          </div>
        </div>
      </FadeUp>
    </SectionCard>
    </div>
  );
}
