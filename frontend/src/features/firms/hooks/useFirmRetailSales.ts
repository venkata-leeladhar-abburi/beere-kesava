import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  firmsApi,
  type FirmRetailSale,
  type LinkRetailSalesPayload,
  type RetailSaleQuery,
} from "../../../shared/api/firms";
import { firmActivityKey } from "./useFirmActivity";

export const firmRetailSalesKey = (firmId: string, query: RetailSaleQuery) =>
  ["firms", "retail-sales", firmId, query] as const;

export const connectableRetailSalesKey = (query: RetailSaleQuery) =>
  ["firms", "retail-sales", "connectable", query] as const;

/**
 * Retail sales booked to one firm, plus the totals its Retail Sales tab shows.
 *
 * The revenue figure comes from the server's aggregate over the whole filtered
 * set rather than a sum of `items`, so it stays correct when the result is
 * capped by pageSize.
 */
export function useFirmRetailSales(firmId: string | undefined, query: RetailSaleQuery = {}) {
  const q = useQuery({
    queryKey: firmRetailSalesKey(firmId ?? "", query),
    queryFn: () => firmsApi.listRetailSales(firmId as string, query),
    enabled: !!firmId,
  });

  const sales: FirmRetailSale[] = q.data?.items ?? [];
  const totalAmount = q.data?.totalAmount ?? 0;
  const count = q.data?.total ?? sales.length;

  return {
    sales,
    count,
    totalAmount,
    averageAmount: count > 0 ? totalAmount / count : 0,
    isLoading: q.isLoading,
    isError: q.isError,
    error: q.error as Error | null,
    refetch: () => void q.refetch(),
  };
}

/** The pool an accountant picks from when connecting sales to a firm. */
export function useConnectableRetailSales(query: RetailSaleQuery = {}, enabled = true) {
  const q = useQuery({
    queryKey: connectableRetailSalesKey(query),
    queryFn: () => firmsApi.listConnectableRetailSales(query),
    enabled,
  });

  return {
    sales: q.data?.items ?? [],
    total: q.data?.total ?? 0,
    isLoading: q.isLoading,
    isFetching: q.isFetching,
    isError: q.isError,
    error: q.error as Error | null,
    refetch: () => void q.refetch(),
  };
}

/**
 * Connect / disconnect sales. Both invalidate the firm's activity as well as
 * its sale list — a linked sale counts as realized income, so the firm's net
 * balance changes with it and a stale activity cache would contradict the
 * table the user is looking at.
 */
export function useRetailSaleLinking() {
  const queryClient = useQueryClient();

  const invalidate = (firmId: string) => {
    void queryClient.invalidateQueries({ queryKey: ["firms", "retail-sales"] });
    void queryClient.invalidateQueries({ queryKey: firmActivityKey(firmId) });
    // Other firms' activity may also have changed when a sale was moved.
    void queryClient.invalidateQueries({ queryKey: ["firms", "activity"] });
  };

  const link = useMutation({
    mutationFn: ({ firmId, payload }: { firmId: string; payload: LinkRetailSalesPayload }) =>
      firmsApi.linkRetailSales(firmId, payload),
    onSuccess: (_res, vars) => invalidate(vars.firmId),
  });

  const unlink = useMutation({
    mutationFn: ({ firmId, saleRef }: { firmId: string; saleRef: string }) =>
      firmsApi.unlinkRetailSale(firmId, saleRef),
    onSuccess: (_res, vars) => invalidate(vars.firmId),
  });

  return {
    linkSales: link.mutateAsync,
    unlinkSale: unlink.mutateAsync,
    isLinking: link.isPending,
    isUnlinking: unlink.isPending,
    linkError: link.error as Error | null,
    unlinkError: unlink.error as Error | null,
    resetLinkError: () => link.reset(),
  };
}


export const retailSalesFirmKey = ["firms", "retail-sales", "active-firm"] as const;
export const retailSaleOptionsKey = (firmId: string) =>
  ["firms", "retail-sales", "options", firmId] as const;

/**
 * The firm every new counter sale is booked to.
 *
 * This is the heart of the flow: shop staff never pick a firm, so whichever
 * firm carries this flag is where retail revenue lands from that point on.
 */
export function useRetailSalesFirm() {
  const q = useQuery({
    queryKey: retailSalesFirmKey,
    queryFn: () => firmsApi.getRetailSalesFirm(),
  });

  return {
    activeFirm: q.data ?? null,
    isLoading: q.isLoading,
    isError: q.isError,
    refetch: () => void q.refetch(),
  };
}

/** Filter values a firm's retail sales actually contain, for the dropdowns. */
export function useRetailSaleFilterOptions(firmId: string | undefined) {
  const q = useQuery({
    queryKey: retailSaleOptionsKey(firmId ?? ""),
    queryFn: () => firmsApi.retailSaleFilterOptions(firmId as string),
    enabled: !!firmId,
  });

  return {
    paymentMethods: q.data?.paymentMethods ?? [],
    soldBy: q.data?.soldBy ?? [],
  };
}

/**
 * Set or clear the active retail firm.
 *
 * Setting it also back-fills every currently-unconnected retail sale, so the
 * firm's totals and the whole sale list move at once — everything retail-sale
 * shaped is invalidated rather than one key.
 */
export function useRetailSalesFirmControl() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["firms", "retail-sales"] });
    void queryClient.invalidateQueries({ queryKey: ["firms", "activity"] });
    // ["firms"] is the prefix of every firm query, including the directory
    // list whose isRetailSalesFirm flag has just moved.
    void queryClient.invalidateQueries({ queryKey: ["firms"] });
  };

  const set = useMutation({
    mutationFn: (firmId: string) => firmsApi.setRetailSalesFirm(firmId),
    onSuccess: invalidate,
  });

  const clear = useMutation({
    mutationFn: () => firmsApi.clearRetailSalesFirm(),
    onSuccess: invalidate,
  });

  return {
    setActiveFirm: set.mutateAsync,
    clearActiveFirm: clear.mutateAsync,
    isSettingFirm: set.isPending,
    isClearingFirm: clear.isPending,
    setFirmError: set.error as Error | null,
  };
}
