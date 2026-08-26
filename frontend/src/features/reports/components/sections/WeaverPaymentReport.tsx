import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { IndianRupee, TrendingDown, CheckCircle2, Users, BarChart2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useWeaverPayments } from "@/features/weavers";
import { weaversApi } from "../../../../shared/api/weavers";
import { qcApi } from "../../../../shared/api/qc";
import { T, F } from "../theme";
import { FadeUp, ChartCard, SumCard, SectionCard, ReportDLBar, AnimBar, TablePager } from "../common/primitives";
import { DataTable } from "../../../../shared/ui/data";
import { semantic } from "../../../../design-system/tokens";
import { rupees, formatMoney } from "@/lib/domain/money";
import { Money, useDataAccess } from "@/shared/ui/domain";

// Same shape as reports/common/primitives.tsx's ChartTip, but routes the
// value through the Money system (formatMoney/rupees) instead of a raw "₹"
// prefix + toLocaleString — ChartTip itself is shared across non-money chart
// tooltips (kg, customers, sarees) and is out of scope for this pass.
interface MoneyChartTipPayloadEntry {
  name?: string;
  value?: number | string;
  color?: string;
  fill?: string;
  stroke?: string;
}

function MoneyChartTip({ active, payload, label, canSeePayroll }: {
  active?: boolean;
  payload?: MoneyChartTipPayloadEntry[];
  label?: string;
  canSeePayroll?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#FFFDF9", border: `1px solid ${T.borderDef}`, borderRadius: 9, padding: "10px 14px", boxShadow: "0 4px 16px rgba(74,6,27,0.12)" }}>
      {label && <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe, marginBottom: 5, textTransform: "uppercase" }}>{label}</div>}
      {payload.map((p) => (
        <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color || p.fill || p.stroke }} />
          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{p.name}:</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: T.luxuryBrown }}>{!canSeePayroll ? "••••" : typeof p.value === "number" ? formatMoney(rupees(p.value)) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function WeaverPaymentReport() {
  const canSeePayroll = useDataAccess("payroll");
  const { payments } = useWeaverPayments();
  const { data: weaversRes, isLoading: weaversLoading, isError: weaversError, refetch: refetchWeavers } = useQuery({
    queryKey: ["reports", "weavers-roster"],
    queryFn: () => weaversApi.list(),
  });
  const { data: qcRes } = useQuery({
    queryKey: ["reports", "qc-deductions"],
    queryFn: () => qcApi.list(200),
  });

  const weavers = useMemo(() => weaversRes?.items ?? [], [weaversRes]);
  const qcItems = useMemo(() => qcRes?.items ?? [], [qcRes]);

  // Monthly making charges calculated dynamically from live payments
  const weaverPayMonthly = useMemo(() => {
    const monthlyMap: Record<string, number> = {};
    for (const p of payments) {
      const d = new Date(p.paymentDate || p.uploadedAt);
      if (isNaN(d.getTime())) continue;
      const monthLabel = d.toLocaleString("en-US", { month: "short" });
      monthlyMap[monthLabel] = (monthlyMap[monthLabel] || 0) + (p.amountPaid + (p.deduction || 0));
    }

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const activeMonths = months.filter(m => monthlyMap[m] !== undefined);
    
    // Fallback if no payment dates or only current month
    if (activeMonths.length === 0) return [];
    return activeMonths.map(m => ({ month: m, amt: monthlyMap[m] || 0 }));
  }, [payments]);

  // Deduction breakdown dynamically calculated from real QC records & payments
  const deductionBreakdown = useMemo(() => {
    let noDeductionCount = 0;
    let qcDeductionCount = 0;
    let otherDeductionCount = 0;

    for (const p of payments) {
      if (!p.deduction || p.deduction === 0) {
        noDeductionCount++;
      } else {
        // check if weaver has defective / semi QC records
        const hasQcDefect = qcItems.some(q => q.weaverId === p.weaverId && (q.result === "DEFECTIVE" || q.result === "SEMI"));
        if (hasQcDefect) qcDeductionCount++;
        else otherDeductionCount++;
      }
    }

    return [
      { name: "No Deductions", value: noDeductionCount, color: T.green },
      { name: "Advance / Other Deductions", value: otherDeductionCount, color: T.antiqueGold },
      { name: "Defective Sarees (QC)", value: qcDeductionCount, color: T.crimson },
    ].filter(d => d.value > 0);
  }, [payments, qcItems]);

  const weaverPayRows = useMemo(() => {
    const byWeaver = new Map<string, typeof payments>();
    for (const p of payments) {
      const list = byWeaver.get(p.weaverId);
      if (list) list.push(p);
      else byWeaver.set(p.weaverId, [p]);
    }
    return weavers.map(w => {
      const list = (byWeaver.get(w.id) ?? []).slice().sort((a, b) => a.uploadedAt.localeCompare(b.uploadedAt));
      const latest = list[list.length - 1];
      const totalSarees = list.reduce((s, p) => s + (p.noOfSarees ?? 0), 0);
      return {
        code: w.id,
        name: w.name,
        village: w.village ?? "—",
        totalSarees,
        latest,
      };
    });
  }, [weavers, payments]);

  const paidWeaverIds = new Set(payments.map(p => p.weaverId));
  const totalDeductions = payments.reduce((s, p) => s + (p.deduction ?? 0), 0);
  const totalNetPaid = payments.reduce((s, p) => s + p.amountPaid, 0);
  const totalMakingCharges = totalNetPaid + totalDeductions;

  return (
    <div id="rep-weaver-payments" className="px-4 md:px-7 xl:px-10" style={{ paddingTop: 32 }}>
    <SectionCard
      icon={Users}
      title="Weaver Payment Report"
      subtitle="Complete breakdown of making charges earned, deductions applied, and net amounts paid to every weaver. Download the monthly payment sheet for your records."
    >
      <ReportDLBar />

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 20, marginBottom: 24, alignItems: "stretch" }}>
        <ChartCard title="Total Making Charges Paid Each Month" sub="Monthly breakdown from live payments" icon={<IndianRupee size={22} color={T.antiqueGold} />}>
          {weaverPayMonthly.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
              No payments recorded yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weaverPayMonthly}>
                <CartesianGrid key="wp-grid" strokeDasharray="3 3" stroke="rgba(110,15,45,0.07)" vertical={false} />
                <XAxis key="wp-x" dataKey="month" tick={{ fontFamily: "var(--font-mono)", fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} />
                <YAxis key="wp-y" tick={{ fontFamily: "var(--font-mono)", fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} tickFormatter={(v: number) => (canSeePayroll ? formatMoney(rupees(v)) : "••••")} width={55} />
                <Tooltip key="wp-tip" content={<MoneyChartTip canSeePayroll={canSeePayroll} />} />
                <Bar key="wp-amt" dataKey="amt" name="Making Charges">
                  {weaverPayMonthly.map((e, i) => (
                    <Cell key={`wp-cell-${e.month}`} fill={i === weaverPayMonthly.length - 1 ? semantic.chart.series[0] : "rgba(154,45,74,0.35)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="What Caused Deductions This Period" sub="Live deduction breakdown" icon={<TrendingDown size={22} color={T.crimson} />}>
          {payments.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
              No payments recorded yet.
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <PieChart width={160} height={160}>
                  <Pie key="ded-pie" data={deductionBreakdown} cx="50%" cy="50%" innerRadius={48} outerRadius={68} dataKey="value" stroke="none" paddingAngle={3}>
                    {deductionBreakdown.map(e => <Cell key={`ded-cell-${e.name}`} fill={e.color} />)}
                  </Pie>
                  <Tooltip key="ded-tip" formatter={(v: number | string, n: string) => [`${v} payments`, n]}
                    contentStyle={{ fontFamily: F.ui, fontSize: 12, borderRadius: 8 }} />
                </PieChart>
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700, color: T.crimson }}><Money value={rupees(totalDeductions)} gate="payroll" /></div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe }}>TOTAL DEDUCTIONS</div>
                </div>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                {deductionBreakdown.map(d => (
                  <div key={d.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 9, height: 9, borderRadius: "50%", background: d.color }} />
                        <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{d.name}</span>
                      </div>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: d.color }}>{d.value}</span>
                    </div>
                    <AnimBar pct={Math.round((d.value / (payments.length || 1)) * 100)} color={d.color} height={5} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4" style={{ gap: 16, marginBottom: 24, alignItems: "stretch" }}>
        <SumCard icon={<Users size={22} color={T.royalBurgundy} />} label="Total Weavers Paid" value={`${paidWeaverIds.size} of ${weavers.length}`} sub={`${Math.max(weavers.length - paidWeaverIds.size, 0)} with no payments on record`} />
        <SumCard icon={<IndianRupee size={22} color={T.antiqueGold} />} label="Total Making Charges" value={canSeePayroll ? formatMoney(rupees(totalMakingCharges)) : "••••"} sub="All recorded payments" hi />
        <SumCard icon={<TrendingDown size={22} color={T.crimson} />} label="Total Deductions" value={canSeePayroll ? formatMoney(rupees(totalDeductions)) : "••••"} sub="Deducted from making charges" crimsonHi />
        <SumCard icon={<CheckCircle2 size={22} color={T.green} />} label="Total Net Paid" value={canSeePayroll ? formatMoney(rupees(totalNetPaid)) : "••••"} sub="After all deductions" greenHi />
      </div>

      <div style={{ background: "rgba(200,155,71,0.08)", border: `1px solid ${T.borderGold}`, borderRadius: 10, padding: "12px 18px", marginBottom: 18, display: "flex", alignItems: "center", gap: 10 }}>
        <BarChart2 size={18} color={T.antiqueGold} />
        <span style={{ fontFamily: F.ui, fontSize: 14, color: "#7B5C18" }}>This report is commonly used for payment reconciliation and record keeping. Download as Excel for full weaver payment sheet.</span>
      </div>

      <FadeUp>
        <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
          <div className="w-full overflow-x-auto section-nav-scroll p-2">
            <div className="min-w-[850px]">
              <DataTable<(typeof weaverPayRows)[number]>
                columns={[
                  { id: "code", header: "Weaver ID", accessor: r => r.code, cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: T.royalBurgundy }}>{r.code}</span> },
                  { id: "name", header: "Weaver Name", accessor: r => r.name, cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600 }}>{r.name}</span> },
                  { id: "totalSarees", header: "Sarees Produced", accessor: r => r.totalSarees, cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{r.totalSarees > 0 ? `${r.totalSarees} sarees` : "—"}</span> },
                  {
                    id: "amountPaid", header: "Amount Paid", accessor: r => r.latest?.amountPaid, align: "end",
                    cell: (_v, r) => {
                      const amountPaid = r.latest?.amountPaid;
                      return <span style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: r.latest ? T.green : T.taupe }}>{amountPaid === undefined ? "—" : canSeePayroll ? formatMoney(rupees(amountPaid)) : "••••"}</span>;
                    },
                  },
                  { id: "utr", header: "UTR Number", accessor: r => r.latest?.utrNumber, cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: r.latest ? T.green : T.taupe }}>{r.latest?.utrNumber || "—"}</span> },
                  { id: "firmName", header: "Firm Name", accessor: r => r.latest?.firmName, cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{r.latest?.firmName || "—"}</span> },
                  { id: "paymentDate", header: "Payment Date", accessor: r => r.latest?.paymentDate, cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{r.latest?.paymentDate ?? "—"}</span> },
                ]}
                data={weaverPayRows}
                getRowId={r => r.code}
                loading={weaversLoading}
                error={!!weaversError}
                onRetry={() => void refetchWeavers()}
                emptyTitle="No weavers on record yet."
              />
            </div>
          </div>
          <TablePager total={weaverPayRows.length} showing={weaverPayRows.length} />
        </div>
      </FadeUp>
    </SectionCard>
    </div>
  );
}
