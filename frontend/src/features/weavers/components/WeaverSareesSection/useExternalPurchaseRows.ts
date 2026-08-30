import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { purchasesApi, type BackendPurchase, type BackendPurchaseSareeLine } from "@/shared/api/purchases";
import { resolveAssetUrl } from "@/shared/api/uploads";
import { pieceCodeFromLineCode, computeFinalAmount } from "@/features/suppliers";
import { useAuthGate } from "@/contexts/AuthContext";
import type { UnifiedSaree } from "@/features/customers";
import type { WeaverSareeRow } from "./types";

/**
 * Externally purchased sarees, as inventory rows.
 *
 * They deliberately do NOT come from the /inventory stock ledger: an external
 * purchase lives in Purchase + PurchaseSareeLine and is never turned into a
 * production Saree row, so the ledger reports zero of them. Reading the
 * purchases straight through means every column — supplier, invoice, weight,
 * real buying/selling price, photo, payment status — is the value the buyer
 * actually entered rather than a placeholder.
 *
 * One row per PHYSICAL piece (a line bought in bulk covers several), matching
 * how the External Purchases saree list and the printed barcodes treat them.
 */
export function useExternalPurchaseRows(enabled: boolean): {
  rows: WeaverSareeRow[];
  isLoading: boolean;
  isError: boolean;
} {
  // GET /purchases is ACCOUNTANT-only (ADMIN/SUPERADMIN bypass every role
  // check), so other portals would just 403 on this.
  // check), but we now allow SHOP so inventory can load external purchases.
  const allowed = useAuthGate("accountant", "admin", "superadmin", "shop");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["purchases", "external-inventory"],
    // "full" so sareeLines (and their photos) come back — the default
    // "summary" view strips exactly the fields this table exists to show.
    queryFn: () => purchasesApi.list(100, 1, undefined, undefined, "full"),
    enabled: enabled && allowed,
    staleTime: 60_000,
  });

  return useMemo(() => ({
    isLoading,
    isError,
    rows: (data?.items ?? []).flatMap(purchaseRows),
  }), [data, isLoading, isError]);
}

function purchaseRows(p: BackendPurchase): WeaverSareeRow[] {
  const supplier = p.supplier?.name ?? p.supplierName ?? "—";
  const location = p.location
    ?? (p.supplier ? `${p.supplier.city ?? ""}, ${p.supplier.state ?? ""}`.replace(/^, |, $/, "") : "");
  const paymentStatus = p.status === "PAID" ? "Paid" : p.status === "PARTIAL" ? "Partial" : "Pending";

  return p.sareeLines.flatMap(line => {
    const qty = Number(line.quantity) || 1;
    const price = Number(line.price) || 0;
    const sellPercent = Number(line.sellPercent) || 0;
    const returnedQty = Math.min(Number(line.returnedQuantity) || 0, qty);

    return Array.from({ length: qty }, (_, i) => {
      const pieceNo = i + 1;
      // A line only records HOW MANY pieces came back, not which — the first
      // `returnedQuantity` pieces are treated as the returned ones, exactly as
      // expandSareePieces does for the purchase screens.
      const returned = pieceNo <= returnedQty;
      return pieceRow({ p, line, pieceNo, qty, price, sellPercent, returned, supplier, location, paymentStatus });
    });
  });
}

function pieceRow({
  p, line, pieceNo, qty, price, sellPercent, returned, supplier, location, paymentStatus,
}: {
  p: BackendPurchase;
  line: BackendPurchaseSareeLine;
  pieceNo: number;
  qty: number;
  price: number;
  sellPercent: number;
  returned: boolean;
  supplier: string;
  location: string;
  paymentStatus: "Paid" | "Pending" | "Partial";
}): WeaverSareeRow {
  const sareeId = pieceCodeFromLineCode(line.code, pieceNo);
  const purchaseDate = p.date?.split("T")[0] ?? null;

  const stock: UnifiedSaree = {
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
    // A returned piece is no longer ours to sell; everything else is
    // outstanding stock until a sale is recorded against it.
    status: "unsold",
    sale: null,
    ret: null,
    ageDays: purchaseDate
      ? Math.max(0, Math.floor((Date.now() - new Date(purchaseDate).getTime()) / 86_400_000))
      : 0,
  };

  return {
    sareeId,
    batchId: null,
    loomNumber: null,
    sareeTypeCode: null,
    sareeTypeName: line.sareeType ?? null,
    bulkOrderLabel: null,
    designCode: null,
    color: line.color || null,
    // The piece's own photo, falling back to nothing rather than the line's —
    // consistent with the purchase screens, where a serial's photo is not
    // claimed to be any individual piece's photo.
    receivedPhotoUrl: resolveAssetUrl(line.pieceImageUrls?.[pieceNo - 1] || null),
    isAssigned: false,
    assignedDate: null,
    qcStatus: "pending",
    receivedDate: null,
    qcDate: null,
    defects: [],
    makingCharge: null,
    deduction: null,
    payable: null,
    finishingStatus: "none",
    finishingAssignedDate: null,
    finishingCompletedDate: null,
    dispatched: false,
    sold: false,
    stock,
    ownerKind: null,
    ownerId: null,
    ownerLabel: null,
    external: {
      lineCode: line.code,
      pieceNo,
      lineQuantity: qty,
      returned,
      paymentStatus,
      linePhotoUrl: resolveAssetUrl(line.imageUrl),
      gstNumber: p.gstNumber ?? null,
    },
  };
}
