import type { WovenSaree } from "../../../shared/api/inventory";
import type { BackendSaleRecord, BackendSaleReturn } from "../../../shared/api/sales";
import type { WholesaleDispatchPiece } from "../../../shared/api/dispatch";
import { resolveSaleStatus } from "./sale-status";
import type { SareeOrigin, UnifiedSaree } from "./sales-types";

const displayDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

/**
 * One woven saree (GET /inventory/woven) as SalesContext holds it.
 *
 * Sold and dispatched pieces are on that list too, so where the saree stands
 * comes from its latest sale, return and WHOLESALE dispatch. A SHOP dispatch
 * is not passed in: a piece moved to our own showroom is still our stock, and
 * stays unsold until the shop sells it.
 */
export function toInHouseSaree(
  item: WovenSaree,
  sale: BackendSaleRecord | undefined,
  ret: BackendSaleReturn | undefined,
  dispatch: WholesaleDispatchPiece | undefined
): UnifiedSaree {
  const isExt = item.source === "external";
  const isWvr = item.source === "outsourced";
  const origin: SareeOrigin = isExt ? "external" : isWvr ? "weaver" : "factoryLoom";
  const resolved = resolveSaleStatus(sale, ret, dispatch, item.customer ?? "Counter Customer");

  const ageDays = item.qcDate
    ? Math.max(
        0,
        Math.floor((Date.now() - new Date(item.qcDate).getTime()) / (1000 * 60 * 60 * 24))
      )
    : 5;

  return {
    sareeId: item.sareeId,
    origin,
    weaverId: item.weaverId,
    weaverName: item.weaverName,
    // For a weaver saree, loomNumber is the weaver's own loom digit. For a
    // factory-loom saree it's now the loom's display code ("Loom-002"),
    // which is already the label — don't parse it or re-prefix it.
    weaverLoom:
      origin === "weaver" && item.loomNumber ? Number.parseInt(item.loomNumber, 10) || null : null,
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
    qcDate: item.qcDate ? displayDate(item.qcDate) : "Recent",
    costPrice: 5000,
    sellPercent: 20,
    finalAmount: 8500,
    status: resolved.status,
    sale: resolved.sale,
    ret: ret
      ? {
          returnRef: ret.returnRef,
          date: displayDate(ret.returnDate),
          reason: ret.reason ?? "",
          refundAmount: Number(ret.refundAmount ?? 0),
          restocked: ret.restocked,
        }
      : null,
    ageDays,
  };
}
