/**
 * The Retail Sales / Wholesale Sales notifications that past sales would
 * have produced, for any sale or wholesale dispatch the live app never
 * announced — sales from before those notifications existed, and external-
 * purchase sarees, which raised no notification at all until the sell path
 * for them did.
 *
 * Shared by backfill-sale-notifications.ts (sales only) and the general
 * backfill-notifications.ts, so the two can never write different shapes.
 */
import type { PrismaClient } from "../src/generated/prisma/client";
import { loadSareeDetails } from "../src/sales/saree-details";

export interface PlannedSaleNotification {
  type: string;
  createdAt: Date;
  payload: Record<string, unknown>;
}

/**
 * Sarees on one counter bill were recorded seconds apart. Sales for the same
 * customer, paid the same way, with no more than this between consecutive
 * ones are treated as one bill — the live app now groups them by an explicit
 * bill id, which old sales do not have.
 */
const SAME_BILL_GAP_MS = 10 * 60 * 1000;

const SALE_TYPES = ["RETAIL_BILL_RECORDED", "RETAIL_SALE_RECORDED", "WHOLESALE_SALE_RECORDED", "SHOP_SALE_RECORDED"];

const n = (v: unknown) => Number(v ?? 0);

/** saleRefs and dispatch ids the live app has already announced. */
async function alreadyAnnounced(prisma: PrismaClient) {
  const rows = await prisma.notification.findMany({
    where: { type: { in: [...SALE_TYPES, "WHOLESALE_DISPATCH_RECORDED"] } },
    select: { payload: true },
  });
  const saleRefs = new Set<string>();
  const dispatchIds = new Set<string>();
  for (const { payload } of rows) {
    const p = (payload ?? {}) as {
      saleRef?: string; dispatchId?: string; lines?: { saleRef?: string }[]; backfilled?: boolean;
    };
    // Filtered here, not in the query: `NOT { payload.backfilled = true }`
    // in SQL also drops every row that has no `backfilled` key at all —
    // i.e. every live notification — because the comparison is NULL there.
    if (p.backfilled) continue;
    if (p.saleRef) saleRefs.add(p.saleRef);
    if (p.dispatchId) dispatchIds.add(p.dispatchId);
    for (const l of p.lines ?? []) if (l.saleRef) saleRefs.add(l.saleRef);
  }
  return { saleRefs, dispatchIds };
}

export async function planSaleNotifications(prisma: PrismaClient): Promise<PlannedSaleNotification[]> {
  const planned: PlannedSaleNotification[] = [];
  const announced = await alreadyAnnounced(prisma);

  const sales = (
    await prisma.saleRecord.findMany({
      include: { customer: true, soldBy: { select: { firstName: true, lastName: true } } },
      orderBy: { date: "asc" },
    })
  ).filter((s) => !announced.saleRefs.has(s.saleRef));

  // PrismaService is a PrismaClient subclass with nothing the loader uses.
  const details = await loadSareeDetails(prisma as never, sales.map((s) => s.sareeId));

  const header = (s: (typeof sales)[number]) => ({
    channel: s.channel,
    customerName: s.customer.name,
    customerPhone: s.customer.phone,
    paymentMethod: s.paymentMethod,
    paymentRef: s.paymentRef,
    soldByName: s.soldBy ? `${s.soldBy.firstName} ${s.soldBy.lastName}`.trim() : null,
  });
  const line = (s: (typeof sales)[number]) => {
    const d = details.get(s.sareeId);
    const amount = n(s.amount);
    // The rate typed at the counter was never stored on the sale, so the
    // saree's listed price stands in for it — flagged as such below.
    const rate = d?.retailPrice ?? amount;
    return {
      saleRef: s.saleRef,
      sareeId: s.sareeId,
      sareeType: d?.sareeType ?? null,
      source: d?.source ?? null,
      rate,
      discount: Math.max(0, rate - amount),
      discountNote: null,
      amount,
    };
  };

  // ── Retail: one notification per bill ────────────────────────────────
  const retail = sales.filter((s) => s.channel === "RETAIL");
  const bills: (typeof retail)[] = [];
  for (const s of retail) {
    const bill = bills.find((b) => {
      const last = b[b.length - 1];
      return (
        last.customerId === s.customerId &&
        last.paymentMethod === s.paymentMethod &&
        last.paymentRef === s.paymentRef &&
        s.date.getTime() - last.date.getTime() <= SAME_BILL_GAP_MS
      );
    });
    if (bill) bill.push(s);
    else bills.push([s]);
  }
  for (const bill of bills) {
    const lines = bill.map(line);
    const retailTotal = lines.reduce((sum, l) => sum + l.rate, 0);
    const total = lines.reduce((sum, l) => sum + l.amount, 0);
    planned.push({
      type: "RETAIL_BILL_RECORDED",
      createdAt: bill[0].date,
      payload: {
        ...header(bill[0]),
        groupKey: `backfill:${bill[0].saleRef}`,
        billRef: bill[0].saleRef,
        sareeCount: lines.length,
        retailTotal,
        discount: Math.max(0, retailTotal - total),
        total,
        lines,
        rateFromListedPrice: true,
      },
    });
  }

  // ── Wholesale sale records (none are made by the app today) ──────────
  for (const s of sales.filter((x) => x.channel === "WHOLESALE")) {
    planned.push({
      type: "WHOLESALE_SALE_RECORDED",
      createdAt: s.date,
      payload: { ...header(s), ...line(s), rateFromListedPrice: true },
    });
  }

  // ── Wholesale dispatches: one notification per dispatch invoice ──────
  const dispatches = (
    await prisma.dispatchRecord.findMany({
      where: { type: "WHOLESALE" },
      include: { customer: true, sarees: { select: { sareeId: true } } },
    })
  ).filter((d) => !announced.dispatchIds.has(d.id));
  const dispatchDetails = await loadSareeDetails(
    prisma as never,
    dispatches.flatMap((d) => d.sarees.map((x) => x.sareeId)),
  );
  for (const d of dispatches) {
    planned.push({
      type: "WHOLESALE_DISPATCH_RECORDED",
      createdAt: d.dispatchDate,
      payload: {
        dispatchId: d.id,
        customerName: d.customer?.name ?? null,
        customerPhone: d.customer?.phone ?? null,
        invoiceNumber: d.invoiceNumber,
        sareeCount: d.sarees.length,
        pricePerSaree: n(d.pricePerSaree),
        totalAmount: n(d.totalAmount),
        gstPct: n(d.gstPct),
        grandTotal: n(d.grandTotal),
        lrNumber: d.lrNumber,
        transportCompany: d.transportCompany,
        bulkOrderRef: d.bulkOrderRef,
        sarees: d.sarees.map(({ sareeId }) => {
          const x = dispatchDetails.get(sareeId);
          return { sareeId, sareeType: x?.sareeType ?? null, source: x?.source ?? null };
        }),
      },
    });
  }

  return planned;
}
