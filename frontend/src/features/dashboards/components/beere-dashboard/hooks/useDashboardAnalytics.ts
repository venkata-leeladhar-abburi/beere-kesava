import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "../../../../../shared/api/reports";
import { batchesApi } from "../../../../../shared/api/batches";
import { purchaseRequestsApi } from "../../../../../shared/api/purchase-requests";

/**
 * Aggregates cross-domain figures used by the Performance Overview widgets
 * (ProductionProgress, SareesProduced, FeaturedProduct) and the Superadmin
 * "Pending Approvals" metric. Joins:
 *  - GET /reports/production-summary  (QC pass/semi/defective counts)
 *  - GET /batches                     (active batch count, distinct working weavers, distinct design codes)
 *  - GET /reports/outstanding-payments (overdue invoice count, collected vs outstanding totals)
 *  - GET /purchase-requests           (pending approval count)
 *
 * NOTE: there is no backend endpoint for weekly/monthly time-series data
 * (sarees produced vs dispatched per week) or for "today"-scoped dispatch
 * counts — those remain mock in ThreeCol.tsx's BarChart / FeaturedProduct's
 * "Dispatch today" tile, same documented gap as the rest of this sweep
 * (no monthly cash-flow time-series exists either). Raw-material stock
 * ("Inventory" tile / pcs in stock) also has no backend module.
 */
export function useDashboardAnalytics() {
  const production = useQuery({
    queryKey: ["reports", "production-summary"],
    queryFn: () => reportsApi.productionSummary(),
    staleTime: 60_000,
  });

  const batches = useQuery({
    queryKey: ["batches", "dashboard-analytics"],
    queryFn: () => batchesApi.list(200),
    staleTime: 60_000,
  });

  const outstanding = useQuery({
    queryKey: ["reports", "outstanding-payments"],
    queryFn: () => reportsApi.outstandingPayments(),
    staleTime: 60_000,
  });

  const purchaseRequests = useQuery({
    queryKey: ["purchase-requests", "dashboard-pending"],
    queryFn: () => purchaseRequestsApi.list(200),
    staleTime: 60_000,
  });

  const isLoading =
    production.isLoading || batches.isLoading || outstanding.isLoading || purchaseRequests.isLoading;

  const qc = production.data?.qcByResult;
  const qcTotal = (qc?.PASSED ?? 0) + (qc?.SEMI ?? 0) + (qc?.DEFECTIVE ?? 0);
  const qcPassRate = qcTotal > 0 ? Math.round(((qc?.PASSED ?? 0) / qcTotal) * 100) : 0;

  const activeBatches = (batches.data?.items ?? []).filter((b) => b.status === "ACTIVE");
  const activeBatchesCount = activeBatches.length;

  const weaversWorking = new Set(
    activeBatches.flatMap((b) => b.rows.filter((r) => r.recipientType === "WEAVER" && r.weaverId).map((r) => r.weaverId)),
  );
  const weaversWorkingCount = weaversWorking.size;

  const designCodes = new Set(
    (batches.data?.items ?? []).flatMap((b) => b.rows.filter((r) => r.designCode).map((r) => r.designCode)),
  );
  const designCodesCount = designCodes.size;

  const overdueInvoicesCount = (outstanding.data?.items ?? []).filter((i) => i.status === "OVERDUE").length;

  const totalInvoiced = (outstanding.data?.items ?? []).reduce((s, i) => s + i.total, 0);
  const totalCollected = (outstanding.data?.items ?? []).reduce((s, i) => s + i.paid, 0);
  const paymentsCollectedPct = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;

  const pendingApprovalsCount = (purchaseRequests.data?.items ?? []).filter((r) => r.status === "PENDING").length;

  return {
    isLoading,
    qcPassRate,
    totalSareesProduced: production.data?.totalSareesProduced ?? 0,
    activeBatchesCount,
    weaversWorkingCount,
    designCodesCount,
    overdueInvoicesCount,
    paymentsCollectedPct,
    pendingApprovalsCount,
  };
}
