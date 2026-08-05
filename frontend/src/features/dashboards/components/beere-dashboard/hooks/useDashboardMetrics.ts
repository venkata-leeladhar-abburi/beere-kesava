import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "../../../../../shared/api/reports";
import { weaversApi } from "../../../../../shared/api/weavers";

/**
 * Fetches live dashboard metrics from:
 *  - GET /reports/outstanding-payments  (pending payments total)
 *  - GET /reports/production-summary    (sarees produced, QC ready)
 *  - GET /reports/sales-summary         (dispatched count)
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

  const sales = useQuery({
    queryKey: ["reports", "sales-summary"],
    queryFn: () => reportsApi.salesSummary(),
    staleTime: 60_000,
  });

  const weavers = useQuery({
    queryKey: ["weavers", "active-count"],
    queryFn: async () => {
      const res = await weaversApi.list(200);
      return res.items.filter((w) => w.status === "ACTIVE").length;
    },
    staleTime: 60_000,
  });

  const isLoading =
    outstanding.isLoading || production.isLoading || sales.isLoading || weavers.isLoading;

  const activeWeavers = weavers.data ?? 0;
  const totalProduced = production.data?.totalSareesProduced ?? 0;
  const pendingPaymentsTotal = outstanding.data?.totalOutstanding ?? 0;
  const pendingOverdue = outstanding.data?.items.filter((i) => i.status === "OVERDUE").length ?? 0;
  const qcPassed = production.data?.qcByResult?.PASSED ?? 0;
  const qcSemi = production.data?.qcByResult?.SEMI ?? 0;
  const readyForSale = qcPassed + qcSemi;
  const dispatchedCount = sales.data?.wholesale.count ?? 0;

  const formatCurrency = (n: number) => {
    if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`;
    if (n >= 1_000) return `₹${(n / 1_000).toFixed(0)}K`;
    return `₹${n}`;
  };

  return {
    isLoading,
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
        sub: "Wholesale dispatches",
        hi: false,
      },
    ],
  };
}
