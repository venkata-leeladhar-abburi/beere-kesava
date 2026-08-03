import React, { createContext, useContext, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export * from "./sales-types";
export * from "./sales-seed";
import { UnifiedSaree, SaleInfo, ReturnInfo, SalesContextValue } from "./sales-types";
import { SEED_UNIFIED_SAREES, SEED_PURCHASE_SUMMARIES } from "./sales-seed";

const SalesContext = createContext<SalesContextValue | null>(null);

const QUERY_KEY = ["sales", "sarees"] as const;

export function SalesProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data: sarees = SEED_UNIFIED_SAREES } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => Promise.resolve(SEED_UNIFIED_SAREES),
    initialData: SEED_UNIFIED_SAREES,
  });

  const recordSaleMutation = useMutation({
    mutationFn: (args: { sareeId: string; sale: SaleInfo }) => Promise.resolve(args),
    onSuccess: ({ sareeId, sale }) =>
      queryClient.setQueryData<UnifiedSaree[]>(QUERY_KEY, prev =>
        (prev ?? []).map(s => s.sareeId === sareeId
          ? { ...s, status: sale.channel, sale, ageDays: 0 }
          : s)
      ),
  });

  const recordReturnMutation = useMutation({
    mutationFn: (args: { sareeId: string; ret: ReturnInfo }) => Promise.resolve(args),
    onSuccess: ({ sareeId, ret }) =>
      queryClient.setQueryData<UnifiedSaree[]>(QUERY_KEY, prev =>
        (prev ?? []).map(s => s.sareeId === sareeId
          ? { ...s, status: "returned", ret }
          : s)
      ),
  });

  const recordSale = (sareeId: string, sale: SaleInfo) => recordSaleMutation.mutate({ sareeId, sale });
  const recordReturn = (sareeId: string, ret: ReturnInfo) => recordReturnMutation.mutate({ sareeId, ret });

  const value = useMemo(
    () => ({ sarees, purchases: SEED_PURCHASE_SUMMARIES, recordSale, recordReturn }),
    [sarees],
  );
  return <SalesContext.Provider value={value}>{children}</SalesContext.Provider>;
}

/**
 * Read-only fallback when no provider is mounted, so report screens can be dropped
 * anywhere without every layout having to wrap them first.
 */
const FALLBACK: SalesContextValue = {
  sarees: SEED_UNIFIED_SAREES,
  purchases: SEED_PURCHASE_SUMMARIES,
  recordSale: () => {},
  recordReturn: () => {},
};

export function useSales(): SalesContextValue {
  return useContext(SalesContext) ?? FALLBACK;
}
