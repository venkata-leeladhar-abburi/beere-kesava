import React, { useMemo } from "react";
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
  FadeUp, ChartCard, SumCard, SectionCard, ReportDLBar, ChartTip, AnimBar,
  TablePager, StatusPill,
} from "../common/primitives";
import { batchesApi } from "../../../../shared/api/batches";
import { qcApi } from "../../../../shared/api/qc";
import { weaversApi } from "../../../../shared/api/weavers";
import { reportsApi } from "../../../../shared/api/reports";
import { purchasesApi, BackendPurchase } from "../../../../shared/api/purchases";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { rupees, formatMoney } from "@/lib/domain/money";
import { Money, StatusPill as DomainStatusPill } from "@/shared/ui/domain";
import type { StatusValueOf } from "@/lib/domain/status";

// BackendPurchase.status ("PAID" | "PENDING" | "PARTIAL") normalized onto
// the shared payment taxonomy (lib/domain/status.ts) per
// design-system/06-DOMAIN.md Part D.
const PURCHASE_STATUS_KEY: Record<string, StatusValueOf<"payment">> = {
  PAID: "paid",
  PARTIAL: "partial",
  PENDING: "unpaid",
};

// Helper: week label for a Date (e.g. "W1", "W2"...)
function getISOWeekLabel(d: Date): string {
  const start = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  return `W${week}`;
}

// Helper: format date as "DD MMM YYYY"
function fmtDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function ExternalPurchasesSection() {
  const { data: purchasesRes, isLoading, isError } = useQuery({
    queryKey: ["reports", "external-purchases"],
    queryFn: () => purchasesApi.list(200),
  });

  const rows = purchasesRes?.items ?? [];
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

        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16, marginBottom: 18 }}>
          <SumCard icon={<Package size={22} color={T.royalBurgundy} />} label="Total External Sarees Purchased" value={`${totalSarees} sarees`} sub="All recorded purchases" />
          <SumCard icon={<IndianRupee size={22} color={T.antiqueGold} />} label="Total Bill Amount" value={formatMoney(rupees(totalBill))} sub="Across all suppliers" hi />
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

  // Compute per-weaver production table from real batch rows + QC records
  const prodTableRows = useMemo(() => {
    const batches = batchesRes?.items ?? [];
    const qcBySareeId = new Map((qcRes?.items ?? []).filter(q => q.sareeId).map(q => [q.sareeId, q]));
    const weaverNameById = new Map((weaversRes?.items ?? []).map(w => [w.id, w.name]));

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
      code: weaverId,
      name: weaverNameById.get(weaverId) ?? "Unknown Weaver",
      batches: acc.batches.size,
      produced: acc.produced,
      passed: acc.passed,
      rejected: acc.rejected,
      passRate: acc.produced > 0 ? Math.round((acc.passed / acc.produced) * 100) : 0,
      designs: acc.designs.size > 0 ? Array.from(acc.designs).join(", ") : "—",
      charges: acc.charges,
    })).sort((a, b) => b.produced - a.produced);
  }, [batchesRes, qcRes, weaversRes]);

  // Compute "Own Factory vs Outsourced" from live batch rows
  const productionSourceData = useMemo(() => {
    const batches = batchesRes?.items ?? [];
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
  }, [batchesRes]);

  const totalSourceSarees = productionSourceData.reduce((s, d) => s + d.value, 0);

  // Compute "Where Sarees Are Right Now" pipeline stages from batch rows + finishing status
  const prodStageData = useMemo(() => {
    const batches = batchesRes?.items ?? [];
    const qcItems = qcRes?.items ?? [];
    const qcSareeIds = new Set(qcItems.map(q => q.sareeId).filter(Boolean));
    const qcPassedIds = new Set(qcItems.filter(q => q.result === "PASSED").map(q => q.sareeId).filter(Boolean));

    let weavingInProgress = 0;
    let waitingQC = 0;
    let qcPassed = 0;

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
          // Has a QC record but didn't pass
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
      { stage: "Waiting Quality Check", count: waitingQC, color: T.royalBurgundy },
      { stage: "Weaving in Progress", count: weavingInProgress, color: T.antiqueGold },
    ];
  }, [batchesRes, qcRes, production]);

  const totalPipelineCount = Math.max(1, prodStageData.reduce((s, d) => s + d.count, 0));

  interface ProdTableRow {
    code: string; name: string; batches: number; produced: number;
    passed: number; rejected: number; passRate: number; designs: string; charges: number;
  }

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
    const batches = batchesRes?.items ?? [];

    // Build map of ISO week -> count of saree rows assigned
    const weekMap = new Map<string, number>();
    for (const batch of batches) {
      const d = new Date(batch.createdAt);
      const label = getISOWeekLabel(d);
      for (const row of batch.rows) {
        if (row.recipientType) {
          weekMap.set(label, (weekMap.get(label) ?? 0) + 1);
        }
      }
    }

    // Get last 4 distinct weeks
    const allWeeks = Array.from(weekMap.keys()).sort().slice(-8);
    const recentFour = allWeeks.slice(-4);
    const priorFour = allWeeks.slice(0, 4);

    return recentFour.map((week, i) => ({
      week,
      current: weekMap.get(week) ?? 0,
      prior: weekMap.get(priorFour[i]) ?? 0,
    }));
  }, [batchesRes]);

  // QC donut from production summary (live)
  const qcDonutData = [
    { name: "Passed",   value: production?.qcByResult.PASSED ?? 0,    color: T.green },
    { name: "Semi",     value: production?.qcByResult.SEMI ?? 0,      color: T.antiqueGold },
    { name: "Rejected", value: production?.qcByResult.DEFECTIVE ?? 0, color: T.crimson },
  ];
  const totalQc = qcDonutData.reduce((s, d) => s + d.value, 0);
  const passRatePct = totalQc > 0 ? Math.round((qcDonutData[0].value / totalQc) * 100) : 0;
  const dispatchedCount = production?.finishingByStatus?.["DISPATCHED"] ?? 0;

  return (
    <div id="rep-production" className="px-4 md:px-7 xl:px-10" style={{ paddingTop: 32 }}>
    <SectionCard
      icon={Factory}
      title="Saree Production Report"
      subtitle="Track how many sarees were produced, which weavers produced them, which designs were made, and how many passed or failed quality check."
    >
      <ReportDLBar />

      <div className="flex flex-wrap gap-2.5 mb-6">
        {["All Sources", "Own Factory Only", "Outsourced Only"].map((f, i) => (
          <div key={f} style={{ padding: "5px 14px", borderRadius: 20, cursor: "pointer", fontFamily: F.ui, fontSize: 12, fontWeight: 500, background: i === 0 ? T.royalBurgundy : "transparent", color: i === 0 ? "#FFF" : T.taupe, border: `1px solid ${i === 0 ? T.royalBurgundy : T.borderDef}` }}>{f}</div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4" style={{ gap: 20, marginBottom: 24, alignItems: "stretch" }}>
        {/* Weekly production trend — computed from real batch createdAt */}
        <ChartCard title="Sarees Produced Each Week" sub="Current vs prior period" icon={<TrendingUp size={22} color={T.royalBurgundy} />}>
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
        </ChartCard>

        {/* Pipeline stage counts — computed from real batch + QC + finishing data */}
        <ChartCard title="Where Sarees Are Right Now" sub="Production pipeline by stage" icon={<Factory size={22} color={T.antiqueGold} />}>
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
                  <AnimBar pct={Math.round((s.count / totalPipelineCount) * 100)} color={s.color} height={7} delay={prodStageData.indexOf(s) * 0.06} />
                </div>
              ))}
            </div>
          )}
        </ChartCard>

        {/* QC donut — live from GET /reports/production-summary */}
        <ChartCard title="Quality Check This Period" sub="Pass / reject breakdown" icon={<CheckCircle2 size={22} color={T.green} />}>
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
        </ChartCard>

        {/* Own Factory vs Outsourced — computed from live batch rows */}
        <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 18, padding: "28px", display: "flex", flexDirection: "column", boxShadow: "0 2px 14px rgba(74,6,27,0.05)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
            <div style={{ width: 52, height: 52, minWidth: 52, borderRadius: 14, background: "rgba(110,15,45,0.07)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Boxes size={24} color={T.royalBurgundy} />
            </div>
            <div>
              <h3 style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, margin: "0 0 4px 0" }}>Own Factory vs Outsourced</h3>
              <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, margin: 0 }}>Production source split — all batches</p>
            </div>
          </div>
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
      </div>

      {/* 4 summary cards — live from GET /reports/production-summary */}
      <div className="grid grid-cols-1 md:grid-cols-4" style={{ gap: 16, marginBottom: 24, alignItems: "stretch" }}>
        <SumCard icon={<Package size={22} color={T.royalBurgundy} />} label="Total Sarees Produced" value={`${production?.totalSareesProduced ?? 0}`} sub="All batches" />
        <SumCard icon={<CheckCircle2 size={22} color={T.green} />} label="Total Passed Quality Check" value={`${qcDonutData[0].value}`} sub={totalQc > 0 ? `${passRatePct}% pass rate` : "No QC records yet"} greenHi />
        <SumCard icon={<AlertTriangle size={22} color={T.crimson} />} label="Total Rejected" value={`${qcDonutData[2].value}`} sub={totalQc > 0 ? `${Math.round((qcDonutData[2].value / totalQc) * 100)}% rejection rate` : "No QC records yet"} crimsonHi />
        <SumCard icon={<Truck size={22} color={T.antiqueGold} />} label="Total Dispatched" value={`${dispatchedCount}`} sub="To wholesale customers" hi />
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
            />
          </div>
        </div>
          {prodTableRows.length > 0 && (
            <div style={{ background: T.warmCream, borderTop: `2px solid ${T.borderDef}`, display: "flex", alignItems: "center", padding: "13px 14px", gap: 14 }}>
              <span style={{ fontFamily: F.ui, fontWeight: 700, color: T.luxuryBrown, flex: 1 }}>Totals ({prodTableRows.length} weavers)</span>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{prodTableRows.reduce((s, r) => s + r.produced, 0)}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: T.green }}>{prodTableRows.reduce((s, r) => s + r.passed, 0)}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: T.crimson }}>{prodTableRows.reduce((s, r) => s + r.rejected, 0)}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: T.royalBurgundy }}>{formatMoney(rupees(prodTableRows.reduce((s, r) => s + r.charges, 0)))}</span>
            </div>
          )}
          <TablePager total={prodTableRows.length} showing={prodTableRows.length} />
        </div>
      </FadeUp>

      <ExternalPurchasesSection />
    </SectionCard>
    </div>
  );
}
