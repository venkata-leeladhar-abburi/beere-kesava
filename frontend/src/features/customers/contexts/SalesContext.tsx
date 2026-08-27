import React, { createContext, useCallback, useContext, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export * from "./sales-types";
export * from "./sales-seed";
import { UnifiedSaree, SaleInfo, ReturnInfo, SalesContextValue, SareeOrigin, SareeSaleStatus } from "./sales-types";
import { SEED_PURCHASE_SUMMARIES } from "./sales-seed";

import { inventoryApi } from "../../../shared/api/inventory";
import { salesApi } from "../../../shared/api/sales";
import { useAuthGate } from "../../../contexts/AuthContext";

const SalesContext = createContext<SalesContextValue | null>(null);

const QUERY_KEY = ["sales", "sarees"] as const;

export function SalesProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  // GET /inventory allows WORKER too, but GET /sales and GET
  // /sales/returns/all (fetched below) are SHOP/ACCOUNTANT-only (ADMIN/
  // SUPERADMIN bypass every role check) — WORKER/WEAVER would 403 on those.
  // This provider is shared across every portal, so an unscoped gate fired
  // all three for them too.
  const enabled = useAuthGate("shop", "accountant", "admin", "superadmin");

  const { data: rawInventory = [], isError: isInventoryError, error: inventoryError, isLoading: isInventoryLoading, refetch: refetchInventory } = useQuery({
    queryKey: ["backend-inventory-list"],
    queryFn: () => inventoryApi.list(),
    enabled,
  });

  const { data: rawSales, isError: isSalesError, error: salesError, isLoading: isSalesLoading, refetch: refetchSales } = useQuery({
    queryKey: ["backend-sales-list"],
    queryFn: () => salesApi.list(100),
    enabled,
  });

  const { data: rawReturns, isError: isReturnsError, error: returnsError, isLoading: isReturnsLoading, refetch: refetchReturns } = useQuery({
    queryKey: ["backend-returns-list"],
    queryFn: () => salesApi.listReturns(100),
    enabled,
  });

  const isError = isInventoryError || isSalesError || isReturnsError;
  const error = inventoryError ?? salesError ?? returnsError ?? null;
  const isLoading = isInventoryLoading || isSalesLoading || isReturnsLoading;
  const refetch = useCallback(() => { void refetchInventory(); void refetchSales(); void refetchReturns(); }, [refetchInventory, refetchSales, refetchReturns]);

  const sarees = useMemo<UnifiedSaree[]>(() => {
    if (!rawInventory || rawInventory.length === 0) return [];
    const salesMap = new Map((rawSales?.items ?? []).map(s => [s.sareeId, s]));
    const returnsMap = new Map((rawReturns?.items ?? []).map(r => [r.sareeId, r]));

    return rawInventory.map(item => {
      const sale = salesMap.get(item.sareeId);
      const ret = returnsMap.get(item.sareeId);
      const isExt = item.source === "external";
      const isWvr = item.source === "outsourced";

      const origin: SareeOrigin = isExt ? "external" : isWvr ? "weaver" : "factoryLoom";
      const status: SareeSaleStatus = ret ? "returned" : item.status === "sold" ? "retail" : item.status === "wholesale" ? "wholesale" : "unsold";

      const ageDays = item.qcDate
        ? Math.max(0, Math.floor((Date.now() - new Date(item.qcDate).getTime()) / (1000 * 60 * 60 * 24)))
        : 5;

      return {
        sareeId: item.sareeId,
        origin,
        weaverId: item.weaverId,
        weaverName: item.weaverName,
        // For a weaver saree, loomNumber is the weaver's own loom digit. For a
        // factory-loom saree it's now the loom's display code ("Loom-002"),
        // which is already the label — don't parse it or re-prefix it.
        weaverLoom: origin === "weaver" && item.loomNumber ? (Number.parseInt(item.loomNumber, 10) || null) : null,
        factoryLoomId: origin === "factoryLoom" && item.loomNumber ? item.loomNumber : null,
        factoryLoomNumber: origin === "factoryLoom" && item.loomNumber ? item.loomNumber : null,
        operatorName: item.weaverName,
        loomLocation: "Factory Floor",
        purchaseId: isExt ? `EXT-${item.sareeId.slice(0, 6)}` : null,
        supplier: item.customer ?? (isExt ? "External Supplier" : null),
        supplierLocation: isExt ? "Dharmavaram" : null,
        invoiceNumber: isExt ? `INV-${item.sareeId.slice(0, 6)}` : null,
        purchaseDate: item.qcDate,
        batchId: null,
        designCode: item.designCode ?? "BD-001",
        sareeTypeCode: item.sareeTypeCode ?? "ST-001",
        sareeTypeName: item.sareeTypeLabel ?? "Pure Silk Saree",
        weight: "850g",
        qcDate: item.qcDate ? new Date(item.qcDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Recent",
        costPrice: 5000,
        sellPercent: 20,
        finalAmount: 8500,
        status,
        sale: sale ? {
          saleRef: sale.saleRef,
          channel: sale.channel === "WHOLESALE" ? "wholesale" : "retail",
          date: new Date(sale.saleDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
          customer: item.customer ?? "Counter Customer",
          amount: Number(sale.amount),
        } : null,
        ret: ret ? {
          returnRef: ret.returnRef,
          date: new Date(ret.returnDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
          reason: ret.reason,
          refundAmount: Number(ret.refundAmount ?? 0),
          restocked: true,
        } : null,
        ageDays,
      };
    });
  }, [rawInventory, rawSales, rawReturns]);

  const recordSaleMutation = useMutation({
    mutationFn: (args: { sareeId: string; sale: SaleInfo }) => Promise.resolve(args),
    onSuccess: ({ sareeId, sale }) => {
      queryClient.setQueryData<UnifiedSaree[]>(QUERY_KEY, prev =>
        (prev ?? []).map(s => s.sareeId === sareeId
          ? { ...s, status: sale.channel, sale, ageDays: 0 }
          : s)
      );
      toast.success("Sale recorded");
    },
  });

  const recordReturnMutation = useMutation({
    mutationFn: (args: { sareeId: string; ret: ReturnInfo }) => Promise.resolve(args),
    onSuccess: ({ sareeId, ret }) => {
      queryClient.setQueryData<UnifiedSaree[]>(QUERY_KEY, prev =>
        (prev ?? []).map(s => s.sareeId === sareeId
          ? { ...s, status: "returned", ret }
          : s)
      );
      toast.success("Return recorded");
    },
  });

  const recordSale = useCallback(
    (sareeId: string, sale: SaleInfo) => recordSaleMutation.mutate({ sareeId, sale }),
    [recordSaleMutation],
  );
  const recordReturn = useCallback(
    (sareeId: string, ret: ReturnInfo) => recordReturnMutation.mutate({ sareeId, ret }),
    [recordReturnMutation],
  );

  // Best-effort: the sales endpoint caps pageSize at 100 (ListSaleQueryDto), so
  // this covers the most recent 100 sales. It is a UI guard, not the authority —
  // DispatchService.create still rejects a sold saree outright, and that error
  // is surfaced to the operator.
  const soldSareeIds = useMemo(
    () => new Set((rawSales?.items ?? []).map(s => s.sareeId)),
    [rawSales],
  );

  const value = useMemo(
    () => ({ sarees, soldSareeIds, purchases: SEED_PURCHASE_SUMMARIES, recordSale, recordReturn, isError, error, isLoading, refetch }),
    [sarees, soldSareeIds, isError, error, isLoading, refetch, recordSale, recordReturn],
  );
  return <SalesContext.Provider value={value}>{children}</SalesContext.Provider>;
}

/**
 * Read-only fallback when no provider is mounted, so report screens can be dropped
 * anywhere without every layout having to wrap them first.
 */
const FALLBACK: SalesContextValue = {
  sarees: [],
  soldSareeIds: new Set<string>(),
  purchases: SEED_PURCHASE_SUMMARIES,
  recordSale: () => {},
  recordReturn: () => {},
  isError: false,
  error: null,
  isLoading: false,
  refetch: () => {},
};

export function useSales(): SalesContextValue {
  return useContext(SalesContext) ?? FALLBACK;
}
