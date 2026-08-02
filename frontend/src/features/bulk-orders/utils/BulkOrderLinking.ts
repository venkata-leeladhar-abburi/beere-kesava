// ─── Bulk order ↔ saree linking ───────────────────────────────────────────────
// Sarees don't always carry an explicit bulkOrderRef (only ones added through the
// wholesale/quotation flows do). InventoryPage falls back to matching a saree's
// design + saree type against the open bulk orders, so the same heuristic is
// pulled out here — used by both InventoryPage and the bulk order detail page —
// to keep them from silently drifting apart.
import type { BulkOrder } from "../contexts/BulkOrderContext";

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
