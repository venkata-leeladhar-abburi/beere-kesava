import React, { useMemo, useState } from "react";
import { semantic } from "../../../../design-system/tokens";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp, Factory, CheckCircle2, Boxes, Package, AlertTriangle, Truck, IndianRupee,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { T, F } from "../theme";
import {
  FadeUp, SilkSumCard, SectionCard, ReportDLBar, ChartTip,
  StatusPill,
} from "../common/primitives";
import {
  ChartCard, ChartBand, ChartHint, TrackBar, BAND, CHART, NUM, CountUp
} from "../../../production/components/sections/chart-primitives";
import { batchesApi } from "../../../../shared/api/batches";
import { qcApi } from "../../../../shared/api/qc";
import { weaversApi } from "../../../../shared/api/weavers";
import { reportsApi } from "../../../../shared/api/reports";
import { purchasesApi, BackendPurchase } from "../../../../shared/api/purchases";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { rupees, formatMoney } from "@/lib/domain/money";
import { Money, StatusPill as DomainStatusPill } from "@/shared/ui/domain";
import type { StatusValueOf } from "@/lib/domain/status";
import { useReportPeriod, useRegisterExport } from "../PeriodContext";

// BackendPurchase.status ("PAID" | "PENDING" | "PARTIAL") normalized onto
// the shared payment taxonomy (lib/domain/status.ts) per
// design-system/06-DOMAIN.md Part D.
const PURCHASE_STATUS_KEY: Record<string, StatusValueOf<"payment">> = {
  PAID: "paid",
  PARTIAL: "partial",
  PENDING: "unpaid",
};

// Helper: sortable year-aware week key ("2026-W07") plus its short label
// ("W7"). Keying on the week number alone merged the same week across
// different years and sorted "W10" before "W2".
function getWeekParts(d: Date): { key: string; label: string } {
  const start = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  return { key: `${d.getFullYear()}-W${String(week).padStart(2, "0")}`, label: `W${week}` };
}

// Helper: format date as "DD MMM YYYY"
function fmtDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function ExternalPurchasesSection() {
  const { data: purchasesRes, isLoading, isError } = useQuery({
    queryKey: ["reports", "external-purchases"],
    // "summary" — this table never shows saree photos, and the full view's
    // sareeLines carry every purchase's base64 image data (see
    // ListPurchasesQueryDto.view), which was stalling this request past the
    // client's 30s timeout as more purchases piled up.
    queryFn: () => purchasesApi.list(100, 1, undefined, undefined, "summary"),
  });

  const { inCurrent } = useReportPeriod();
  const rows = useMemo(
    () => (purchasesRes?.items ?? []).filter(r => inCurrent(r.date)),
    [purchasesRes, inCurrent],
  );
  const totalSarees = rows.reduce((s, r) => s + r.sareeCount, 0);
  const totalBill = rows.reduce((s, r) => s + Number(r.billAmount), 0);

  const purchaseColumns: ColumnDef<BackendPurchase>[] = [
    { id: "vendor", header: "Vendor / Supplier", accessor: r => r.supplier.name, cell: (_v, r) => <span style={{ fontFamily: F.ui, fontWeight: 600 }}>{r.supplier.name}</span> },
    {
      id: "location", header: "Location", accessor: r => [r.supplier.city, r.supplier.state].filter(Boolean).join(", "),
      cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{[r.supplier.city, r.supplier.state].filter(Boolean).join(", ") || "—"}</span>,
    },
    { id: "gst", header: "GST Number", accessor: r => r.gstNumber || r.supplier.gstCode, cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{r.gstNumber || r.supplier.gstCode || "—"}</span> },
    { id: "invoice", header: "Invoice Number", accessor: r => r.invoiceNumber, cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.royalBurgundy }}>{r.invoiceNumber || "—"}</span> },
    { id: "billAmount", header: "Bill Amount", accessor: r => r.billAmount, align: "end", cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}><Money value={rupees(Number(r.billAmount))} /></span> },
    { id: "sarees", header: "Sarees", accessor: r => r.sareeCount, align: "center", cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{r.sareeCount}</span> },
    { id: "date", header: "Date", accessor: r => r.date, cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{fmtDate(r.date)}</span> },
    {
      id: "status", header: "Status", accessor: r => r.status, type: "status",
      cell: (_v, r) => <DomainStatusPill taxonomy="payment" status={PURCHASE_STATUS_KEY[r.status] ?? "unpaid"} />,
    },
  ];

  return (
    <FadeUp>
      <div style={{ marginTop: 28 }}>
        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: T.luxuryBrown, marginBottom: 4 }}>External Purchases</div>
        <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginBottom: 14 }}>Sarees purchased ready-made from external suppliers — separate from factory production.</div>

        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 22, marginBottom: 24, alignItems: "stretch" }}>
          <SilkSumCard icon={<Package size={22} color={T.antiqueGold} />} label="Total External Sarees Purchased" value={`${totalSarees} sarees`} sub="All recorded purchases" gid="ep-s" />
          <SilkSumCard icon={<IndianRupee size={22} color={T.antiqueGold} />} label="Total Bill Amount" value={formatMoney(rupees(totalBill))} sub="Across all suppliers" gid="ep-b" />
        </div>

        <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
          <div className="w-full overflow-x-auto">
            <div className="min-w-[900px]">
            <DataTable
              columns={purchaseColumns}
              data={rows}
              getRowId={r => r.id}
              loading={isLoading}
              error={!!isError}
              emptyTitle="No external purchases recorded yet."
              emptyDescription="Add them from the External Purchases page."
            />
          </div>
        </div>
      </div>
      </div>
    </FadeUp>
  );
}

export function SareeProductionReport() {
  const { data: batchesRes, isLoading: batchesLoading, isError: batchesError } = useQuery({ queryKey: ["reports", "batches"], queryFn: () => batchesApi.list() });
  const { data: qcRes, isLoading: qcLoading, isError: qcError } = useQuery({ queryKey: ["reports", "qc"], queryFn: () => qcApi.list() });
  const { data: weaversRes, isLoading: weaversLoading, isError: weaversError } = useQuery({ queryKey: ["reports", "weavers-roster"], queryFn: () => weaversApi.list() });
  const { data: production, isLoading: productionLoading, isError: productionError } = useQuery({ queryKey: ["reports", "production-summary"], queryFn: () => reportsApi.productionSummary() });

  const isLoading = batchesLoading || qcLoading || weaversLoading || productionLoading;
  const isError = batchesError || qcError || weaversError || productionError;

  const { inCurrent } = useReportPeriod();
  // The source chips were static <div>s that highlighted the first option and
  // filtered nothing; they now drive every batch-derived figure below.
  const [source, setSource] = useState<"all" | "factory" | "weaver">("all");

  // Batches are scoped by the selected period, and their rows by the selected
  // production source, once — every chart and table below reads these.
  const scopedBatches = useMemo(() => {
    const keepRow = (recipientType: string | null | undefined) =>
      source === "all" ? true : source === "weaver" ? recipientType === "WEAVER" : recipientType === "FACTORY_LOOM";
    return (batchesRes?.items ?? [])
      .filter(b => inCurrent(b.createdAt))
      .map(b => ({ ...b, rows: b.rows.filter(r => keepRow(r.recipientType)) }))
      .filter(b => b.rows.length > 0);
  }, [batchesRes, inCurrent, source]);

  const scopedQc = useMemo(
    () => (qcRes?.items ?? []).filter(q => inCurrent(q.qcDate)),
    [qcRes, inCurrent],
  );

  // Compute per-weaver production table from real batch rows + QC records
  const prodTableRows = useMemo(() => {
    const batches = scopedBatches;
    const qcBySareeId = new Map(scopedQc.filter(q => q.sareeId).map(q => [q.sareeId, q]));
    const weaverNameById = new Map((weaversRes?.items ?? []).map(w => [w.id, w.name]));
    // Human-facing weaver code ("Ramarao-001") — what the report shows; the
    // UUID is only the grouping key.
    const weaverCodeById = new Map((weaversRes?.items ?? []).map(w => [w.id, w.code]));

    interface Acc { batches: Set<string>; produced: number; passed: number; rejected: number; designs: Set<string>; charges: number }
    const byWeaver = new Map<string, Acc>();
    for (const batch of batches) {
      for (const row of batch.rows) {
        if (row.recipientType !== "WEAVER" || !row.weaverId) continue;
        let acc = byWeaver.get(row.weaverId);
        if (!acc) { acc = { batches: new Set(), produced: 0, passed: 0, rejected: 0, designs: new Set(), charges: 0 }; byWeaver.set(row.weaverId, acc); }
        acc.batches.add(row.batchId);
        acc.produced += 1;
        if (row.designCode) acc.designs.add(row.designCode);
        const qc = row.sareeId ? qcBySareeId.get(row.sareeId) : undefined;
        if (qc) {
          if (qc.result === "PASSED") acc.passed += 1;
          else if (qc.result === "DEFECTIVE") acc.rejected += 1;
          acc.charges += Number(qc.payable);
        }
      }
    }
    return Array.from(byWeaver.entries()).map(([weaverId, acc]) => ({
      code: weaverCodeById.get(weaverId) ?? weaverId,
      name: weaverNameById.get(weaverId) ?? "Unknown Weaver",
      batches: acc.batches.size,
      produced: acc.produced,
      passed: acc.passed,
      rejected: acc.rejected,
      passRate: acc.produced > 0 ? Math.round((acc.passed / acc.produced) * 100) : 0,
      designs: acc.designs.size > 0 ? Array.from(acc.designs).join(", ") : "—",
      charges: acc.charges,
    })).sort((a, b) => b.produced - a.produced);
  }, [scopedBatches, scopedQc, weaversRes]);

  // Compute "Own Factory vs Outsourced" from live batch rows
  const productionSourceData = useMemo(() => {
    const batches = scopedBatches;
    let weaverCount = 0;
    let factoryCount = 0;
    for (const batch of batches) {
      for (const row of batch.rows) {
        if (row.recipientType === "WEAVER") weaverCount++;
        else if (row.recipientType === "FACTORY_LOOM") factoryCount++;
      }
    }
    return [
      { name: "Own Factory", value: factoryCount, fill: "#6E0F2D" },
      { name: "Outsourced (Weavers)", value: weaverCount, fill: "#C89B47" },
    ];
  }, [scopedBatches]);

  const totalSourceSarees = productionSourceData.reduce((s, d) => s + d.value, 0);

  // Compute "Where Sarees Are Right Now" pipeline stages from batch rows + finishing status
  const prodStageData = useMemo(() => {
    const batches = scopedBatches;
    const qcItems = scopedQc;
    const qcSareeIds = new Set(qcItems.map(q => q.sareeId).filter(Boolean));
    const qcPassedIds = new Set(qcItems.filter(q => q.result === "PASSED").map(q => q.sareeId).filter(Boolean));

    let weavingInProgress = 0;
    let waitingQC = 0;
    let qcPassed = 0;
    let qcFailed = 0;

    for (const batch of batches) {
      for (const row of batch.rows) {
        if (!row.sareeId) {
          // No sareeId yet — still being woven
          if (row.recipientType) weavingInProgress++;
          continue;
        }
        if (qcPassedIds.has(row.sareeId!)) {
          qcPassed++;
        } else if (qcSareeIds.has(row.sareeId!)) {
          // Has a QC record but didn't pass — previously counted nowhere,
          // which quietly dropped rejected sarees out of the pipeline.
          qcFailed++;
        } else {
          waitingQC++;
        }
      }
    }

    // finishing stages come from production summary (backend groupBy)
    const assignedToFinishing = production?.finishingByStatus?.["AWAITING_RETURN"] ?? 0;
    const finished = production?.finishingByStatus?.["RETURNED"] ?? 0;
    const dispatched = production?.finishingByStatus?.["DISPATCHED"] ?? 0;

    return [
      { stage: "Dispatched", count: dispatched, color: "#69635E" },
      { stage: "Finished", count: finished, color: "#3B5F4E" },
      { stage: "Assigned to Finishing", count: assignedToFinishing, color: T.darkBurgundy },
      { stage: "Quality Check Passed", count: qcPassed, color: T.green },
      { stage: "Quality Check Failed", count: qcFailed, color: T.crimson },
      { stage: "Waiting Quality Check", count: waitingQC, color: T.royalBurgundy },
      { stage: "Weaving in Progress", count: weavingInProgress, color: T.antiqueGold },
    ];
  }, [scopedBatches, scopedQc, production]);

  // Bars are scaled against the largest stage, not the sum: the stages
  // overlap (a QC-passed saree also appears under finishing/dispatched), so a
  // summed denominator made every percentage a share of a double count.
  const maxPipelineCount = Math.max(1, ...prodStageData.map(d => d.count));

  interface ProdTableRow {
    code: string; name: string; batches: number; produced: number;
    passed: number; rejected: number; passRate: number; designs: string; charges: number;
  }

  useRegisterExport(useMemo(() => ({
    name: "Saree Production Report",
    headers: ["Weaver Code", "Weaver Name", "Batches", "Sarees Produced", "QC Passed", "QC Rejected", "Pass Rate %", "Designs", "Making Charges"],
    rows: prodTableRows.map(r => [r.code, r.name, r.batches, r.produced, r.passed, r.rejected, r.passRate, r.designs, r.charges]),
  }), [prodTableRows]));

  const prodColumns: ColumnDef<ProdTableRow>[] = [
    { id: "code", header: "Weaver Code", accessor: r => r.code, cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: T.royalBurgundy }}>{r.code}</span> },
    { id: "name", header: "Weaver Name", accessor: r => r.name, cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>{r.name}</span> },
    { id: "batches", header: "Batches", accessor: r => r.batches, align: "center" },
    { id: "produced", header: "Sarees Produced", accessor: r => r.produced, align: "center", cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{r.produced}</span> },
    { id: "passed", header: "QC Passed", accessor: r => r.passed, align: "center", cell: (_v, r) => <span style={{ color: T.green, fontFamily: "var(--font-mono)", fontWeight: 700 }}>{r.passed}</span> },
    { id: "rejected", header: "QC Rejected", accessor: r => r.rejected, align: "center", cell: (_v, r) => <span style={{ color: r.rejected > 0 ? T.crimson : T.taupe, fontFamily: "var(--font-mono)", fontWeight: 700 }}>{r.rejected > 0 ? r.rejected : "—"}</span> },
    {
      id: "passRate", header: "Pass Rate", accessor: r => r.passRate, align: "center",
      cell: (_v, r) => <StatusPill label={`${r.passRate}%`} type={r.passRate >= 95 ? "ok" : r.passRate >= 85 ? "warn" : "bad"} />,
    },
    { id: "designs", header: "Designs Worked On", accessor: r => r.designs, cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe }}>{r.designs}</span> },
    { id: "charges", header: "Making Charges", accessor: r => r.charges, align: "end", cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: T.royalBurgundy }}><Money value={rupees(r.charges)} /></span> },
  ];

  // Compute weekly production trend from batch createdAt (last 4 weeks vs prior 4 weeks)
  const prodWeeklyData = useMemo(() => {
    const batches = scopedBatches;

    // Build map of week key -> { label, count of saree rows assigned }
    const weekMap = new Map<string, { label: string; count: number }>();
    for (const batch of batches) {
      const d = new Date(batch.createdAt);
      if (isNaN(d.getTime())) continue;
      const { key, label } = getWeekParts(d);
      for (const row of batch.rows) {
        if (row.recipientType) {
          const entry = weekMap.get(key) ?? { label, count: 0 };
          entry.count += 1;
          weekMap.set(key, entry);
        }
      }
    }

    // The chart compares the last 4 weeks against the 4 weeks before them.
    // Slicing the prior window off the *front* of the same 8-week list meant
    // that with fewer than 8 recorded weeks the "prior" series repeated the
    // current one — so the window is taken explicitly and padded with 0.
    const allKeys = Array.from(weekMap.keys()).sort();
    const recentFour = allKeys.slice(-4);
    const priorFour = allKeys.slice(-8, -4);
    const priorPadded = [...Array(Math.max(0, 4 - priorFour.length)).fill(null), ...priorFour];

    return recentFour.map((key, i) => {
      const offset = 4 - recentFour.length; // right-align short windows
      const priorKey = priorPadded[i + offset];
      return {
        week: weekMap.get(key)!.label,
        current: weekMap.get(key)?.count ?? 0,
        prior: priorKey ? (weekMap.get(priorKey)?.count ?? 0) : 0,
      };
    });
  }, [scopedBatches]);

  // QC donut from production summary (live)
  // Derived from the QC records in scope rather than the backend's all-time
  // summary, so this donut answers the period the page is actually showing.
  const qcDonutData = useMemo(() => [
    { name: "Passed",   value: scopedQc.filter(q => q.result === "PASSED").length,    color: T.green },
    { name: "Semi",     value: scopedQc.filter(q => q.result === "SEMI").length,      color: T.antiqueGold },
    { name: "Rejected", value: scopedQc.filter(q => q.result === "DEFECTIVE").length, color: T.crimson },
  ], [scopedQc]);
  const totalQc = qcDonutData.reduce((s, d) => s + d.value, 0);
  const passRatePct = totalQc > 0 ? Math.round((qcDonutData[0].value / totalQc) * 100) : 0;
  const dispatchedCount = production?.finishingByStatus?.["DISPATCHED"] ?? 0;
  // Counted from the batches in scope. `production.totalSareesProduced` is an
  // all-time backend figure and would ignore both the period and the source
  // filter that every other number on this tab now respects.
  const scopedProduced = useMemo(
    () => scopedBatches.reduce((sum, b) => sum + b.rows.filter(r => r.recipientType).length, 0),
    [scopedBatches],
  );

  return (
    <div id="rep-production" className="px-4 md:px-7 xl:px-10" style={{ paddingTop: 32 }}>
    <SectionCard
      icon={Factory}
      title="Saree Production Report"
      subtitle="Track how many sarees were produced, which weavers produced them, which designs were made, and how many passed or failed quality check."
    >
      <ReportDLBar />

      <div className="flex flex-wrap gap-2.5 mb-6" role="group" aria-label="Filter by production source">
        {([
          { key: "all", label: "All Sources" },
          { key: "factory", label: "Own Factory Only" },
          { key: "weaver", label: "Outsourced Only" },
        ] as const).map(f => {
          const active = source === f.key;
          return (
            <button
              key={f.key} type="button" aria-pressed={active} onClick={() => setSource(f.key)}
              style={{ padding: "5px 14px", borderRadius: 20, cursor: "pointer", fontFamily: F.ui, fontSize: 12, fontWeight: 500, background: active ? T.royalBurgundy : "transparent", color: active ? "#FFF" : T.taupe, border: `1px solid ${active ? T.royalBurgundy : T.borderDef}` }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4" style={{ gap: 20, marginBottom: 24, alignItems: "stretch" }}>
        {/* Weekly production trend — computed from real batch createdAt */}
        <ChartCard>
          <ChartBand tone="output" icon={<TrendingUp size={19} color={BAND.output.icon} />} title="Sarees Produced Each Week" sub="Current vs prior period" />
          <div className="p-5 sm:p-6" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          {prodWeeklyData.length === 0 ? (
            <div style={{ padding: "24px 0", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
              {isLoading ? "Loading…" : "No batch data yet."}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={prodWeeklyData}>
                <CartesianGrid key="prod-wk-grid" strokeDasharray="3 3" stroke="rgba(110,15,45,0.07)" vertical={false} />
                <XAxis key="prod-wk-x" dataKey="week" tick={{ fontFamily: "var(--font-mono)", fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} />
                <YAxis key="prod-wk-y" tick={{ fontFamily: "var(--font-mono)", fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} width={30} />
                <Tooltip key="prod-wk-tip" content={<ChartTip suffix=" sarees" />} />
                <Line key="prod-wk-cur" type="monotone" dataKey="current" name="Current" stroke={T.royalBurgundy} strokeWidth={2.5} dot={{ fill: T.royalBurgundy, r: 4 }} />
                <Line key="prod-wk-pri" type="monotone" dataKey="prior" name="Prior" stroke={semantic.chart.series[1]} strokeWidth={2} strokeDasharray="5 4" dot={{ fill: semantic.chart.series[1], r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 4 }}>
            {[{ c: T.royalBurgundy, l: "Current Period", dash: false }, { c: T.antiqueGold, l: "Prior Period", dash: true }].map(x => (
              <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 18, height: 3, borderRadius: 2, background: x.c, borderTop: x.dash ? `2px dashed ${x.c}` : "none" }} />
                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{x.l}</span>
              </div>
            ))}
          </div>
          </div>
        </ChartCard>

        {/* Pipeline stage counts — computed from real batch + QC + finishing data */}
        <ChartCard>
          <ChartBand tone="pipeline" icon={<Factory size={19} color={BAND.pipeline.icon} />} title="Where Sarees Are Right Now" sub="Pipeline by stage — finishing rows are live, not period-scoped" />
          <div className="p-5 sm:p-6" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          {isLoading ? (
            <div style={{ padding: "24px 0", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Loading…</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "6px 0" }}>
              {prodStageData.map(s => (
                <div key={s.stage}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                    <span style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown }}>{s.stage}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700, color: s.color }}>{s.count}</span>
                  </div>
                  <TrackBar pct={Math.round((s.count / maxPipelineCount) * 100)} fill={s.color} height={9} delay={prodStageData.indexOf(s) * 0.08} />
                </div>
              ))}
            </div>
          )}
          </div>
        </ChartCard>

        {/* QC donut — live from GET /reports/production-summary */}
        <ChartCard>
          <ChartBand tone="orders" icon={<CheckCircle2 size={19} color={BAND.orders.icon} />} title="Quality Check This Period" sub="Pass / reject breakdown" />
          <div className="p-5 sm:p-6" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          {isError ? (
            <div style={{ padding: "20px 0", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.crimson }}>Failed to load QC data.</div>
          ) : (
          <>
          <div style={{ position: "relative" }}>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie key="qc-pie" data={qcDonutData.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={48} outerRadius={70}
                  dataKey="value" stroke="none" paddingAngle={3}>
                  {qcDonutData.filter(d => d.value > 0).map(e => <Cell key={`qc-cell-${e.name}`} fill={e.color} />)}
                </Pie>
                <Tooltip key="qc-tip" formatter={(v: number | string, n: React.ReactNode) => [`${v} sarees`, n]}
                  contentStyle={{ fontFamily: F.ui, fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", pointerEvents: "none" }}>
              <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.green }}>{totalQc > 0 ? `${passRatePct}%` : "—"}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe }}>Pass Rate</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 8px" }}>
            {qcDonutData.filter(d => d.value > 0).map(d => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: d.color }} />
                  <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{d.name}</span>
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: d.color }}>{d.value}</span>
              </div>
            ))}
            {totalQc === 0 && (
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, textAlign: "center" as const }}>No QC records yet.</div>
            )}
          </div>
          </>
          )}
          </div>
        </ChartCard>

        {/* Own Factory vs Outsourced — computed from live batch rows */}
        <ChartCard>
          <ChartBand tone="weavers" icon={<Boxes size={19} color={BAND.weavers.icon} />} title="Own Factory vs Outsourced" sub="Production source split — all batches" />
          <div className="p-5 sm:p-6" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          {isLoading ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Loading…</div>
          ) : totalSourceSarees === 0 ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.ui, fontSize: 13, color: T.taupe }}>No sarees assigned yet.</div>
          ) : (
            <>
              <div style={{ flex: 1, position: "relative", minHeight: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={productionSourceData.filter(d => d.value > 0)} innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" stroke="none">
                      {productionSourceData.filter(d => d.value > 0).map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                  <span style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: T.luxuryBrown }}>{totalSourceSarees}</span>
                  <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Total Sarees</span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
                {productionSourceData.map((s) => (
                  <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.fill, flexShrink: 0 }} />
                    <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, flex: 1 }}>{s.name}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>{s.value}</span>
                    <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>({totalSourceSarees > 0 ? Math.round(s.value / totalSourceSarees * 100) : 0}%)</span>
                  </div>
                ))}
              </div>
            </>
          )}
          </div>
        </ChartCard>
      </div>

      {/* 4 summary cards — live from GET /reports/production-summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4" style={{ gap: 22, marginBottom: 28, alignItems: "stretch" }}>
        <SilkSumCard icon={<Package size={22} color={T.antiqueGold} />} label="Total Sarees Produced" value={`${scopedProduced}`} sub="Batches in the selected period" gid="spr-p" />
        <SilkSumCard icon={<CheckCircle2 size={22} color={T.antiqueGold} />} label="Passed Quality Check" value={`${qcDonutData[0].value}`} sub={totalQc > 0 ? `${passRatePct}% pass rate` : "No QC records yet"} gid="spr-q" />
        <SilkSumCard icon={<AlertTriangle size={22} color={T.antiqueGold} />} label="Rejected at Quality Check" value={`${qcDonutData[2].value}`} sub={totalQc > 0 ? `${Math.round((qcDonutData[2].value / totalQc) * 100)}% rejection rate` : "No QC records yet"} gid="spr-r" />
        <SilkSumCard icon={<Truck size={22} color={T.antiqueGold} />} label="Total Dispatched" value={`${dispatchedCount}`} sub="Live all-time finishing status" gid="spr-d" />
      </div>

      {/* Production table — per-weaver, computed from live batch + QC data */}
      <FadeUp>
        <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
          <div className="w-full overflow-x-auto">
            <div className="min-w-[960px]">
            <DataTable
              columns={prodColumns}
              data={prodTableRows}
              getRowId={r => r.code}
              loading={isLoading}
              error={!!isError}
              emptyTitle="No sarees assigned to weavers yet."
              pagination
            />
          </div>
        </div>
          {prodTableRows.length > 0 && (
            <div style={{ background: T.warmCream, borderTop: `2px solid ${T.borderDef}`, display: "flex", alignItems: "center", padding: "13px 14px", gap: 14 }}>
              <span style={{ fontFamily: F.ui, fontWeight: 700, color: T.luxuryBrown, flex: 1 }}>Totals ({prodTableRows.length} weavers)</span>
              {[
                { label: "Produced", value: `${prodTableRows.reduce((s, r) => s + r.produced, 0)}`, color: T.luxuryBrown },
                { label: "QC Passed", value: `${prodTableRows.reduce((s, r) => s + r.passed, 0)}`, color: T.green },
                { label: "QC Rejected", value: `${prodTableRows.reduce((s, r) => s + r.rejected, 0)}`, color: T.crimson },
                { label: "Making Charges", value: formatMoney(rupees(prodTableRows.reduce((s, r) => s + r.charges, 0))), color: T.royalBurgundy },
              ].map(t => (
                <span key={t.label} style={{ textAlign: "right" }}>
                  <span style={{ display: "block", fontFamily: "var(--font-mono)", fontWeight: 700, color: t.color }}>{t.value}</span>
                  <span style={{ display: "block", fontFamily: F.ui, fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.8px", color: T.taupe }}>{t.label}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </FadeUp>

      <ExternalPurchasesSection />
    </SectionCard>
    </div>
  );
}
