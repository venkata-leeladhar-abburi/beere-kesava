import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "../../../../../shared/api/reports";
import { batchesApi } from "../../../../../shared/api/batches";
import { weaversApi } from "../../../../../shared/api/weavers";
import { designLibraryApi } from "../../../../../shared/api/design-library";
import { purchaseRequestsApi } from "../../../../../shared/api/purchase-requests";
import { dispatchApi } from "../../../../../shared/api/dispatch";

export function useDashboardAnalytics() {
  const production = useQuery({
    queryKey: ["reports", "production-summary"],
    queryFn: () => reportsApi.productionSummary(),
    staleTime: 10_000,
  });

  const batches = useQuery({
    queryKey: ["batches", "dashboard-analytics"],
    queryFn: () => batchesApi.list(100),
    staleTime: 10_000,
  });

  const weavers = useQuery({
    queryKey: ["weavers", "dashboard-analytics"],
    queryFn: () => weaversApi.list(100),
    staleTime: 10_000,
  });

  const designs = useQuery({
    queryKey: ["design-library", "dashboard-analytics"],
    queryFn: () => designLibraryApi.list(100),
    staleTime: 10_000,
  });

  const outstanding = useQuery({
    queryKey: ["reports", "outstanding-payments"],
    queryFn: () => reportsApi.outstandingPayments(),
    staleTime: 10_000,
  });

  const purchaseRequests = useQuery({
    queryKey: ["purchase-requests", "dashboard-pending"],
    queryFn: () => purchaseRequestsApi.list(100),
    staleTime: 10_000,
  });

  const dispatches = useQuery({
    queryKey: ["dispatch", "dashboard-analytics"],
    queryFn: () => dispatchApi.list(1),
    staleTime: 10_000,
  });

  const isLoading =
    production.isLoading && batches.isLoading && weavers.isLoading;

  const isError =
    batches.isError && weavers.isError;

  const qc = production.data?.qcByResult;
  const qcTotal = (qc?.PASSED ?? 0) + (qc?.SEMI ?? 0) + (qc?.DEFECTIVE ?? 0);
  const qcPassRate = qcTotal > 0 ? Math.round(((qc?.PASSED ?? 0) / qcTotal) * 100) : 0;

  const allBatches = batches.data?.items ?? [];
  const activeBatches = allBatches.filter((b) => b.status === "ACTIVE");
  const activeBatchesCount = activeBatches.length > 0 ? activeBatches.length : allBatches.length;

  const weaversWorkingOnBatches = new Set(
    allBatches.flatMap((b) =>
      b.rows
        .filter((r) => r.weaverId)
        .map((r) => r.weaverId!),
    ),
  );
  const activeWeaversInDb = (weavers.data?.items ?? []).filter((w) => w.status === "ACTIVE").length;
  const weaversWorkingCount = Math.max(weaversWorkingOnBatches.size, activeWeaversInDb, weavers.data?.total ?? 0);

  const designCodesFromLibrary = (designs.data?.items ?? []).map((d) => d.code);
  const designCodesFromBatches = allBatches.flatMap((b) =>
    b.rows.filter((r) => r.designCode).map((r) => r.designCode!),
  );
  const designCodesCount = new Set([...designCodesFromLibrary, ...designCodesFromBatches]).size;

  // Backend already computes this as QC-passed OR finished-via-quotation,
  // deduplicated by saree — do not clamp it up to the raw row count, which
  // would count every unproduced row too.
  const totalSareesProduced = production.data?.totalSareesProduced ?? 0;

  const inStockSareesCount = qc?.PASSED ?? 0;

  const overdueInvoicesCount = (outstanding.data?.items ?? []).filter((i) => i.status === "OVERDUE").length;

  const totalInvoiced = (outstanding.data?.items ?? []).reduce((s, i) => s + i.total, 0);
  const totalCollected = (outstanding.data?.items ?? []).reduce((s, i) => s + i.paid, 0);
  const paymentsCollectedPct = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;

  const pendingApprovalsCount = (purchaseRequests.data?.items ?? []).filter((r) => r.status === "PENDING").length;

  const dispatchedCount = dispatches.data?.total ?? 0;

  return {
    isLoading,
    isError,
    qcPassRate,
    totalSareesProduced,
    activeBatchesCount,
    weaversWorkingCount,
    designCodesCount,
    inStockSareesCount,
    overdueInvoicesCount,
    paymentsCollectedPct,
    pendingApprovalsCount,
    dispatchedCount,
  };
}
