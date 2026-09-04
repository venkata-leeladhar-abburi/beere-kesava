import React, { createContext, useCallback, useContext, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export * from "./sales-types";
export * from "./sales-seed";
import { UnifiedSaree, SaleInfo, ReturnInfo, SalesContextValue, SareeOrigin, SareeSaleStatus, PurchaseSummary } from "./sales-types";
import { SEED_PURCHASE_SUMMARIES } from "./sales-seed";

import { inventoryApi } from "../../../shared/api/inventory";
import { salesApi } from "../../../shared/api/sales";
import { purchasesApi, type BackendPurchase } from "../../../shared/api/purchases";
import { pieceCodeFromLineCode, computeFinalAmount } from "@/features/suppliers";
import { useAuthGate } from "../../../contexts/AuthContext";

const PURCHASE_STATUS: Record<BackendPurchase["status"], PurchaseSummary["status"]> = {
  PAID: "Paid", PENDING: "Pending", PARTIAL: "Partial",
};

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

  // External purchases never become an /inventory row (see
  // useExternalPurchaseRows.ts) — they live only in Purchase +
  // PurchaseSareeLine, so they have to be read from here and folded into
  // `sarees` for external stock to show up anywhere in this context.
  const { data: rawPurchases, isError: isPurchasesError, error: purchasesError, isLoading: isPurchasesLoading, refetch: refetchPurchases } = useQuery({
    queryKey: ["backend-purchases-list", "full"],
    queryFn: () => purchasesApi.list(100, 1, undefined, undefined, "full"),
    enabled,
  });

  const isError = isInventoryError || isSalesError || isReturnsError || isPurchasesError;
  const error = inventoryError ?? salesError ?? returnsError ?? purchasesError ?? null;
  const isLoading = isInventoryLoading || isSalesLoading || isReturnsLoading || isPurchasesLoading;
  const refetch = useCallback(() => { void refetchInventory(); void refetchSales(); void refetchReturns(); void refetchPurchases(); }, [refetchInventory, refetchSales, refetchReturns, refetchPurchases]);

  const externalSarees = useMemo<UnifiedSaree[]>(() => {
    if (!rawPurchases || rawPurchases.items.length === 0) return [];
    const salesMap = new Map((rawSales?.items ?? []).map(s => [s.sareeId, s]));
    const returnsMap = new Map((rawReturns?.items ?? []).map(r => [r.sareeId, r]));

    return rawPurchases.items.flatMap(p => {
      const supplier = p.supplier?.name ?? p.supplierName ?? "External Supplier";
      const location = p.location
        ?? (p.supplier ? `${p.supplier.city ?? ""}, ${p.supplier.state ?? ""}`.replace(/^, |, $/, "") : "");
      const purchaseDate = p.date?.split("T")[0] ?? null;

      return p.sareeLines.flatMap(line => {
        const qty = Number(line.quantity) || 1;
        const price = Number(line.price) || 0;
        const sellPercent = Number(line.sellPercent) || 0;
        const returnedQty = Math.min(Number(line.returnedQuantity) || 0, qty);

        return Array.from({ length: qty }, (_, i): UnifiedSaree => {
          const pieceNo = i + 1;
          const sareeId = pieceCodeFromLineCode(line.code, pieceNo);
          const sale = salesMap.get(sareeId);
          const ret = returnsMap.get(sareeId);
          // A line only records HOW MANY pieces came back, not which — the
          // first `returnedQuantity` pieces are treated as the returned
          // ones, matching useExternalPurchaseRows.ts and the purchase screens.
          const returnedToSupplier = pieceNo <= returnedQty;
          const status: SareeSaleStatus = ret ? "returned"
            : sale ? (sale.channel === "WHOLESALE" ? "wholesale" : "retail")
            : "unsold";
          const ageDays = purchaseDate
            ? Math.max(0, Math.floor((Date.now() - new Date(purchaseDate).getTime()) / 86_400_000))
            : 0;

          return {
            sareeId,
            origin: "external",
            purchaseId: p.id,
            supplier,
            supplierLocation: location || "—",
            invoiceNumber: p.invoiceNumber ?? "—",
            purchaseDate,
            batchId: null,
            designCode: "",
            sareeTypeCode: "",
            sareeTypeName: line.sareeType ?? "",
            weight: line.weight ?? "",
            qcDate: purchaseDate ?? "",
            costPrice: price,
            sellPercent,
            finalAmount: computeFinalAmount(price, sellPercent, 1),
            // A piece returned to the supplier is no longer stock at all —
            // outstanding-stock views should not count it as unsold.
            status: returnedToSupplier ? "returned" : status,
            sale: sale ? {
              saleRef: sale.saleRef,
              channel: sale.channel === "WHOLESALE" ? "wholesale" : "retail",
              date: new Date(sale.saleDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
              customer: "Counter Customer",
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
      });
    });
  }, [rawPurchases, rawSales, rawReturns]);

  const purchases = useMemo<PurchaseSummary[]>(() => {
    if (!rawPurchases || rawPurchases.items.length === 0) return SEED_PURCHASE_SUMMARIES;
    return rawPurchases.items.map(p => ({
      id: p.id,
      supplier: p.supplier?.name ?? p.supplierName ?? "External Supplier",
      location: p.location ?? (p.supplier ? `${p.supplier.city ?? ""}, ${p.supplier.state ?? ""}`.replace(/^, |, $/, "") : ""),
      date: p.date?.split("T")[0] ?? "",
      invoiceNumber: p.invoiceNumber ?? "—",
      gstNumber: p.supplier?.gstCode ?? "—",
      billAmount: Number(p.billAmount) || 0,
      paidAmount: p.status === "PAID" ? Number(p.billAmount) || 0 : 0,
      status: PURCHASE_STATUS[p.status],
      sareeCount: p.sareeCount,
    }));
  }, [rawPurchases]);

  const sarees = useMemo<UnifiedSaree[]>(() => {
    if (!rawInventory || rawInventory.length === 0) return externalSarees;
    const salesMap = new Map((rawSales?.items ?? []).map(s => [s.sareeId, s]));
    const returnsMap = new Map((rawReturns?.items ?? []).map(r => [r.sareeId, r]));

    return [...rawInventory.map((item): UnifiedSaree => {
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
        designCode: item.designCode ?? "",
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
    }), ...externalSarees];
  }, [rawInventory, rawSales, rawReturns, externalSarees]);

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
    () => ({ sarees, soldSareeIds, purchases, recordSale, recordReturn, isError, error, isLoading, refetch }),
    [sarees, soldSareeIds, purchases, isError, error, isLoading, refetch, recordSale, recordReturn],
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
