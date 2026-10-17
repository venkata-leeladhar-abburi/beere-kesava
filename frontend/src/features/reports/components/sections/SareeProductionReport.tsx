import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  Factory,
  CheckCircle2,
  Boxes,
  Package,
  AlertTriangle,
  Truck,
  IndianRupee,
} from "lucide-react";
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { T, F } from "../theme";
import { FadeUp, SilkSumCard, SectionCard, ReportDLBar, StatusPill } from "../common/primitives";
import { CompareStrip, metric, pick } from "../common/compare";
import { TrendChart } from "../common/TrendChart";
import { ChartCard, ChartBand, TrackBar, BAND } from "@/features/production";
import { batchesApi } from "../../../../shared/api/batches";
import { qcApi, type BackendQcRecord } from "../../../../shared/api/qc";
import { weaversApi } from "../../../../shared/api/weavers";
import { reportsApi } from "../../../../shared/api/reports";
import { ratesApi } from "../../../../shared/api/rates";
import { purchasesApi, BackendPurchase } from "../../../../shared/api/purchases";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { rupees, formatMoney } from "@/lib/domain/money";
import { Money, StatusPill as DomainStatusPill } from "@/shared/ui/domain";
import type { StatusValueOf } from "@/lib/domain/status";
import { useReportPeriod, useRegisterExport, usePeriodSplit } from "../PeriodContext";
import { buildSeries, bucketPhrase } from "../timeSeries";
import { latestVerdicts } from "../reportMath";

// BackendPurchase.status ("PAID" | "PENDING" | "PARTIAL") normalized onto
// the shared payment taxonomy (lib/domain/status.ts) per
// design-system/06-DOMAIN.md Part D.
const PURCHASE_STATUS_KEY: Record<string, StatusValueOf<"payment">> = {
  PAID: "paid",
  PARTIAL: "partial",
  PENDING: "unpaid",
};

type Source = "all" | "factory" | "weaver";

const qcMatchesSource = (q: BackendQcRecord, source: Source) =>
  source === "all" ? true : source === "weaver" ? !!q.weaverId : !!q.factoryLoomId;

function qcSummary(records: BackendQcRecord[]) {
  const verdicts = latestVerdicts(records);
  const passed = verdicts.filter((q) => q.result === "PASSED").length;
  const semi = verdicts.filter((q) => q.result === "SEMI").length;
  const rejected = verdicts.filter((q) => q.result === "DEFECTIVE").length;
  const checked = verdicts.length;
  return {
    checked,
    passed,
    semi,
    rejected,
    passRate: checked > 0 ? (passed / checked) * 100 : 0,
    rejectRate: checked > 0 ? (rejected / checked) * 100 : 0,
    payable: verdicts.reduce((s, q) => s + Number(q.payable || 0), 0),
  };
}

/** The external-purchases list, shared by its table and the report's export. */
function useExternalPurchases() {
  return useQuery({
    queryKey: ["reports", "external-purchases"],
    // "summary" — this table never shows saree photos, and the full view's
    // sareeLines carry every purchase's base64 image data (see
    // ListPurchasesQueryDto.view), which was stalling this request past the
    // client's 30s timeout as more purchases piled up.
    queryFn: () => purchasesApi.listAll("summary"),
  });
}

// Helper: format date as "DD MMM YYYY"
function fmtDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function ExternalPurchasesSection() {
  const { data: purchasesRes, isLoading, isError } = useExternalPurchases();

  const { compareActive, label: periodLabel } = useReportPeriod();
  const split = usePeriodSplit(purchasesRes, (r) => r.date);
  const rows = split.cur;
  const totalSarees = rows.reduce((s, r) => s + r.sareeCount, 0);
  const totalBill = rows.reduce((s, r) => s + Number(r.billAmount), 0);
  const priorSarees = split.prev.reduce((s, r) => s + r.sareeCount, 0);
  const priorBill = split.prev.reduce((s, r) => s + Number(r.billAmount), 0);
  const sareesDelta = metric(
    "ext-sarees",
    "External sarees",
    "count",
    totalSarees,
    compareActive ? priorSarees : null,
    "neutral"
  );
  const billDelta = metric(
    "ext-bill",
    "Bill amount",
    "money",
    totalBill,
    compareActive ? priorBill : null,
    "neutral",
    "cost"
  );

  const purchaseColumns: ColumnDef<BackendPurchase>[] = [
    {
      id: "vendor",
      header: "Vendor / Supplier",
      accessor: (r) => r.supplier?.name ?? "—",
      cell: (_v, r) => (
        <span style={{ fontFamily: F.ui, fontWeight: 600 }}>{r.supplier?.name ?? "—"}</span>
      ),
    },
    {
      id: "location",
      header: "Location",
      accessor: (r) => [r.supplier?.city, r.supplier?.state].filter(Boolean).join(", "),
      cell: (_v, r) => (
        <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
          {[r.supplier?.city, r.supplier?.state].filter(Boolean).join(", ") || "—"}
        </span>
      ),
    },
    {
      id: "gst",
      header: "GST Number",
      accessor: (r) => r.gstNumber || r.supplier?.gstCode,
      cell: (_v, r) => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
          {r.gstNumber || r.supplier?.gstCode || "—"}
        </span>
      ),
    },
    {
      id: "invoice",
      header: "Invoice Number",
      accessor: (r) => r.invoiceNumber,
      cell: (_v, r) => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.royalBurgundy }}>
          {r.invoiceNumber || "—"}
        </span>
      ),
    },
    {
      id: "billAmount",
      header: "Bill Amount",
      accessor: (r) => r.billAmount,
      align: "end",
      cell: (_v, r) => (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
          <Money value={rupees(Number(r.billAmount))} />
        </span>
      ),
    },
    {
      id: "sarees",
      header: "Sarees",
      accessor: (r) => r.sareeCount,
      align: "center",
      cell: (_v, r) => (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{r.sareeCount}</span>
      ),
    },
    {
      id: "date",
      header: "Date",
      accessor: (r) => r.date,
      cell: (_v, r) => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{fmtDate(r.date)}</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      accessor: (r) => r.status,
      type: "status",
      cell: (_v, r) => (
        <DomainStatusPill taxonomy="payment" status={PURCHASE_STATUS_KEY[r.status] ?? "unpaid"} />
      ),
    },
  ];

  return (
    <FadeUp>
      <div style={{ marginTop: 28 }}>
        <div
          style={{
            fontFamily: F.display,
            fontWeight: 700,
            fontSize: 18,
            color: T.luxuryBrown,
            marginBottom: 4,
          }}
        >
          External Purchases
        </div>
        <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginBottom: 14 }}>
          Sarees purchased ready-made from external suppliers — separate from factory production.
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-2"
          style={{ gap: 22, marginBottom: 24, alignItems: "stretch" }}
        >
          <SilkSumCard
            icon={<Package size={22} color={T.antiqueGold} />}
            label="Total External Sarees Purchased"
            value={`${totalSarees} sarees`}
            sub={`${rows.length} purchase${rows.length === 1 ? "" : "s"} in ${periodLabel}`}
            gid="ep-s"
            delta={sareesDelta}
          />
          <SilkSumCard
            icon={<IndianRupee size={22} color={T.antiqueGold} />}
            label="Total Bill Amount"
            value={formatMoney(rupees(totalBill))}
            sub={`Across ${new Set(rows.map((r) => r.supplier?.name ?? r.id)).size} suppliers`}
            gid="ep-b"
            delta={billDelta}
          />
        </div>

        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 12,
            border: `1px solid ${T.borderDef}`,
            overflow: "hidden",
            boxShadow: "0 2px 14px rgba(74,6,27,0.06)",
          }}
        >
          <div className="w-full overflow-x-auto">
            <div className="min-w-[900px]">
              <DataTable
                columns={purchaseColumns}
                data={rows}
                getRowId={(r) => r.id}
                loading={isLoading}
                error={!!isError}
                emptyTitle={`No external purchases in ${periodLabel}.`}
                emptyDescription="Add them from the External Purchases page."
                pagination
                itemLabel="purchases"
              />
            </div>
          </div>
        </div>
      </div>
    </FadeUp>
  );
}

export function SareeProductionReport() {
  const {
    data: batchesRes,
    isLoading: batchesLoading,
    isError: batchesError,
  } = useQuery({ queryKey: ["reports", "batches"], queryFn: () => batchesApi.list() });
  const {
    data: qcRes,
    isLoading: qcLoading,
    isError: qcError,
    // Every QC record — a single 500-row page silently capped the counts.
  } = useQuery({ queryKey: ["reports", "qc-all"], queryFn: () => qcApi.listAll() });
  const {
    data: weaversRes,
    isLoading: weaversLoading,
    isError: weaversError,
  } = useQuery({ queryKey: ["reports", "weavers-roster"], queryFn: () => weaversApi.list() });
  const {
    data: production,
    isLoading: productionLoading,
    isError: productionError,
  } = useQuery({
    queryKey: ["reports", "production-summary"],
    queryFn: () => reportsApi.productionSummary(),
  });
  // Saree-type codes on batch rows carry no human name; rates is the roster
  // that maps a code ("KS") to its type ("Kanchi Silk").
  const { data: rates } = useQuery({
    queryKey: ["reports", "saree-types-all"],
    queryFn: () => ratesApi.listAll(),
  });
  const { data: purchases } = useExternalPurchases();

  const isLoading = batchesLoading || qcLoading || weaversLoading || productionLoading;
  const isError = batchesError || qcError || weaversError || productionError;

  const {
    current,
    prior,
    compareActive,
    label: periodLabel,
    compareLabel,
    priorLabel,
  } = useReportPeriod();
  // The source chips were static <div>s that highlighted the first option and
  // filtered nothing; they now drive every figure below, QC included.
  const [source, setSource] = useState<Source>("all");

  // Batch rows filtered by the selected production source, before any period.
  const sourcedBatches = useMemo(() => {
    const keepRow = (recipientType: string | null | undefined) =>
      source === "all"
        ? true
        : source === "weaver"
          ? recipientType === "WEAVER"
          : recipientType === "FACTORY_LOOM";
    return (batchesRes?.items ?? [])
      .map((b) => ({ ...b, rows: b.rows.filter((r) => keepRow(r.recipientType)) }))
      .filter((b) => b.rows.length > 0);
  }, [batchesRes, source]);
  const sourcedQc = useMemo(
    () => (qcRes ?? []).filter((q) => qcMatchesSource(q, source)),
    [qcRes, source]
  );

  // Scoped by the selected period once — every chart and table below reads these.
  const batchSplit = usePeriodSplit(sourcedBatches, (b) => b.createdAt);
  const qcSplit = usePeriodSplit(sourcedQc, (q) => q.qcDate);
  const scopedBatches = batchSplit.cur;
  const scopedQc = qcSplit.cur;

  // Compute per-weaver production table from real batch rows + QC records
  const prodTableRows = useMemo(() => {
    const batches = scopedBatches;
    // The newest verdict per saree — building the map straight from the
    // newest-first list let older rework rounds overwrite the final verdict.
    const qcBySareeId = new Map(latestVerdicts(scopedQc).map((q) => [q.sareeId, q]));
    const weaverNameById = new Map((weaversRes?.items ?? []).map((w) => [w.id, w.name]));
    // Human-facing weaver code ("Ramarao-001") — what the report shows; the
    // UUID is only the grouping key.
    const weaverCodeById = new Map((weaversRes?.items ?? []).map((w) => [w.id, w.code]));

    const typeNameByCode = new Map((rates ?? []).map((r) => [r.code, r.type]));

    interface Acc {
      batches: Set<string>;
      produced: number;
      passed: number;
      rejected: number;
      sareeTypes: Set<string>;
      charges: number;
    }
    const byWeaver = new Map<string, Acc>();
    for (const batch of batches) {
      for (const row of batch.rows) {
        if (row.recipientType !== "WEAVER" || !row.weaverId) continue;
        let acc = byWeaver.get(row.weaverId);
        if (!acc) {
          acc = {
            batches: new Set(),
            produced: 0,
            passed: 0,
            rejected: 0,
            sareeTypes: new Set(),
            charges: 0,
          };
          byWeaver.set(row.weaverId, acc);
        }
        acc.batches.add(row.batchId);
        acc.produced += 1;
        if (row.sareeTypeCode) {
          const name = typeNameByCode.get(row.sareeTypeCode);
          acc.sareeTypes.add(name ? `${name} · ${row.sareeTypeCode}` : row.sareeTypeCode);
        }
        const qc = row.sareeId ? qcBySareeId.get(row.sareeId) : undefined;
        if (qc) {
          if (qc.result === "PASSED") acc.passed += 1;
          else if (qc.result === "DEFECTIVE") acc.rejected += 1;
          acc.charges += Number(qc.payable);
        }
      }
    }
    return Array.from(byWeaver.entries())
      .map(([weaverId, acc]) => ({
        code: weaverCodeById.get(weaverId) ?? weaverId,
        name: weaverNameById.get(weaverId) ?? "Unknown Weaver",
        batches: acc.batches.size,
        produced: acc.produced,
        passed: acc.passed,
        rejected: acc.rejected,
        passRate: acc.produced > 0 ? Math.round((acc.passed / acc.produced) * 100) : 0,
        sareeTypes: acc.sareeTypes.size > 0 ? Array.from(acc.sareeTypes).join(", ") : "—",
        charges: acc.charges,
      }))
      .sort((a, b) => b.produced - a.produced);
  }, [scopedBatches, scopedQc, weaversRes, rates]);

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
    const qcItems = latestVerdicts(scopedQc);
    const qcSareeIds = new Set(qcItems.map((q) => q.sareeId).filter(Boolean));
    const qcPassedIds = new Set(
      qcItems
        .filter((q) => q.result === "PASSED")
        .map((q) => q.sareeId)
        .filter(Boolean)
    );

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
  const maxPipelineCount = Math.max(1, ...prodStageData.map((d) => d.count));

  interface ProdTableRow {
    code: string;
    name: string;
    batches: number;
    produced: number;
    passed: number;
    rejected: number;
    passRate: number;
    sareeTypes: string;
    charges: number;
  }

  const prodColumns: ColumnDef<ProdTableRow>[] = [
    {
      id: "code",
      header: "Weaver Code",
      accessor: (r) => r.code,
      cell: (_v, r) => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: T.royalBurgundy }}>
          {r.code}
        </span>
      ),
    },
    {
      id: "name",
      header: "Weaver Name",
      accessor: (r) => r.name,
      cell: (_v, r) => (
        <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>
          {r.name}
        </span>
      ),
    },
    { id: "batches", header: "Batches", accessor: (r) => r.batches, align: "center" },
    {
      id: "produced",
      header: "Sarees Produced",
      accessor: (r) => r.produced,
      align: "center",
      cell: (_v, r) => (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{r.produced}</span>
      ),
    },
    {
      id: "passed",
      header: "QC Passed",
      accessor: (r) => r.passed,
      align: "center",
      cell: (_v, r) => (
        <span style={{ color: T.green, fontFamily: "var(--font-mono)", fontWeight: 700 }}>
          {r.passed}
        </span>
      ),
    },
    {
      id: "rejected",
      header: "QC Rejected",
      accessor: (r) => r.rejected,
      align: "center",
      cell: (_v, r) => (
        <span
          style={{
            color: r.rejected > 0 ? T.crimson : T.taupe,
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
          }}
        >
          {r.rejected > 0 ? r.rejected : "—"}
        </span>
      ),
    },
    {
      id: "passRate",
      header: "Pass Rate",
      accessor: (r) => r.passRate,
      align: "center",
      cell: (_v, r) => (
        <StatusPill
          label={`${r.passRate}%`}
          type={r.passRate >= 95 ? "ok" : r.passRate >= 85 ? "warn" : "bad"}
        />
      ),
    },
    {
      id: "sareeTypes",
      header: "Saree Type / Code",
      accessor: (r) => r.sareeTypes,
      cell: (_v, r) => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe }}>
          {r.sareeTypes}
        </span>
      ),
    },
    {
      id: "charges",
      header: "Making Charges",
      accessor: (r) => r.charges,
      align: "end",
      cell: (_v, r) => (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: T.royalBurgundy }}>
          <Money value={rupees(r.charges)} />
        </span>
      ),
    },
  ];

  // Sarees assigned over the period, bucketed to its length, with the prior
  // period lined up alongside when comparing.
  const assignedRows = useMemo(
    () => ({
      cur: scopedBatches.flatMap((b) =>
        b.rows.filter((r) => r.recipientType).map(() => b.createdAt)
      ),
      prev: batchSplit.prev.flatMap((b) =>
        b.rows.filter((r) => r.recipientType).map(() => b.createdAt)
      ),
    }),
    [scopedBatches, batchSplit.prev]
  );
  const prodSeries = useMemo(
    () =>
      buildSeries({
        current,
        prior,
        currentItems: assignedRows.cur,
        priorItems: assignedRows.prev,
        dateOf: (d) => d,
      }),
    [current, prior, assignedRows]
  );

  // Derived from the QC records in scope rather than the backend's all-time
  // summary, so this donut answers the period (and source) the page shows.
  const qcCur = useMemo(() => qcSummary(scopedQc), [scopedQc]);
  const qcPri = useMemo(
    () => (compareActive ? qcSummary(qcSplit.prev) : null),
    [compareActive, qcSplit.prev]
  );
  const qcDonutData = [
    { name: "Passed", value: qcCur.passed, color: T.green },
    { name: "Semi", value: qcCur.semi, color: T.antiqueGold },
    { name: "Rejected", value: qcCur.rejected, color: T.crimson },
  ];
  const totalQc = qcCur.checked;
  const passRatePct = Math.round(qcCur.passRate);
  const dispatchedCount = production?.finishingByStatus?.["DISPATCHED"] ?? 0;
  // Counted from the batches in scope. `production.totalSareesProduced` is an
  // all-time backend figure and would ignore both the period and the source
  // filter that every other number on this tab now respects.
  const scopedProduced = assignedRows.cur.length;

  const metrics = useMemo(
    () => [
      metric(
        "produced",
        "Sarees assigned",
        "count",
        scopedProduced,
        compareActive ? assignedRows.prev.length : null
      ),
      metric(
        "batches",
        "Batches",
        "count",
        scopedBatches.length,
        compareActive ? batchSplit.prev.length : null
      ),
      metric("checked", "Sarees quality-checked", "count", qcCur.checked, qcPri?.checked),
      metric("passed", "Passed QC", "count", qcCur.passed, qcPri?.passed),
      metric("semi", "Semi (rework)", "count", qcCur.semi, qcPri?.semi, "down"),
      metric("rejected", "Rejected at QC", "count", qcCur.rejected, qcPri?.rejected, "down"),
      metric("passRate", "Pass rate", "percent", qcCur.passRate, qcPri?.passRate),
      metric(
        "payable",
        "Making charges payable",
        "money",
        qcCur.payable,
        qcPri?.payable,
        "neutral",
        "payroll"
      ),
    ],
    [
      scopedProduced,
      assignedRows.prev.length,
      scopedBatches.length,
      batchSplit.prev.length,
      qcCur,
      qcPri,
      compareActive,
    ]
  );

  const purchaseRows = usePeriodSplit(purchases, (r) => r.date).cur;
  const weaverNameById = useMemo(
    () => new Map((weaversRes?.items ?? []).map((w) => [w.id, `${w.name} (${w.code})`])),
    [weaversRes]
  );

  useRegisterExport(
    useMemo(
      () => ({
        name: "Saree Production Report",
        sheetName: "By Weaver",
        headers: [
          "Weaver Code",
          "Weaver Name",
          "Batches",
          "Sarees Produced",
          "QC Passed",
          "QC Rejected",
          "Pass Rate %",
          "Saree Type / Code",
          "Making Charges",
        ],
        columns: [
          "text",
          "text",
          "number",
          "number",
          "number",
          "number",
          "percent",
          "text",
          "money",
        ],
        totals: true,
        rows: prodTableRows.map((r) => [
          r.code,
          r.name,
          r.batches,
          r.produced,
          r.passed,
          r.rejected,
          r.passRate,
          r.sareeTypes,
          r.charges,
        ]),
        extraSheets: [
          {
            name: "QC Results",
            headers: [
              "Saree ID",
              "QC Date",
              "Result",
              "Weaver / Loom",
              "Batch",
              "Defects",
              "Making Charge",
              "Deduction",
              "Payable",
            ],
            columns: ["text", "date", "text", "text", "text", "text", "money", "money", "money"],
            totals: true,
            rows: latestVerdicts(scopedQc)
              .sort((a, b) => b.qcDate.localeCompare(a.qcDate))
              .map((q) => [
                q.sareeId,
                q.qcDate,
                q.result === "DEFECTIVE" ? "Rejected" : q.result === "SEMI" ? "Semi" : "Passed",
                q.weaverId
                  ? (weaverNameById.get(q.weaverId) ?? "Weaver")
                  : q.factoryLoomId
                    ? "Factory loom"
                    : "—",
                q.batchId ?? "—",
                q.defects.join(", "),
                Number(q.makingCharge || 0),
                Number(q.deduction || 0),
                Number(q.payable || 0),
              ]),
          },
          {
            name: "External Purchases",
            headers: ["Supplier", "Invoice", "Date", "Sarees", "Bill Amount", "Status"],
            columns: ["text", "text", "date", "number", "money", "text"],
            totals: true,
            rows: purchaseRows.map((p) => [
              p.supplier?.name ?? "—",
              p.invoiceNumber || "—",
              p.date,
              p.sareeCount,
              Number(p.billAmount),
              p.status === "PAID" ? "Paid" : p.status === "PARTIAL" ? "Partially paid" : "Pending",
            ]),
          },
        ],
        metrics,
        ready: !isLoading,
      }),
      [prodTableRows, scopedQc, weaverNameById, purchaseRows, metrics, isLoading]
    )
  );

  return (
    <div id="rep-production" className="px-4 md:px-7 xl:px-10" style={{ paddingTop: 32 }}>
      <SectionCard
        icon={Factory}
        title="Saree Production Report"
        subtitle="Track how many sarees were produced, which weavers produced them, which saree types were made, and how many passed or failed quality check."
      >
        <ReportDLBar />
        <CompareStrip metrics={metrics} />

        <div
          className="flex flex-wrap gap-2.5 mb-6"
          role="group"
          aria-label="Filter by production source"
        >
          {(
            [
              { key: "all", label: "All Sources" },
              { key: "factory", label: "Own Factory Only" },
              { key: "weaver", label: "Outsourced Only" },
            ] as const
          ).map((f) => {
            const active = source === f.key;
            return (
              <button
                key={f.key}
                type="button"
                aria-pressed={active}
                onClick={() => setSource(f.key)}
                style={{
                  padding: "5px 14px",
                  borderRadius: 20,
                  cursor: "pointer",
                  fontFamily: F.ui,
                  fontSize: 12,
                  fontWeight: 500,
                  background: active ? T.royalBurgundy : "transparent",
                  color: active ? "#FFF" : T.taupe,
                  border: `1px solid ${active ? T.royalBurgundy : T.borderDef}`,
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
          style={{ gap: 20, marginBottom: 24, alignItems: "stretch" }}
        >
          {/* Production trend — sarees assigned, bucketed to the period */}
          <ChartCard>
            <ChartBand
              tone="output"
              icon={<TrendingUp size={19} color={BAND.output.icon} />}
              title="Sarees Produced Over Time"
              sub={`${compareLabel ?? periodLabel} — ${bucketPhrase(prodSeries.bucket)}`}
            />
            <div
              className="p-5 sm:p-6"
              style={{ display: "flex", flexDirection: "column", flex: 1 }}
            >
              <TrendChart
                points={prodSeries.points}
                unit="count"
                kind="line"
                height={200}
                currentName={compareLabel ?? periodLabel}
                priorName={priorLabel}
                emptyText={isLoading ? "Loading…" : `No sarees assigned in ${periodLabel}.`}
              />
            </div>
          </ChartCard>

          {/* Pipeline stage counts — computed from real batch + QC + finishing data */}
          <ChartCard>
            <ChartBand
              tone="pipeline"
              icon={<Factory size={19} color={BAND.pipeline.icon} />}
              title="Where Sarees Are Right Now"
              sub="Pipeline by stage — finishing rows are live, not period-scoped"
            />
            <div
              className="p-5 sm:p-6"
              style={{ display: "flex", flexDirection: "column", flex: 1 }}
            >
              {isLoading ? (
                <div
                  style={{
                    padding: "24px 0",
                    textAlign: "center" as const,
                    fontFamily: F.ui,
                    fontSize: 13,
                    color: T.taupe,
                  }}
                >
                  Loading…
                </div>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10, padding: "6px 0" }}
                >
                  {prodStageData.map((s) => (
                    <div key={s.stage}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
                          marginBottom: 4,
                        }}
                      >
                        <span style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown }}>
                          {s.stage}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 14,
                            fontWeight: 700,
                            color: s.color,
                          }}
                        >
                          {s.count}
                        </span>
                      </div>
                      <TrackBar
                        pct={Math.round((s.count / maxPipelineCount) * 100)}
                        fill={s.color}
                        height={9}
                        delay={prodStageData.indexOf(s) * 0.08}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ChartCard>

          {/* QC donut — live from GET /reports/production-summary */}
          <ChartCard>
            <ChartBand
              tone="orders"
              icon={<CheckCircle2 size={19} color={BAND.orders.icon} />}
              title="Quality Check This Period"
              sub="Final verdict per saree"
            />
            <div
              className="p-5 sm:p-6"
              style={{ display: "flex", flexDirection: "column", flex: 1 }}
            >
              {isError ? (
                <div
                  style={{
                    padding: "20px 0",
                    textAlign: "center" as const,
                    fontFamily: F.ui,
                    fontSize: 13,
                    color: T.crimson,
                  }}
                >
                  Failed to load QC data.
                </div>
              ) : (
                <>
                  <div style={{ position: "relative" }}>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie
                          key="qc-pie"
                          data={qcDonutData.filter((d) => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={48}
                          outerRadius={70}
                          dataKey="value"
                          stroke="none"
                          paddingAngle={3}
                        >
                          {qcDonutData
                            .filter((d) => d.value > 0)
                            .map((e) => (
                              <Cell key={`qc-cell-${e.name}`} fill={e.color} />
                            ))}
                        </Pie>
                        <Tooltip
                          key="qc-tip"
                          formatter={(v: number | string, n: React.ReactNode) => [`${v} sarees`, n]}
                          contentStyle={{ fontFamily: F.ui, fontSize: 12, borderRadius: 8 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%,-50%)",
                        textAlign: "center",
                        pointerEvents: "none",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: F.display,
                          fontSize: 20,
                          fontWeight: 700,
                          color: T.green,
                        }}
                      >
                        {totalQc > 0 ? `${passRatePct}%` : "—"}
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe }}>
                        Pass Rate
                      </div>
                    </div>
                  </div>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 8px" }}
                  >
                    {qcDonutData
                      .filter((d) => d.value > 0)
                      .map((d) => (
                        <div
                          key={d.name}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
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
                            <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
                              {d.name}
                            </span>
                          </div>
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: 13,
                              fontWeight: 700,
                              color: d.color,
                            }}
                          >
                            {d.value}
                          </span>
                        </div>
                      ))}
                    {totalQc === 0 && (
                      <div
                        style={{
                          fontFamily: F.ui,
                          fontSize: 13,
                          color: T.taupe,
                          textAlign: "center" as const,
                        }}
                      >
                        No sarees quality-checked in {periodLabel}.
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </ChartCard>

          {/* Own Factory vs Outsourced — computed from live batch rows */}
          <ChartCard>
            <ChartBand
              tone="weavers"
              icon={<Boxes size={19} color={BAND.weavers.icon} />}
              title="Own Factory vs Outsourced"
              sub={`Production source split — ${periodLabel}`}
            />
            <div
              className="p-5 sm:p-6"
              style={{ display: "flex", flexDirection: "column", flex: 1 }}
            >
              {isLoading ? (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: F.ui,
                    fontSize: 13,
                    color: T.taupe,
                  }}
                >
                  Loading…
                </div>
              ) : totalSourceSarees === 0 ? (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: F.ui,
                    fontSize: 13,
                    color: T.taupe,
                  }}
                >
                  No sarees assigned yet.
                </div>
              ) : (
                <>
                  <div style={{ flex: 1, position: "relative", minHeight: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={productionSourceData.filter((d) => d.value > 0)}
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {productionSourceData
                            .filter((d) => d.value > 0)
                            .map((entry) => (
                              <Cell key={entry.name} fill={entry.fill} />
                            ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: F.display,
                          fontSize: 24,
                          fontWeight: 700,
                          color: T.luxuryBrown,
                        }}
                      >
                        {totalSourceSarees}
                      </span>
                      <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                        Total Sarees
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
                    {productionSourceData.map((s) => (
                      <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: s.fill,
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, flex: 1 }}
                        >
                          {s.name}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 13,
                            fontWeight: 700,
                            color: T.luxuryBrown,
                          }}
                        >
                          {s.value}
                        </span>
                        <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                          (
                          {totalSourceSarees > 0
                            ? Math.round((s.value / totalSourceSarees) * 100)
                            : 0}
                          %)
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </ChartCard>
        </div>

        {/* 4 summary cards — live from GET /reports/production-summary */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
          style={{ gap: 22, marginBottom: 28, alignItems: "stretch" }}
        >
          <SilkSumCard
            icon={<Package size={22} color={T.antiqueGold} />}
            label="Total Sarees Produced"
            value={`${scopedProduced}`}
            sub={`${scopedBatches.length} batch${scopedBatches.length === 1 ? "" : "es"} in ${periodLabel}`}
            gid="spr-p"
            delta={pick(metrics, "produced")}
          />
          <SilkSumCard
            icon={<CheckCircle2 size={22} color={T.antiqueGold} />}
            label="Passed Quality Check"
            value={`${qcCur.passed}`}
            sub={totalQc > 0 ? `${passRatePct}% pass rate` : "No QC records yet"}
            gid="spr-q"
            delta={pick(metrics, "passed")}
          />
          <SilkSumCard
            icon={<AlertTriangle size={22} color={T.antiqueGold} />}
            label="Rejected at Quality Check"
            value={`${qcCur.rejected}`}
            sub={
              totalQc > 0 ? `${Math.round(qcCur.rejectRate)}% rejection rate` : "No QC records yet"
            }
            gid="spr-r"
            delta={pick(metrics, "rejected")}
          />
          <SilkSumCard
            icon={<Truck size={22} color={T.antiqueGold} />}
            label="Total Dispatched"
            value={`${dispatchedCount}`}
            sub="Live all-time finishing status"
            gid="spr-d"
          />
        </div>

        {/* Production table — per-weaver, computed from live batch + QC data */}
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
            <div className="w-full overflow-x-auto">
              <div className="min-w-[960px]">
                <DataTable
                  columns={prodColumns}
                  data={prodTableRows}
                  getRowId={(r) => r.code}
                  loading={isLoading}
                  error={!!isError}
                  emptyTitle="No sarees assigned to weavers yet."
                  pagination
                />
              </div>
            </div>
            {prodTableRows.length > 0 && (
              <div
                style={{
                  background: T.warmCream,
                  borderTop: `2px solid ${T.borderDef}`,
                  display: "flex",
                  alignItems: "center",
                  padding: "13px 14px",
                  gap: 14,
                }}
              >
                <span style={{ fontFamily: F.ui, fontWeight: 700, color: T.luxuryBrown, flex: 1 }}>
                  Totals ({prodTableRows.length} weavers)
                </span>
                {[
                  {
                    label: "Produced",
                    value: `${prodTableRows.reduce((s, r) => s + r.produced, 0)}`,
                    color: T.luxuryBrown,
                  },
                  {
                    label: "QC Passed",
                    value: `${prodTableRows.reduce((s, r) => s + r.passed, 0)}`,
                    color: T.green,
                  },
                  {
                    label: "QC Rejected",
                    value: `${prodTableRows.reduce((s, r) => s + r.rejected, 0)}`,
                    color: T.crimson,
                  },
                  {
                    label: "Making Charges",
                    value: formatMoney(rupees(prodTableRows.reduce((s, r) => s + r.charges, 0))),
                    color: T.royalBurgundy,
                  },
                ].map((t) => (
                  <span key={t.label} style={{ textAlign: "right" }}>
                    <span
                      style={{
                        display: "block",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 700,
                        color: t.color,
                      }}
                    >
                      {t.value}
                    </span>
                    <span
                      style={{
                        display: "block",
                        fontFamily: F.ui,
                        fontSize: 9.5,
                        textTransform: "uppercase",
                        letterSpacing: "0.8px",
                        color: T.taupe,
                      }}
                    >
                      {t.label}
                    </span>
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
