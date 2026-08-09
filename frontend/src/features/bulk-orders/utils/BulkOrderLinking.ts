// ─── Bulk order ↔ saree linking ───────────────────────────────────────────────
// Sarees don't always carry an explicit bulkOrderRef (only ones added through the
// wholesale/quotation flows do). InventoryPage falls back to matching a saree's
// design + saree type against the open bulk orders, so the same heuristic is
// pulled out here — used by both InventoryPage and the bulk order detail page —
// to keep them from silently drifting apart.
import type { BulkOrder } from "../contexts/BulkOrderContext";
import type { ReadySaree, FinishingReturn, Quotation } from "../../finishing/contexts/finishing-types";

/** Invoice shape this module needs — kept structural so PaymentsPage stays uncoupled. */
interface InvoiceLike {
  id: string; customer: string; total: number; paid: number;
  payments?: { amount: number; date: string; utr: string; method: string; firmName?: string }[];
}

export interface OrderMoney {
  amountDue: number;
  amountPaid: number;
  balance: number;
  invoiceId?: string;
  payments: NonNullable<InvoiceLike["payments"]>;
}

/**
 * A bulk order's money position. Orders carry their own amountDue/amountPaid only
 * sometimes, so the matching PaymentsPage invoice wins when one exists — matched
 * on the trailing reference number first, then on customer name. Shared by the
 * All Orders page and the order detail page so their totals can't disagree.
 */
export function resolveOrderMoney(
  order: { ref: string; customer: string; amountDue?: number; amountPaid?: number },
  invoices: InvoiceLike[]
): OrderMoney {
  const refNum = order.ref.match(/ORD-\d{4}-(\d+)/)?.[1] ?? "";
  const matched =
    (refNum ? invoices.find(inv => inv.id.match(/INV-\d{4}-(\d+)/)?.[1] === refNum) : undefined) ??
    invoices.find(inv => inv.customer.toLowerCase() === order.customer.toLowerCase());

  const amountDue = matched ? matched.total : (order.amountDue ?? 0);
  const amountPaid = matched ? matched.paid : (order.amountPaid ?? 0);
  return {
    amountDue,
    amountPaid,
    balance: Math.max(0, amountDue - amountPaid),
    invoiceId: matched?.id,
    payments: matched?.payments ?? [],
  };
}

/**
 * Every distinct saree actually produced for a bulk order — same matching
 * rules as BulkOrderDetailPage's linkedSarees (explicit bulkOrderRef, a
 * linked quotation, or the design+type fallback), but as a plain id set so
 * card-style summaries (BulkOrderCard on the list pages) can show a real
 * "N of total done" instead of the order's own `done` column, which nothing
 * keeps in sync with actual production and so drifts to 0/stale.
 */
export function computeBulkOrderProducedSareeIds(
  orderRef: string,
  bulkOrders: BulkOrder[],
  readySarees: ReadySaree[],
  returns: FinishingReturn[],
  quotations: Quotation[],
): Set<string> {
  const linkedQuotations = quotations.filter(q => q.bulkOrderRef === orderRef);
  const quotationRefBySaree = new Map<string, string>();
  linkedQuotations.forEach(q => q.sarees.forEach(s => quotationRefBySaree.set(s.sareeId, q.quotationNumber)));

  const ids = new Set<string>();

  readySarees.forEach(s => {
    const boRef = resolveBulkOrderRef((s as { bulkOrderRef?: string }).bulkOrderRef, s.designCode, s.sareeType, bulkOrders);
    if (boRef === orderRef || quotationRefBySaree.has(s.id)) ids.add(s.id);
  });

  returns.forEach(r => {
    const boRef = resolveBulkOrderRef(undefined, r.designCode, r.sareeType, bulkOrders);
    const isQuotationLinked = !!r.quotationRef && linkedQuotations.some(q => q.quotationNumber === r.quotationRef);
    if (boRef === orderRef || isQuotationLinked || quotationRefBySaree.has(r.sareeId)) ids.add(r.sareeId);
  });

  linkedQuotations.forEach(q => q.sarees.forEach(s => ids.add(s.sareeId)));

  return ids;
}

export function resolveBulkOrderRef(
  explicitRef: string | undefined,
  designCode: string,
  sareeType: string,
  bulkOrders: BulkOrder[]
): string | undefined {
  if (explicitRef) return explicitRef;
  const match = bulkOrders.find(bo =>
    bo.design === designCode &&
    (bo.sareeType.toLowerCase().includes(sareeType.toLowerCase()) ||
     sareeType.toLowerCase().includes(bo.sareeType.split(" · ")[0].toLowerCase()))
  );
  return match?.ref;
}
