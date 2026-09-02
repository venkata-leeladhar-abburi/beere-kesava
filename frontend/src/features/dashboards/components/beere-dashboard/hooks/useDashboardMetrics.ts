import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "../../../../../shared/api/reports";
import { weaversApi } from "../../../../../shared/api/weavers";
import { dispatchApi } from "../../../../../shared/api/dispatch";
import { formatMoney, rupees } from "../../../../../lib/domain/money";

/**
 * Fetches live dashboard metrics from:
 *  - GET /reports/outstanding-payments  (pending payments total)
 *  - GET /reports/production-summary    (sarees produced, QC ready)
 *  - GET /dispatch                      (dispatched sarees, shop + wholesale)
 *  - GET /weavers                       (active weaver count)
 */
export function useDashboardMetrics() {
  const outstanding = useQuery({
    queryKey: ["reports", "outstanding-payments"],
    queryFn: () => reportsApi.outstandingPayments(),
    staleTime: 60_000,
  });

  const production = useQuery({
    queryKey: ["reports", "production-summary"],
    queryFn: () => reportsApi.productionSummary(),
    staleTime: 60_000,
  });

  // pageSize 100 (not sales-summary's record count) — the tiles need the
  // actual dispatched sarees, which only come back on each record's `sarees`
  // array.
  const dispatches = useQuery({
    queryKey: ["dispatch", "dashboard-metrics"],
    queryFn: () => dispatchApi.list(100),
    staleTime: 60_000,
  });

  const weavers = useQuery({
    queryKey: ["weavers", "active-count"],
    queryFn: async () => {
      const res = await weaversApi.list(100);
      const items = Array.isArray(res) ? res : (res?.items ?? []);
      return items.filter((w) => w.status === "ACTIVE").length;
    },
    staleTime: 60_000,
  });

  const isLoading =
    outstanding.isLoading || production.isLoading || dispatches.isLoading || weavers.isLoading;

  const isError =
    outstanding.isError || production.isError || dispatches.isError || weavers.isError;

  const refetch = () => {
    void outstanding.refetch();
    void production.refetch();
    void dispatches.refetch();
    void weavers.refetch();
  };

  const activeWeavers = weavers.data ?? 0;
  const totalProduced = production.data?.totalSareesProduced ?? 0;
  const pendingPaymentsTotal = outstanding.data?.totalOutstanding ?? 0;
  const pendingOverdue = outstanding.data?.items.filter((i) => i.status === "OVERDUE").length ?? 0;

  // All dispatched sarees, deduplicated by ID — used to size down "produced"
  // into what's actually still on the shelf below.
  const dispatchedSareeIds = new Set(
    (dispatches.data?.items ?? []).flatMap((d) => d.sarees.map((s) => s.sareeId)),
  );
  // QC-passed sarees still on the shelf: a SEMI verdict sends a saree back to
  // the weaver for rework rather than to sale, so it no longer belongs here,
  // and anything already dispatched has to be subtracted too — otherwise this
  // just grows forever instead of reflecting current stock.
  const qcPassed = production.data?.qcByResult?.PASSED ?? 0;
  const readyForSale = Math.max(0, qcPassed - dispatchedSareeIds.size);
  // Every dispatched saree, Shop and Wholesale combined, deduplicated by id —
  // was wholesale-only before, undercounting against the real total shown on
  // the Inventory page (which counts both dispatch types the same way).
  const dispatchedCount = dispatchedSareeIds.size;

  const formatCurrency = (n: number) => formatMoney(rupees(n), { compact: true });

  return {
    isLoading,
    isError,
    refetch,
    metrics: [
      {
        label: "Active Weavers",
        val: String(activeWeavers),
        sub: "Currently weaving",
        hi: false,
      },
      {
        label: "Sarees Produced",
        val: String(totalProduced),
        sub: "Total batches completed",
        hi: false,
      },
      {
        label: "Pending Payments",
        val: formatCurrency(pendingPaymentsTotal),
        sub: pendingOverdue > 0 ? `${pendingOverdue} overdue` : "All current",
        hi: pendingOverdue > 0,
      },
      {
        label: "Ready for Sale",
        val: String(readyForSale),
        sub: "Sarees",
        hi: false,
      },
      {
        label: "Dispatched",
        val: String(dispatchedCount),
        sub: "Shop & Wholesale",
        hi: false,
      },
    ],
  };
}
