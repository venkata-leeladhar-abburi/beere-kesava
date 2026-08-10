import { useBatches } from "../../../../production/contexts/BatchContext";
import { useQc } from "../../../../qc/contexts/QcContext";
import { useRatesPricing } from "../../../../pricing/contexts/RatesContext";
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
  const { getSareeTypeByCode } = useRatesPricing();

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

  const formatCurrency = (n: number) => {
    if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`;
    if (n >= 1_000) return `₹${(n / 1_000).toFixed(0)}K`;
    return `₹${n}`;
  };

  // "Produced" = QC-passed OR finished via the Raise Quotation receive flow —
  // a saree returned through that flow can be produced without ever showing
  // up as a plain QC pass here, so counting QC alone undercounts it. A
  // semi-approved saree is neither: it went back to the weaver for rework and
  // has to be handed in and received again.
  const producedRows = myRows.filter(r => r.qcPassed === true || r.finished === true);
  const producedCount = producedRows.length;
  const reworkCount = myRows.filter(r => r.awaitingRework === true).length;
  const totalCharge = producedRows.reduce(
    (sum, r) => sum + (r.sareeTypeCode ? Number(getSareeTypeByCode(r.sareeTypeCode)?.charge ?? 0) : 0),
    0,
  );

  return {
    isLoading: false,
    isError: batchesError,
    metrics: [
      { label: "Active Batches", val: String(myActiveBatchIds.size), sub: "Currently assigned to you", hi: false },
      { label: "Sarees Assigned", val: String(myRows.length), sub: "Across all your batches", hi: false },
      { label: "QC Pass Rate", val: `${qcPassRate}%`, sub: qcRecords.length === 0 ? "No inspections yet" : `${passedCount} of ${qcRecords.length} passed`, hi: qcPassRate < 90 && qcRecords.length > 0 },
      { label: "Sarees Produced", val: String(producedCount), sub: "QC-passed or finished via quotation", hi: false },
      { label: "Gross Charge", val: formatCurrency(totalCharge), sub: "From produced sarees", hi: totalCharge > 0 },
    ],
  };
}
