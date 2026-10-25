import { PrismaService } from "../prisma/prisma.service";
import { creditedAmount } from "./purchases.service";

/**
 * Which purchases each supplier payment actually paid for.
 *
 * A payment recorded against one purchase settles that purchase. A "general"
 * payment (no purchase named — "here's ₹1,24,996 for everything") used to
 * settle nothing: the supplier's balance dropped to zero while every one of
 * their purchases stayed Pending, so the firm ledger kept reporting them as
 * payable. A general payment is now applied to the supplier's purchases that
 * still have money owed, oldest first — the ones booked to the paying firm
 * before any other firm's — and whatever is left over after every purchase
 * is covered stays unapplied (an advance).
 *
 * This is the one place that rule lives: purchase statuses, the purchases
 * list's paid figure and the firm ledger all read from it.
 */

export interface AllocationPurchase {
  id: string;
  /** Supplier the purchase is from — older free-text purchases are resolved by name. */
  supplierId: string;
  firmId: string | null;
  date: Date;
  /** What is owed on the bill, net of returned sarees, in rupees. */
  owed: number;
}

export interface AllocationPayment {
  id: string;
  supplierId: string;
  firmId: string | null;
  purchaseId: string | null;
  date: Date;
  amount: number;
  method?: string | null;
  utr?: string | null;
}

export interface PaymentAllocation {
  paymentId: string;
  purchaseId: string;
  amount: number;
}

export interface SupplierAllocation {
  /** Paid against each purchase, in rupees — linked payments plus its share of general ones. */
  paidByPurchase: Map<string, number>;
  /** Every (payment → purchase) slice, in the order they were applied. */
  allocations: PaymentAllocation[];
  /** What each payment did NOT go towards (an advance beyond everything owed). */
  unallocatedByPayment: Map<string, number>;
}

const paise = (rupees: number) => Math.round(rupees * 100);

export function allocateSupplierPayments(
  purchases: AllocationPurchase[],
  payments: AllocationPayment[],
): SupplierAllocation {
  const purchaseById = new Map(purchases.map((p) => [p.id, p]));
  const remaining = new Map(purchases.map((p) => [p.id, Math.max(0, paise(p.owed))]));
  const paid = new Map<string, number>(purchases.map((p) => [p.id, 0]));
  const allocations: PaymentAllocation[] = [];
  const unallocated = new Map<string, number>();

  const apply = (paymentId: string, purchaseId: string, amountPaise: number) => {
    if (amountPaise <= 0) return;
    paid.set(purchaseId, (paid.get(purchaseId) ?? 0) + amountPaise);
    remaining.set(purchaseId, Math.max(0, (remaining.get(purchaseId) ?? 0) - amountPaise));
    allocations.push({ paymentId, purchaseId, amount: amountPaise / 100 });
  };

  const byDate = (a: { date: Date; id: string }, b: { date: Date; id: string }) =>
    a.date.getTime() - b.date.getTime() || a.id.localeCompare(b.id);
  const ordered = [...payments].sort(byDate);

  // A payment that names its purchase pays that purchase in full, even past
  // the bill — the accountant chose where it went.
  for (const p of ordered) {
    if (p.purchaseId && purchaseById.has(p.purchaseId)) apply(p.id, p.purchaseId, paise(p.amount));
  }

  const purchasesBySupplier = new Map<string, AllocationPurchase[]>();
  for (const p of [...purchases].sort(byDate)) {
    const list = purchasesBySupplier.get(p.supplierId) ?? [];
    list.push(p);
    purchasesBySupplier.set(p.supplierId, list);
  }

  for (const p of ordered) {
    if (p.purchaseId && purchaseById.has(p.purchaseId)) continue;
    let left = paise(p.amount);
    const own = purchasesBySupplier.get(p.supplierId) ?? [];
    const queue = p.firmId
      ? [...own.filter((x) => x.firmId === p.firmId), ...own.filter((x) => x.firmId !== p.firmId)]
      : own;
    for (const purchase of queue) {
      if (left <= 0) break;
      const take = Math.min(left, remaining.get(purchase.id) ?? 0);
      apply(p.id, purchase.id, take);
      left -= take;
    }
    if (left > 0) unallocated.set(p.id, left / 100);
  }

  return {
    paidByPurchase: new Map([...paid].map(([id, v]) => [id, v / 100])),
    allocations,
    unallocatedByPayment: unallocated,
  };
}

const lineSelect = { price: true, quantity: true, returnedQuantity: true } as const;

/**
 * Loads everything needed to allocate the given suppliers' payments — all of
 * their purchases (including older ones recorded by typed name only) and all
 * of their payments, whichever firm either is booked to — and allocates them.
 */
export async function loadSupplierAllocation(
  prisma: Pick<PrismaService, "supplier" | "purchase" | "supplierPayment">,
  supplierIds: Iterable<string>,
) {
  const ids = [...new Set(supplierIds)];
  if (ids.length === 0) {
    return { ...allocateSupplierPayments([], []), purchases: [], payments: [] };
  }
  const suppliers = await prisma.supplier.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } });
  const idByName = new Map(suppliers.map((s) => [s.name, s.id]));

  const [purchaseRows, paymentRows] = await Promise.all([
    prisma.purchase.findMany({
      where: {
        OR: [
          { supplierId: { in: ids } },
          { supplierId: null, supplierName: { in: suppliers.map((s) => s.name) } },
        ],
      },
      select: {
        id: true,
        supplierId: true,
        supplierName: true,
        firmId: true,
        date: true,
        billAmount: true,
        sareeLines: { select: lineSelect },
      },
    }),
    prisma.supplierPayment.findMany({
      where: { supplierId: { in: ids } },
      select: { id: true, supplierId: true, firmId: true, purchaseId: true, date: true, amount: true, method: true, utr: true },
    }),
  ]);

  const purchases: AllocationPurchase[] = purchaseRows.flatMap((p) => {
    const supplierId = p.supplierId ?? (p.supplierName ? idByName.get(p.supplierName) : undefined);
    if (!supplierId) return [];
    const bill = Number(p.billAmount) || 0;
    return [{ id: p.id, supplierId, firmId: p.firmId, date: p.date, owed: bill - creditedAmount(bill, p.sareeLines) }];
  });
  const payments: AllocationPayment[] = paymentRows.map((p) => ({
    id: p.id,
    supplierId: p.supplierId,
    firmId: p.firmId,
    purchaseId: p.purchaseId,
    date: p.date,
    amount: Number(p.amount),
    method: p.method,
    utr: p.utr,
  }));

  return { ...allocateSupplierPayments(purchases, payments), purchases, payments };
}
