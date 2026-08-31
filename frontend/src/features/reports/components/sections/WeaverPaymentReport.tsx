import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { IndianRupee, TrendingDown, CheckCircle2, Users, BarChart2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useWeaverPayments } from "@/features/weavers";
import { weaversApi } from "../../../../shared/api/weavers";
import { qcApi } from "../../../../shared/api/qc";
import { T, F } from "../theme";
import { FadeUp, SilkSumCard, SectionCard, ReportDLBar } from "../common/primitives";
import { ChartCard, ChartBand, TrackBar, BAND } from "../../../production/components/sections/chart-primitives";
import { DataTable } from "../../../../shared/ui/data";
import { semantic } from "../../../../design-system/tokens";
import { rupees, formatMoney } from "@/lib/domain/money";
import { Money, useDataAccess } from "@/shared/ui/domain";
import { useReportPeriod, useRegisterExport } from "../PeriodContext";

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
  const { payments: allPayments } = useWeaverPayments();
  const { inCurrent } = useReportPeriod();
  const payments = useMemo(
    () => allPayments.filter(p => inCurrent(p.paymentDate || p.uploadedAt)),
    [allPayments, inCurrent],
  );
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

  // Keyed by year+month. The month name alone merged (say) Aug 2025 into
  // Aug 2026 and ordered the bars by calendar month rather than by time.
  const weaverPayMonthly = useMemo(() => {
    const map = new Map<string, { month: string; amt: number }>();

    for (const p of payments) {
      const d = new Date(p.paymentDate || p.uploadedAt);
      if (isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("en-US", { month: "short", year: "2-digit" }).replace(" ", " '");
      const entry = map.get(key) ?? { month: label, amt: 0 };
      entry.amt += p.amountPaid + (p.deduction || 0);
      map.set(key, entry);
    }

    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([, v]) => v);
  }, [payments]);

  const deductionBreakdown = useMemo(() => {
    let noDeductionCount = 0;
    let qcDeductionCount = 0;
    let otherDeductionCount = 0;

    for (const p of payments) {
      if (!p.deduction || p.deduction === 0) {
        noDeductionCount++;
      } else {
        // Attribution used to be "this weaver has ever had a defective QC
        // record", so one old defect made every later deduction look
        // QC-caused forever. It now matches the QC record to the payment's
        // own batch where there is one, and only then falls back to the
        // weaver-level check.
        const qcForPayment = qcItems.filter(q =>
          q.weaverId === p.weaverId && (!p.batchNo || !q.batchId || q.batchId === p.batchNo));
        const hasQcDefect = qcForPayment.some(q => q.result === "DEFECTIVE" || q.result === "SEMI");
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
        code: w.code,
        name: w.name,
        village: w.village ?? "—",
        totalSarees,
        // Sarees were summed across every payment while the money columns
        // showed only the most recent one — the two never added up. Money is
        // now totalled the same way, with the latest payment's reference
        // details kept in their own clearly-labelled columns.
        totalPaid: list.reduce((s, p) => s + p.amountPaid, 0),
        totalDeduction: list.reduce((s, p) => s + (p.deduction ?? 0), 0),
        payments: list.length,
        latest,
      };
    });
  }, [weavers, payments]);

  useRegisterExport(useMemo(() => ({
    name: "Weaver Payment Report",
    headers: ["Weaver ID", "Weaver Name", "Village", "Sarees Produced", "Payments", "Total Paid", "Total Deductions", "Latest UTR", "Latest Batch No.", "Latest Payment Date"],
    rows: weaverPayRows.map(r => [r.code, r.name, r.village, r.totalSarees, r.payments, r.totalPaid, r.totalDeduction, r.latest?.utrNumber ?? "", r.latest?.batchNo ?? "", r.latest?.paymentDate ?? ""]),
  }), [weaverPayRows]));

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
        <ChartCard>
          <ChartBand tone="weavers" icon={<IndianRupee size={19} color={BAND.weavers.icon} />} title="Total Making Charges Paid Each Month" sub="Monthly breakdown from live payments" />
          <div className="p-5 sm:p-6" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
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
          </div>
        </ChartCard>

        <ChartCard>
          <ChartBand tone="pipeline" icon={<TrendingDown size={19} color={BAND.pipeline.icon} />} title="What Caused Deductions This Period" sub="Live deduction breakdown" />
          <div className="p-5 sm:p-6" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
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
                    <TrackBar pct={Math.round((d.value / (payments.length || 1)) * 100)} fill={d.color} height={9} delay={deductionBreakdown.indexOf(d) * 0.08} />
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4" style={{ gap: 22, marginBottom: 28, alignItems: "stretch" }}>
        <SilkSumCard icon={<Users size={22} color={T.antiqueGold} />} label="Total Weavers Paid" value={`${paidWeaverIds.size} of ${weavers.length}`} sub={`${Math.max(weavers.length - paidWeaverIds.size, 0)} with no payments on record`} gid="wpr-w" />
        <SilkSumCard icon={<IndianRupee size={22} color={T.antiqueGold} />} label="Total Making Charges" value={canSeePayroll ? formatMoney(rupees(totalMakingCharges)) : "••••"} sub="Payments in the selected period" gid="wpr-c" />
        <SilkSumCard icon={<TrendingDown size={22} color={T.antiqueGold} />} label="Total Deductions" value={canSeePayroll ? formatMoney(rupees(totalDeductions)) : "••••"} sub="Deducted from making charges" gid="wpr-d" />
        <SilkSumCard icon={<CheckCircle2 size={22} color={T.antiqueGold} />} label="Total Net Paid" value={canSeePayroll ? formatMoney(rupees(totalNetPaid)) : "••••"} sub="After all deductions" gid="wpr-n" />
      </div>

      <div style={{ background: "rgba(200,155,71,0.08)", border: `1px solid ${T.borderGold}`, borderRadius: 10, padding: "12px 18px", marginBottom: 18, display: "flex", alignItems: "center", gap: 10 }}>
        <BarChart2 size={18} color={T.antiqueGold} />
        <span style={{ fontFamily: F.ui, fontSize: 14, color: "#7B5C18" }}>This report is commonly used for payment reconciliation and record keeping. Download as Excel for full weaver payment sheet.</span>
      </div>

      <FadeUp>
        <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
          <div className="w-full">
            <div className="min-w-[850px]">
              <DataTable<(typeof weaverPayRows)[number]>
                columns={[
                  { id: "code", header: "Weaver ID", accessor: r => r.code, cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: T.royalBurgundy }}>{r.code}</span> },
                  { id: "name", header: "Weaver Name", accessor: r => r.name, cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600 }}>{r.name}</span> },
                  { id: "totalSarees", header: "Sarees Produced", accessor: r => r.totalSarees, cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{r.totalSarees > 0 ? `${r.totalSarees} sarees` : "—"}</span> },
                  {
                    id: "amountPaid", header: "Total Paid", accessor: r => r.totalPaid, align: "end",
                    cell: (_v, r) => (
                      <span style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: r.latest ? T.green : T.taupe }}>
                        {!r.latest ? "—" : canSeePayroll ? formatMoney(rupees(r.totalPaid)) : "••••"}
                      </span>
                    ),
                  },
                  { id: "payments", header: "Payments", accessor: r => r.payments, align: "center", cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: T.taupe }}>{r.payments || "—"}</span> },
                  { id: "utr", header: "Latest UTR Number", accessor: r => r.latest?.utrNumber, cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: r.latest ? T.green : T.taupe }}>{r.latest?.utrNumber || "—"}</span> },
                  { id: "firmName", header: "Firm Name", accessor: r => r.latest?.firmName, cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{r.latest?.firmName || "—"}</span> },
                  { id: "batchNo", header: "Latest Batch No.", accessor: r => r.latest?.batchNo, cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe }}>{r.latest?.batchNo || "—"}</span> },
                  { id: "loomNumber", header: "Loom", accessor: r => r.latest?.loomNumber, cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe }}>{r.latest?.loomNumber || "—"}</span> },
                  { id: "deduction", header: "Total Deductions", accessor: r => r.totalDeduction, align: "end", cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 13, color: r.totalDeduction ? T.crimson : T.taupe }}>{r.totalDeduction ? (canSeePayroll ? formatMoney(rupees(r.totalDeduction)) : "••••") : "—"}</span> },
                  { id: "paymentDate", header: "Latest Payment Date", accessor: r => r.latest?.paymentDate, cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{r.latest?.paymentDate ?? "—"}</span> },
                ]}
                data={weaverPayRows}
                getRowId={r => r.code}
                loading={weaversLoading}
                error={!!weaversError}
                onRetry={() => void refetchWeavers()}
                pagination
              />
            </div>
          </div>
        </div>
      </FadeUp>
    </SectionCard>
    </div>
  );
}
