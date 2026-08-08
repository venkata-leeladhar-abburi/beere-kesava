import { useBatches } from "../../../../production/contexts/BatchContext";
import { useQc } from "../../../../qc/contexts/QcContext";
import { useWeaverPayments } from "../../../../weavers/contexts/WeaverPaymentsContext";
import { useCurrentWeaver } from "../useCurrentWeaver";

/**
 * Same shape/pattern as the admin dashboard's useDashboardMetrics, but
 * scoped to the logged-in weaver's own real data (batches, QC, earnings)
 * instead of company-wide figures.
 */
export function useWeaverDashboardMetrics() {
  const { weaverId } = useCurrentWeaver();
  const { batches, isError: batchesError } = useBatches();
  const { getQcForWeaver } = useQc();
  const { getEarningsForWeaver } = useWeaverPayments();

  const myRows = weaverId
    ? batches.filter(b => b.status !== "draft").flatMap(b => b.rows.filter(r => r.weaverId === weaverId))
    : [];
  const myActiveBatchIds = new Set(
    (weaverId
      ? batches.filter(b => b.status !== "draft" && b.rows.some(r => r.weaverId === weaverId && !r.qcPassed))
      : []
    ).map(b => b.batchId),
  );

  const qcRecords = weaverId ? getQcForWeaver(weaverId) : [];
  const passedCount = qcRecords.filter(q => q.result === "passed").length;
  const qcPassRate = qcRecords.length > 0 ? Math.round((passedCount / qcRecords.length) * 100) : 100;

  const earnings = weaverId ? getEarningsForWeaver(weaverId) : undefined;
  const totalEarned = earnings?.totalEarned ?? 0;

  const formatCurrency = (n: number) => {
    if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`;
    if (n >= 1_000) return `₹${(n / 1_000).toFixed(0)}K`;
    return `₹${n}`;
  };

  return {
    isLoading: false,
    isError: batchesError,
    metrics: [
      { label: "Active Batches", val: String(myActiveBatchIds.size), sub: "Currently assigned to you", hi: false },
      { label: "Sarees Assigned", val: String(myRows.length), sub: "Across all your batches", hi: false },
      { label: "QC Pass Rate", val: `${qcPassRate}%`, sub: qcRecords.length === 0 ? "No inspections yet" : `${passedCount} of ${qcRecords.length} passed`, hi: qcPassRate < 90 && qcRecords.length > 0 },
      { label: "Sarees Completed", val: String(passedCount), sub: "QC-passed", hi: false },
      { label: "Total Earned", val: formatCurrency(totalEarned), sub: "From QC-passed sarees", hi: totalEarned > 0 },
    ],
  };
}
