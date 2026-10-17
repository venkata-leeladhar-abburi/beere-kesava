import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { IndianRupee, TrendingDown, CheckCircle2, Users, BarChart2 } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { useWeaverPayments, type WeaverPaymentRecord } from "@/features/weavers";
import { weaversApi } from "../../../../shared/api/weavers";
import { qcApi } from "../../../../shared/api/qc";
import { T, F } from "../theme";
import { FadeUp, SilkSumCard, SectionCard, ReportDLBar } from "../common/primitives";
import { CompareStrip, metric, pick } from "../common/compare";
import { TrendChart } from "../common/TrendChart";
import { ChartCard, ChartBand, TrackBar, BAND } from "@/features/production";
import { DataTable } from "../../../../shared/ui/data";
import { rupees, formatMoney } from "@/lib/domain/money";
import { Money, useDataAccess } from "@/shared/ui/domain";
import { useReportPeriod, useRegisterExport, usePeriodSplit } from "../PeriodContext";
import { buildSeries, bucketPhrase } from "../timeSeries";

/** When the payment was made — the ISO date, not the display string. */
const paidOn = (p: WeaverPaymentRecord) => p.paidOn || p.uploadedAt;

function summarise(payments: WeaverPaymentRecord[]) {
  const deductions = payments.reduce((s, p) => s + (p.deduction ?? 0), 0);
  const net = payments.reduce((s, p) => s + p.amountPaid, 0);
  return {
    weavers: new Set(payments.map((p) => p.weaverId)).size,
    payments: payments.length,
    sarees: payments.reduce((s, p) => s + (p.noOfSarees ?? 0), 0),
    gross: net + deductions,
    deductions,
    net,
  };
}

export function WeaverPaymentReport() {
  const canSeePayroll = useDataAccess("payroll");
  const { payments: allPayments, isLoading: paymentsLoading } = useWeaverPayments();
  const {
    current,
    prior,
    compareActive,
    label: periodLabel,
    compareLabel,
    priorLabel,
  } = useReportPeriod();
  const split = usePeriodSplit(allPayments, paidOn);
  const payments = split.cur;
  const cur = useMemo(() => summarise(split.cur), [split]);
  const pri = useMemo(() => (compareActive ? summarise(split.prev) : null), [compareActive, split]);
  const {
    data: weaversRes,
    isLoading: weaversLoading,
    isError: weaversError,
    refetch: refetchWeavers,
  } = useQuery({
    queryKey: ["reports", "weavers-roster"],
    queryFn: () => weaversApi.list(),
  });
  // The full QC list (shared with the production tab's cache) — 200 records
  // was a cap, so later defects never explained a deduction.
  const { data: qcRes } = useQuery({
    queryKey: ["reports", "qc-all"],
    queryFn: () => qcApi.listAll(),
  });

  const weavers = useMemo(() => weaversRes?.items ?? [], [weaversRes]);
  const qcItems = useMemo(() => qcRes ?? [], [qcRes]);

  const metrics = useMemo(
    () => [
      metric("weavers", "Weavers paid", "count", cur.weavers, pri?.weavers),
      metric("payments", "Payments made", "count", cur.payments, pri?.payments),
      metric("sarees", "Sarees paid for", "count", cur.sarees, pri?.sarees),
      metric("gross", "Making charges", "money", cur.gross, pri?.gross, "neutral", "payroll"),
      metric(
        "deductions",
        "Deductions",
        "money",
        cur.deductions,
        pri?.deductions,
        "down",
        "payroll"
      ),
      metric("net", "Net paid", "money", cur.net, pri?.net, "neutral", "payroll"),
    ],
    [cur, pri]
  );

  const chargesSeries = useMemo(
    () =>
      buildSeries({
        current,
        prior,
        currentItems: split.cur,
        priorItems: split.prev,
        dateOf: paidOn,
        amountOf: (p) => p.amountPaid + (p.deduction ?? 0),
      }),
    [current, prior, split]
  );

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
        const qcForPayment = qcItems.filter(
          (q) => q.weaverId === p.weaverId && (!p.batchNo || !q.batchId || q.batchId === p.batchNo)
        );
        const hasQcDefect = qcForPayment.some(
          (q) => q.result === "DEFECTIVE" || q.result === "SEMI"
        );
        if (hasQcDefect) qcDeductionCount++;
        else otherDeductionCount++;
      }
    }

    return [
      { name: "No Deductions", value: noDeductionCount, color: T.green },
      { name: "Advance / Other Deductions", value: otherDeductionCount, color: T.antiqueGold },
      { name: "Defective Sarees (QC)", value: qcDeductionCount, color: T.crimson },
    ].filter((d) => d.value > 0);
  }, [payments, qcItems]);

  const weaverPayRows = useMemo(() => {
    const byWeaver = new Map<string, typeof payments>();
    for (const p of payments) {
      const list = byWeaver.get(p.weaverId);
      if (list) list.push(p);
      else byWeaver.set(p.weaverId, [p]);
    }
    return (
      weavers
        .map((w) => {
          const list = (byWeaver.get(w.id) ?? [])
            .slice()
            .sort((a, b) => paidOn(a).localeCompare(paidOn(b)));
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
        })
        // Paid weavers first, largest amount first; the unpaid follow by name.
        .sort((a, b) => b.totalPaid - a.totalPaid || a.name.localeCompare(b.name))
    );
  }, [weavers, payments]);

  // Payroll figures stay out of the file for roles that may not see them.
  const money = (n: number) => (canSeePayroll ? n : null);
  useRegisterExport(
    useMemo(
      () => ({
        name: "Weaver Payment Report",
        sheetName: "By Weaver",
        headers: [
          "Weaver ID",
          "Weaver Name",
          "Village",
          "Sarees Paid For",
          "Payments",
          "Total Paid",
          "Total Deductions",
          "Latest UTR",
          "Latest Batch No.",
          "Latest Payment Date",
        ],
        columns: [
          "text",
          "text",
          "text",
          "number",
          "number",
          "money",
          "money",
          "text",
          "text",
          "date",
        ],
        totals: true,
        rows: weaverPayRows.map((r) => [
          r.code,
          r.name,
          r.village,
          r.totalSarees,
          r.payments,
          money(r.totalPaid),
          money(r.totalDeduction),
          r.latest?.utrNumber ?? "",
          r.latest?.batchNo ?? "",
          r.latest ? paidOn(r.latest) : null,
        ]),
        extraSheets: [
          {
            name: "Payments",
            headers: [
              "Payment Date",
              "Weaver",
              "UTR",
              "Firm",
              "Batch No.",
              "Loom",
              "Sarees",
              "Making Charges",
              "Deduction",
              "Net Paid",
            ],
            columns: [
              "date",
              "text",
              "text",
              "text",
              "text",
              "text",
              "number",
              "money",
              "money",
              "money",
            ],
            totals: true,
            rows: payments
              .slice()
              .sort((a, b) => paidOn(b).localeCompare(paidOn(a)))
              .map((p) => [
                paidOn(p),
                p.weaverName,
                p.utrNumber || "—",
                p.firmName || "—",
                p.batchNo ?? "—",
                p.loomNumber ?? "—",
                p.noOfSarees ?? null,
                money(p.amountPaid + (p.deduction ?? 0)),
                money(p.deduction ?? 0),
                money(p.amountPaid),
              ]),
          },
        ],
        metrics: canSeePayroll ? metrics : metrics.filter((m) => m.unit !== "money"),
        ready: !paymentsLoading && !weaversLoading,
      }),
      // `money` closes over canSeePayroll only.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [weaverPayRows, payments, metrics, canSeePayroll, paymentsLoading, weaversLoading]
    )
  );

  const totalDeductions = cur.deductions;
  const totalNetPaid = cur.net;
  const totalMakingCharges = cur.gross;

  return (
    <div id="rep-weaver-payments" className="px-4 md:px-7 xl:px-10" style={{ paddingTop: 32 }}>
      <SectionCard
        icon={Users}
        title="Weaver Payment Report"
        subtitle="Complete breakdown of making charges earned, deductions applied, and net amounts paid to every weaver. Download the monthly payment sheet for your records."
      >
        <ReportDLBar />
        <CompareStrip metrics={metrics} />

        <div
          className="grid grid-cols-1 md:grid-cols-2"
          style={{ gap: 20, marginBottom: 24, alignItems: "stretch" }}
        >
          <ChartCard>
            <ChartBand
              tone="weavers"
              icon={<IndianRupee size={19} color={BAND.weavers.icon} />}
              title="Making Charges Paid Over Time"
              sub={`${compareLabel ?? periodLabel} — ${bucketPhrase(chargesSeries.bucket)}`}
            />
            <div
              className="p-5 sm:p-6"
              style={{ display: "flex", flexDirection: "column", flex: 1 }}
            >
              <TrendChart
                points={chargesSeries.points}
                unit="money"
                gate="payroll"
                height={200}
                currentName={compareLabel ?? periodLabel}
                priorName={priorLabel}
                emptyText={paymentsLoading ? "Loading payments…" : `No payments in ${periodLabel}.`}
              />
            </div>
          </ChartCard>

          <ChartCard>
            <ChartBand
              tone="pipeline"
              icon={<TrendingDown size={19} color={BAND.pipeline.icon} />}
              title="What Caused Deductions This Period"
              sub="Live deduction breakdown"
            />
            <div
              className="p-5 sm:p-6"
              style={{ display: "flex", flexDirection: "column", flex: 1 }}
            >
              {payments.length === 0 ? (
                <div
                  style={{
                    padding: "40px 0",
                    textAlign: "center" as const,
                    fontFamily: F.ui,
                    fontSize: 13,
                    color: T.taupe,
                  }}
                >
                  No payments in {periodLabel}.
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <PieChart width={160} height={160}>
                      <Pie
                        key="ded-pie"
                        data={deductionBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={68}
                        dataKey="value"
                        stroke="none"
                        paddingAngle={3}
                      >
                        {deductionBreakdown.map((e) => (
                          <Cell key={`ded-cell-${e.name}`} fill={e.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        key="ded-tip"
                        formatter={(v: number | string, n: string) => [`${v} payments`, n]}
                        contentStyle={{ fontFamily: F.ui, fontSize: 12, borderRadius: 8 }}
                      />
                    </PieChart>
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%,-50%)",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 14,
                          fontWeight: 700,
                          color: T.crimson,
                        }}
                      >
                        <Money value={rupees(totalDeductions)} gate="payroll" />
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe }}>
                        TOTAL DEDUCTIONS
                      </div>
                    </div>
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                    {deductionBreakdown.map((d) => (
                      <div key={d.name}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 4,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div
                              style={{
                                width: 9,
                                height: 9,
                                borderRadius: "50%",
                                background: d.color,
                              }}
                            />
                            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                              {d.name}
                            </span>
                          </div>
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: 12,
                              fontWeight: 700,
                              color: d.color,
                            }}
                          >
                            {d.value}
                          </span>
                        </div>
                        <TrackBar
                          pct={Math.round((d.value / (payments.length || 1)) * 100)}
                          fill={d.color}
                          height={9}
                          delay={deductionBreakdown.indexOf(d) * 0.08}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ChartCard>
        </div>

        <div
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
          style={{ gap: 22, marginBottom: 28, alignItems: "stretch" }}
        >
          <SilkSumCard
            icon={<Users size={22} color={T.antiqueGold} />}
            label="Total Weavers Paid"
            value={`${cur.weavers} of ${weavers.length}`}
            sub={`${Math.max(weavers.length - cur.weavers, 0)} with no payment in ${periodLabel}`}
            gid="wpr-w"
            delta={pick(metrics, "weavers")}
          />
          <SilkSumCard
            icon={<IndianRupee size={22} color={T.antiqueGold} />}
            label="Total Making Charges"
            value={canSeePayroll ? formatMoney(rupees(totalMakingCharges)) : "••••"}
            sub={`${cur.payments} payment${cur.payments === 1 ? "" : "s"} in ${periodLabel}`}
            gid="wpr-c"
            delta={pick(metrics, "gross")}
          />
          <SilkSumCard
            icon={<TrendingDown size={22} color={T.antiqueGold} />}
            label="Total Deductions"
            value={canSeePayroll ? formatMoney(rupees(totalDeductions)) : "••••"}
            sub="Deducted from making charges"
            gid="wpr-d"
            delta={pick(metrics, "deductions")}
          />
          <SilkSumCard
            icon={<CheckCircle2 size={22} color={T.antiqueGold} />}
            label="Total Net Paid"
            value={canSeePayroll ? formatMoney(rupees(totalNetPaid)) : "••••"}
            sub="After all deductions"
            gid="wpr-n"
            delta={pick(metrics, "net")}
          />
        </div>

        <div
          style={{
            background: "rgba(200,155,71,0.08)",
            border: `1px solid ${T.borderGold}`,
            borderRadius: 10,
            padding: "12px 18px",
            marginBottom: 18,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <BarChart2 size={18} color={T.antiqueGold} />
          <span style={{ fontFamily: F.ui, fontSize: 14, color: "#7B5C18" }}>
            This report is commonly used for payment reconciliation and record keeping. Download as
            Excel for full weaver payment sheet.
          </span>
        </div>

        <FadeUp>
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 12,
              border: `1px solid ${T.borderDef}`,
              overflow: "hidden",
              boxShadow: "0 2px 14px rgba(74,6,27,0.06)",
            }}
          >
            <div className="w-full">
              <div className="min-w-[850px]">
                <DataTable<(typeof weaverPayRows)[number]>
                  columns={[
                    {
                      id: "code",
                      header: "Weaver ID",
                      accessor: (r) => r.code,
                      cell: (_v, r) => (
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 13,
                            color: T.royalBurgundy,
                          }}
                        >
                          {r.code}
                        </span>
                      ),
                    },
                    {
                      id: "name",
                      header: "Weaver Name",
                      accessor: (r) => r.name,
                      cell: (_v, r) => (
                        <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600 }}>
                          {r.name}
                        </span>
                      ),
                    },
                    {
                      id: "totalSarees",
                      header: "Sarees Paid For",
                      accessor: (r) => r.totalSarees,
                      cell: (_v, r) => (
                        <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
                          {r.totalSarees > 0 ? `${r.totalSarees} sarees` : "—"}
                        </span>
                      ),
                    },
                    {
                      id: "amountPaid",
                      header: "Total Paid",
                      accessor: (r) => r.totalPaid,
                      align: "end",
                      cell: (_v, r) => (
                        <span
                          style={{
                            fontFamily: F.display,
                            fontSize: 16,
                            fontWeight: 700,
                            color: r.latest ? T.green : T.taupe,
                          }}
                        >
                          {!r.latest
                            ? "—"
                            : canSeePayroll
                              ? formatMoney(rupees(r.totalPaid))
                              : "••••"}
                        </span>
                      ),
                    },
                    {
                      id: "payments",
                      header: "Payments",
                      accessor: (r) => r.payments,
                      align: "center",
                      cell: (_v, r) => (
                        <span
                          style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: T.taupe }}
                        >
                          {r.payments || "—"}
                        </span>
                      ),
                    },
                    {
                      id: "utr",
                      header: "Latest UTR Number",
                      accessor: (r) => r.latest?.utrNumber,
                      cell: (_v, r) => (
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 12,
                            color: r.latest ? T.green : T.taupe,
                          }}
                        >
                          {r.latest?.utrNumber || "—"}
                        </span>
                      ),
                    },
                    {
                      id: "firmName",
                      header: "Firm Name",
                      accessor: (r) => r.latest?.firmName,
                      cell: (_v, r) => (
                        <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
                          {r.latest?.firmName || "—"}
                        </span>
                      ),
                    },
                    {
                      id: "batchNo",
                      header: "Latest Batch No.",
                      accessor: (r) => r.latest?.batchNo,
                      cell: (_v, r) => (
                        <span
                          style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe }}
                        >
                          {r.latest?.batchNo || "—"}
                        </span>
                      ),
                    },
                    {
                      id: "loomNumber",
                      header: "Loom",
                      accessor: (r) => r.latest?.loomNumber,
                      cell: (_v, r) => (
                        <span
                          style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe }}
                        >
                          {r.latest?.loomNumber || "—"}
                        </span>
                      ),
                    },
                    {
                      id: "deduction",
                      header: "Total Deductions",
                      accessor: (r) => r.totalDeduction,
                      align: "end",
                      cell: (_v, r) => (
                        <span
                          style={{
                            fontFamily: F.ui,
                            fontSize: 13,
                            color: r.totalDeduction ? T.crimson : T.taupe,
                          }}
                        >
                          {r.totalDeduction
                            ? canSeePayroll
                              ? formatMoney(rupees(r.totalDeduction))
                              : "••••"
                            : "—"}
                        </span>
                      ),
                    },
                    {
                      id: "paymentDate",
                      header: "Latest Payment Date",
                      accessor: (r) => r.latest?.paymentDate,
                      sortable: true,
                      sortFn: (a, b) =>
                        (a.latest ? paidOn(a.latest) : "").localeCompare(
                          b.latest ? paidOn(b.latest) : ""
                        ),
                      cell: (_v, r) => (
                        <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
                          {r.latest?.paymentDate ?? "—"}
                        </span>
                      ),
                    },
                  ]}
                  data={weaverPayRows}
                  getRowId={(r) => r.code}
                  loading={weaversLoading}
                  error={!!weaversError}
                  onRetry={() => void refetchWeavers()}
                  pagination
                  itemLabel="weavers"
                />
              </div>
            </div>
          </div>
        </FadeUp>
      </SectionCard>
    </div>
  );
}
