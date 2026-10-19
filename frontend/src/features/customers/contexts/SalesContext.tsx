import React, { createContext, useCallback, useContext, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export * from "./sales-types";
export * from "./sales-seed";
import {
  UnifiedSaree,
  SaleInfo,
  ReturnInfo,
  SalesContextValue,
  PurchaseSummary,
} from "./sales-types";
import { SEED_PURCHASE_SUMMARIES, currentReturn } from "./sales-seed";

import { inventoryApi } from "../../../shared/api/inventory";
import { salesApi } from "../../../shared/api/sales";
import { dispatchApi } from "../../../shared/api/dispatch";
import { resolveSaleStatus } from "./sale-status";
import { toInHouseSaree } from "./in-house-saree";
import { purchasesApi, type BackendPurchase } from "../../../shared/api/purchases";
import {
  pieceCodeFromLineCode,
  computeFinalAmount,
  returnedPieceSet,
} from "@/features/suppliers/model";
import { useAuthGate } from "../../../contexts/AuthContext";

const PURCHASE_STATUS: Record<BackendPurchase["status"], PurchaseSummary["status"]> = {
  PAID: "Paid",
  PENDING: "Pending",
  PARTIAL: "Partial",
};

const SalesContext = createContext<SalesContextValue | null>(null);

// Sales and returns arrive newest first, and a saree can have more than one
// of each (sold, returned, sold again), so keep the first row seen per saree —
// the latest. `new Map(rows)` would keep the last, i.e. the oldest.
function latestBySaree<T extends { sareeId: string }>(rows: readonly T[] = []): Map<string, T> {
  const map = new Map<string, T>();
  for (const row of rows) if (!map.has(row.sareeId)) map.set(row.sareeId, row);
  return map;
}

const QUERY_KEY = ["sales", "sarees"] as const;

export function SalesProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  // GET /inventory allows WORKER too, but GET /sales and GET
  // /sales/returns/all (fetched below) are SHOP/ACCOUNTANT-only (ADMIN/
  // SUPERADMIN bypass every role check) — WORKER/WEAVER would 403 on those.
  // This provider is shared across every portal, so an unscoped gate fired
  // all three for them too.
  const enabled = useAuthGate("shop", "accountant", "admin", "superadmin");

  const {
    data: rawInventory = [],
    isError: isInventoryError,
    error: inventoryError,
    isLoading: isInventoryLoading,
    refetch: refetchInventory,
  } = useQuery({
    // Every woven saree, sold and dispatched ones too — GET /inventory drops
    // those, which left weavers and looms with no sales on the rankings.
    // Under the same key prefix, so invalidating "backend-inventory-list"
    // (NewSaleFlow) still refreshes it.
    queryKey: ["backend-inventory-list", "woven"],
    queryFn: () => inventoryApi.listWoven(),
    enabled,
  });

  const {
    data: rawSales,
    isError: isSalesError,
    error: salesError,
    isLoading: isSalesLoading,
    refetch: refetchSales,
  } = useQuery({
    queryKey: ["backend-sales-list"],
    // Every sale, not the first page — the reports count sold and unsold
    // stock from this, and a 100-row page silently undercounted both.
    queryFn: () => salesApi.listAll(),
    enabled,
  });

  const {
    data: rawReturns,
    isError: isReturnsError,
    error: returnsError,
    isLoading: isReturnsLoading,
    refetch: refetchReturns,
  } = useQuery({
    queryKey: ["backend-returns-list"],
    queryFn: () => salesApi.listAllReturns(),
    enabled,
  });

  // External purchases never become an /inventory row (see
  // useExternalPurchaseRows.ts) — they live only in Purchase +
  // PurchaseSareeLine, so they have to be read from here and folded into
  // `sarees` for external stock to show up anywhere in this context.
  const {
    data: rawPurchases,
    isError: isPurchasesError,
    error: purchasesError,
    isLoading: isPurchasesLoading,
    refetch: refetchPurchases,
  } = useQuery({
    queryKey: ["backend-purchases-list", "full"],
    queryFn: () => purchasesApi.listAll("full"),
    enabled,
  });

  // Pieces that left on a WHOLESALE dispatch. Those are wholesale sales with
  // no SaleRecord, so without this every one of them read as unsold stock.
  // Not part of isError: the figures are still right for everything sold
  // over the counter if this read fails, so it shouldn't blank the screens.
  const {
    data: rawWholesalePieces,
    isLoading: isWholesalePiecesLoading,
    refetch: refetchWholesalePieces,
  } = useQuery({
    queryKey: ["backend-dispatch-wholesale-pieces"],
    queryFn: () => dispatchApi.listWholesalePieces(),
    enabled,
  });

  const isError = isInventoryError || isSalesError || isReturnsError || isPurchasesError;
  const error = inventoryError ?? salesError ?? returnsError ?? purchasesError ?? null;
  const isLoading =
    isInventoryLoading ||
    isSalesLoading ||
    isReturnsLoading ||
    isPurchasesLoading ||
    isWholesalePiecesLoading;
  const refetch = useCallback(() => {
    void refetchInventory();
    void refetchSales();
    void refetchReturns();
    void refetchPurchases();
    void refetchWholesalePieces();
  }, [refetchInventory, refetchSales, refetchReturns, refetchPurchases, refetchWholesalePieces]);

  const externalSarees = useMemo<UnifiedSaree[]>(() => {
    if (!rawPurchases || rawPurchases.length === 0) return [];
    const salesMap = latestBySaree(rawSales);
    const returnsMap = latestBySaree(rawReturns);
    // Newest dispatch first, so this keeps the latest one per saree.
    const dispatchMap = latestBySaree(rawWholesalePieces);

    return rawPurchases.flatMap((p) => {
      const supplier = p.supplier?.name ?? p.supplierName ?? "External Supplier";
      const location =
        p.location ??
        (p.supplier
          ? `${p.supplier.city ?? ""}, ${p.supplier.state ?? ""}`.replace(/^, |, $/, "")
          : "");
      const purchaseDate = p.date?.split("T")[0] ?? null;

      return p.sareeLines.flatMap((line) => {
        const qty = Number(line.quantity) || 1;
        const price = Number(line.price) || 0;
        const sellPercent = Number(line.sellPercent) || 0;
        const returnedSet = returnedPieceSet(
          qty,
          Number(line.returnedQuantity) || 0,
          line.returnedPieceNos
        );

        return Array.from({ length: qty }, (_, i): UnifiedSaree => {
          const pieceNo = i + 1;
          const sareeId = pieceCodeFromLineCode(line.code, pieceNo);
          const latestSale = salesMap.get(sareeId);
          const ret = currentReturn(returnsMap.get(sareeId), latestSale);
          const { status, sale } = resolveSaleStatus(latestSale, ret, dispatchMap.get(sareeId));
          // Same rule as useExternalPurchaseRows.ts and the purchase screens.
          const returnedToSupplier = returnedSet.has(pieceNo);
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
            // outstanding-stock views should not count it as unsold, and it
            // is not a customer return either (see isCustomerReturn).
            status: returnedToSupplier ? "returned" : status,
            returnedToSupplier,
            sale,
            ret: ret
              ? {
                  returnRef: ret.returnRef,
                  date: new Date(ret.returnDate).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }),
                  reason: ret.reason ?? "",
                  refundAmount: Number(ret.refundAmount ?? 0),
                  restocked: ret.restocked,
                }
              : null,
            ageDays,
          };
        });
      });
    });
  }, [rawPurchases, rawSales, rawReturns, rawWholesalePieces]);

  const purchases = useMemo<PurchaseSummary[]>(() => {
    if (!rawPurchases || rawPurchases.length === 0) return SEED_PURCHASE_SUMMARIES;
    return rawPurchases.map((p) => {
      const billAmount = Number(p.billAmount) || 0;
      // Sarees sent back to the supplier are credited off the bill.
      const creditedAmount = Math.min(Number(p.creditedAmount) || 0, billAmount);
      const owed = billAmount - creditedAmount;
      // Absent until the backend that sends it is deployed — fall back to the
      // status alone then, without flagging anything.
      const hasPaidAmount = p.paidAmount !== undefined;
      const recordedPaid = hasPaidAmount
        ? Number(p.paidAmount) || 0
        : p.status === "PAID"
          ? billAmount
          : 0;
      // Paid is what the supplier payments add up to. Older purchases have no
      // linked payments and a status typed by hand — for those the PAID label
      // is the only record, so it still counts, but is flagged as unconfirmed.
      const paidWithoutRecord =
        hasPaidAmount && recordedPaid === 0 && p.status === "PAID" && owed > 0;
      return {
        id: p.id,
        supplier: p.supplier?.name ?? p.supplierName ?? "External Supplier",
        location:
          p.location ??
          (p.supplier
            ? `${p.supplier.city ?? ""}, ${p.supplier.state ?? ""}`.replace(/^, |, $/, "")
            : ""),
        date: p.date?.split("T")[0] ?? "",
        invoiceNumber: p.invoiceNumber ?? "—",
        gstNumber: p.supplier?.gstCode ?? "—",
        billAmount,
        creditedAmount,
        paidAmount: paidWithoutRecord ? owed : Math.min(recordedPaid, owed),
        status: PURCHASE_STATUS[p.status],
        paidWithoutRecord,
        // Pieces still with us, counted from the lines (same rule as the
        // External Purchases table) — the stored aggregate is only a fallback.
        sareeCount: p.sareeLines?.length
          ? p.sareeLines.reduce(
              (sum, l) =>
                sum + Math.max(0, l.quantity - Math.min(l.returnedQuantity ?? 0, l.quantity)),
              0
            )
          : p.sareeCount,
      };
    });
  }, [rawPurchases]);

  const sarees = useMemo<UnifiedSaree[]>(() => {
    if (!rawInventory || rawInventory.length === 0) return externalSarees;
    const salesMap = latestBySaree(rawSales);
    const returnsMap = latestBySaree(rawReturns);
    const dispatchMap = latestBySaree(rawWholesalePieces);

    return [
      ...rawInventory.map((item) =>
        toInHouseSaree(
          item,
          salesMap.get(item.sareeId),
          currentReturn(returnsMap.get(item.sareeId), salesMap.get(item.sareeId)),
          dispatchMap.get(item.sareeId)
        )
      ),
      ...externalSarees,
    ];
  }, [rawInventory, rawSales, rawReturns, rawWholesalePieces, externalSarees]);

  const recordSaleMutation = useMutation({
    mutationFn: (args: { sareeId: string; sale: SaleInfo }) => Promise.resolve(args),
    onSuccess: ({ sareeId, sale }) => {
      queryClient.setQueryData<UnifiedSaree[]>(QUERY_KEY, (prev) =>
        (prev ?? []).map((s) =>
          s.sareeId === sareeId ? { ...s, status: sale.channel, sale, ageDays: 0 } : s
        )
      );
      toast.success("Sale recorded");
    },
  });

  const recordReturnMutation = useMutation({
    mutationFn: (args: { sareeId: string; ret: ReturnInfo }) => Promise.resolve(args),
    onSuccess: ({ sareeId, ret }) => {
      queryClient.setQueryData<UnifiedSaree[]>(QUERY_KEY, (prev) =>
        (prev ?? []).map((s) => (s.sareeId === sareeId ? { ...s, status: "returned", ret } : s))
      );
      toast.success("Return recorded");
    },
  });

  const recordSale = useCallback(
    (sareeId: string, sale: SaleInfo) => recordSaleMutation.mutate({ sareeId, sale }),
    [recordSaleMutation]
  );
  const recordReturn = useCallback(
    (sareeId: string, ret: ReturnInfo) => recordReturnMutation.mutate({ sareeId, ret }),
    [recordReturnMutation]
  );

  // Every sale on record (rawSales walks every page). It is a UI guard, not the authority —
  // DispatchService.create still rejects a sold saree outright, and that error
  // is surfaced to the operator.
  const soldSareeIds = useMemo(() => new Set((rawSales ?? []).map((s) => s.sareeId)), [rawSales]);

  const value = useMemo(
    () => ({
      sarees,
      soldSareeIds,
      purchases,
      recordSale,
      recordReturn,
      isError,
      error,
      isLoading,
      refetch,
    }),
    [sarees, soldSareeIds, purchases, isError, error, isLoading, refetch, recordSale, recordReturn]
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
