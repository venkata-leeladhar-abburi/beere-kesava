import type { BackendSaleRecord, BackendSaleReturn } from "../../../shared/api/sales";
import type { WholesaleDispatchPiece } from "../../../shared/api/dispatch";
import type { SaleInfo, SareeSaleStatus } from "./sales-types";

const displayDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

/**
 * Where one saree stands, from its latest sale, return and WHOLESALE dispatch.
 *
 * A wholesale dispatch is the sale — the backend writes no SaleRecord for it
 * (see SalesService.registerDispatchedReturns), so without it every
 * dispatched piece read as unsold. It counts unless a return came in after
 * it: a buyer sending pieces back off the consignment undoes the sale, while
 * an older return that was restocked and then dispatched does not.
 */
export function resolveSaleStatus(
  sale: BackendSaleRecord | undefined,
  ret: BackendSaleReturn | undefined,
  dispatch: WholesaleDispatchPiece | undefined,
  customerFallback = "Counter Customer"
): { status: SareeSaleStatus; sale: SaleInfo | null } {
  const dispatchedAt = dispatch ? new Date(dispatch.dispatchDate).getTime() : 0;
  const dispatchCounts =
    dispatch !== undefined &&
    (!ret || new Date(ret.returnDate).getTime() < dispatchedAt) &&
    (!sale || new Date(sale.saleDate).getTime() <= dispatchedAt);

  const saleInfo: SaleInfo | null =
    dispatch && (dispatchCounts || !sale)
      ? {
          saleRef: dispatch.invoiceNumber ?? dispatch.dispatchId,
          channel: "wholesale",
          date: displayDate(dispatch.dispatchDate),
          customer: dispatch.customerName ?? "Wholesale Customer",
          amount: dispatch.amount,
        }
      : sale
        ? {
            saleRef: sale.saleRef,
            channel: sale.channel === "WHOLESALE" ? "wholesale" : "retail",
            date: displayDate(sale.saleDate),
            customer: customerFallback,
            amount: Number(sale.amount),
          }
        : null;

  const status: SareeSaleStatus = dispatchCounts
    ? "wholesale"
    : ret
      ? "returned"
      : sale
        ? sale.channel === "WHOLESALE"
          ? "wholesale"
          : "retail"
        : "unsold";

  return { status, sale: saleInfo };
}
