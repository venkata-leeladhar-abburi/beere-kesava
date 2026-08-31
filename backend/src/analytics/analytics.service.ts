import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Inclusive start of the calendar month `back` months before now, and the
   * exclusive end of the current month. Every all-time scan below is clamped
   * to this window — the endpoints only ever render the recent buckets, so
   * reading the full table was pure waste.
   */
  private monthWindow(back: number): { start: Date; end: Date } {
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth() - back, 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    };
  }

  private static num(v: unknown): number {
    return v == null ? 0 : Number(v);
  }

  async getCashFlow() {
    // Buckets are keyed by short month name ("Jan"), which repeats every year.
    // Without a date filter a January 2021 invoice landed in this January's
    // bucket, so clamping the query to the five rendered months both bounds
    // the read and stops those cross-year collisions.
    const { start, end } = this.monthWindow(4);

    const [invoices, weaverPayments, vendorPayments] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { invoiceDate: { gte: start, lt: end } },
        select: { invoiceDate: true, paid: true },
      }),
      this.prisma.weaverPayment.findMany({
        where: { paymentDate: { gte: start, lt: end } },
        select: { paymentDate: true, amountPaid: true },
      }),
      this.prisma.vendorPayment.findMany({
        where: { date: { gte: start, lt: end } },
        select: { date: true, amount: true },
      }),
    ]);

    const monthsMap: Record<string, { month: string; income: number; expenses: number }> = {};
    const now = new Date();

    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString("en-US", { month: "short" });
      monthsMap[key] = { month: key, income: 0, expenses: 0 };
    }

    const add = (date: Date | null, field: "income" | "expenses", value: unknown) => {
      if (!date) return;
      const key = new Date(date).toLocaleString("en-US", { month: "short" });
      const bucket = monthsMap[key];
      if (bucket) bucket[field] += AnalyticsService.num(value) / 100000;
    };

    invoices.forEach((inv) => add(inv.invoiceDate, "income", inv.paid));
    weaverPayments.forEach((p) => add(p.paymentDate, "expenses", p.amountPaid));
    vendorPayments.forEach((vp) => add(vp.date, "expenses", vp.amount));

    return { items: Object.values(monthsMap) };
  }

  async getProductionTrends() {
    // Three counts instead of loading every saree row to length-check it.
    const [passed, pending, total] = await Promise.all([
      this.prisma.batchSareeRow.count({ where: { qcPassed: true } }),
      this.prisma.batchSareeRow.count({ where: { OR: [{ qcPassed: false }, { qcPassed: null }] } }),
      this.prisma.batchSareeRow.count(),
    ]);

    return { passed, pending, total };
  }

  async getRevenueSplit() {
    // Summed in the database; this used to pull every sale row to add them up.
    const grouped = await this.prisma.saleRecord.groupBy({
      by: ["channel"],
      _sum: { amount: true },
    });

    let retail = 0;
    let wholesale = 0;
    for (const row of grouped) {
      const amount = AnalyticsService.num(row._sum.amount);
      if (row.channel === "RETAIL") retail += amount;
      else wholesale += amount;
    }

    return { retail, wholesale, total: retail + wholesale };
  }

  async getTopWeavers() {
    // Was: every weaver payment, each with its full weaver row included, then
    // grouped and sorted in JS to keep five. The database can do all of that
    // and return five rows.
    // weaverId is a required FK, so every payment has one — the old
    // `if (!p.weaver) return` guard was unreachable.
    const totals = await this.prisma.weaverPayment.groupBy({
      by: ["weaverId"],
      _sum: { amountPaid: true },
      orderBy: { _sum: { amountPaid: "desc" } },
      take: 5,
    });

    const weavers = await this.prisma.weaver.findMany({
      where: { id: { in: totals.map((t) => t.weaverId) } },
      select: { id: true, name: true },
    });
    const nameById = new Map(weavers.map((w) => [w.id, w.name]));

    const items = totals.flatMap((t) => {
      const name = nameById.get(t.weaverId);
      return name === undefined
        ? []
        : [{ name, amount: AnalyticsService.num(t._sum?.amountPaid) }];
    });

    return { items };
  }

  // ── Monthly time-series helpers ─────────────────────────────────────────

  private clampMonths(months?: number): number {
    const n = Number(months) || 6;
    if (n < 1) return 1;
    if (n > 24) return 24;
    return Math.floor(n);
  }

  /** Builds an ordered array of the last `months` calendar months, oldest first,
   *  keyed as "YYYY-MM", along with the inclusive start date for querying. */
  private buildMonthBuckets(months: number): { key: string; start: Date; end: Date }[] {
    const now = new Date();
    const buckets: { key: string; start: Date; end: Date }[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
      buckets.push({ key, start, end });
    }
    return buckets;
  }

  private monthKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  async getCashFlowMonthly(months?: number) {
    const n = this.clampMonths(months);
    const buckets = this.buildMonthBuckets(n);
    const rangeStart = buckets[0].start;

    const [invoicePayments, weaverPayments, vendorPayments, supplierPayments] = await Promise.all([
      this.prisma.invoicePayment.findMany({
        where: { date: { gte: rangeStart } },
        select: { date: true, amount: true },
      }),
      this.prisma.weaverPayment.findMany({
        where: { paymentDate: { gte: rangeStart } },
        select: { paymentDate: true, amountPaid: true },
      }),
      this.prisma.vendorPayment.findMany({
        where: { date: { gte: rangeStart } },
        select: { date: true, amount: true },
      }),
      this.prisma.supplierPayment.findMany({
        where: { date: { gte: rangeStart } },
        select: { date: true, amount: true },
      }),
    ]);

    const map: Record<string, { month: string; income: number; expenses: number }> = {};
    buckets.forEach((b) => (map[b.key] = { month: b.key, income: 0, expenses: 0 }));

    invoicePayments.forEach((p) => {
      const key = this.monthKey(new Date(p.date));
      if (map[key]) map[key].income += Number(p.amount);
    });

    weaverPayments.forEach((p) => {
      const key = this.monthKey(new Date(p.paymentDate));
      if (map[key]) map[key].expenses += Number(p.amountPaid);
    });

    vendorPayments.forEach((p) => {
      const key = this.monthKey(new Date(p.date));
      if (map[key]) map[key].expenses += Number(p.amount);
    });

    supplierPayments.forEach((p) => {
      const key = this.monthKey(new Date(p.date));
      if (map[key]) map[key].expenses += Number(p.amount);
    });

    return { items: buckets.map((b) => map[b.key]) };
  }

  async getProductionTrendMonthly(months?: number) {
    const n = this.clampMonths(months);
    const buckets = this.buildMonthBuckets(n);
    const rangeStart = buckets[0].start;

    const [qcRecords, returnedAssignments] = await Promise.all([
      this.prisma.qcRecord.findMany({
        where: { qcDate: { gte: rangeStart } },
        select: { sareeId: true, qcDate: true, result: true },
      }),
      // A saree finished via the Raise Quotation receive flow — set here
      // even when it wasn't otherwise flagged PASSED in qcRecord.
      this.prisma.finishingAssignment.findMany({
        where: { status: "RETURNED", updatedAt: { gte: rangeStart } },
        select: { sareeId: true, updatedAt: true },
      }),
    ]);

    const map: Record<string, { month: string; produced: number; passed: number }> = {};
    buckets.forEach((b) => (map[b.key] = { month: b.key, produced: 0, passed: 0 }));

    // "Produced" = QC-passed OR finished via Raise Quotation, deduplicated
    // per saree per month so a saree isn't double-counted if both happened
    // in the same month.
    const producedIdsByMonth: Record<string, Set<string>> = {};
    buckets.forEach((b) => (producedIdsByMonth[b.key] = new Set()));

    qcRecords.forEach((r) => {
      const key = this.monthKey(new Date(r.qcDate));
      if (!map[key]) return;
      if (r.result === "PASSED") {
        map[key].passed += 1;
        producedIdsByMonth[key].add(r.sareeId);
      }
    });

    returnedAssignments.forEach((r) => {
      const key = this.monthKey(new Date(r.updatedAt));
      if (!map[key]) return;
      producedIdsByMonth[key].add(r.sareeId);
    });

    buckets.forEach((b) => (map[b.key].produced = producedIdsByMonth[b.key].size));

    return { items: buckets.map((b) => map[b.key]) };
  }

  async getCustomersNewVsReturningMonthly(months?: number) {
    const n = this.clampMonths(months);
    const buckets = this.buildMonthBuckets(n);

    const rangeStart = buckets[0].start;

    // Deciding "new" vs "returning" needs each customer's first-ever purchase,
    // which reaches back before the rendered range. That used to mean reading
    // every invoice and every sale ever written. Two things replace it:
    // a _min aggregate, which returns one row per customer rather than one per
    // transaction, and an in-range read for the buckets themselves.
    const [firstInvoice, firstSale, invoices, sales] = await Promise.all([
      this.prisma.invoice.groupBy({
        by: ["customerId"],
        _min: { invoiceDate: true },
      }),
      this.prisma.saleRecord.groupBy({
        by: ["customerId"],
        _min: { date: true },
      }),
      this.prisma.invoice.findMany({
        where: { invoiceDate: { gte: rangeStart } },
        select: { customerId: true, invoiceDate: true },
      }),
      // customerId is required on SaleRecord, so no filter is needed here —
      // every row already has one.
      this.prisma.saleRecord.findMany({
        where: { date: { gte: rangeStart } },
        select: { customerId: true, date: true },
      }),
    ]);

    const firstPurchase: Record<string, Date> = {};
    const record = (customerId: string | null, date: Date | null) => {
      if (!customerId || !date) return;
      const existing = firstPurchase[customerId];
      if (!existing || date < existing) firstPurchase[customerId] = date;
    };
    firstInvoice.forEach((r) => record(r.customerId, r._min?.invoiceDate ?? null));
    firstSale.forEach((r) => record(r.customerId, r._min?.date ?? null));

    // Purchases per customer per month (any purchase in that month, dedup by customer).
    const purchasesByMonth: Record<string, Set<string>> = {};
    const addPurchase = (customerId: string | null, date: Date | null) => {
      if (!customerId || !date) return;
      const key = this.monthKey(date);
      if (!purchasesByMonth[key]) purchasesByMonth[key] = new Set();
      purchasesByMonth[key].add(customerId);
    };
    invoices.forEach((i) => addPurchase(i.customerId, i.invoiceDate));
    sales.forEach((s) => addPurchase(s.customerId, s.date));

    const items = buckets.map((b) => {
      const customersThisMonth = purchasesByMonth[b.key] ?? new Set<string>();
      let newCount = 0;
      let returningCount = 0;
      customersThisMonth.forEach((customerId) => {
        const first = firstPurchase[customerId];
        if (first && this.monthKey(first) === b.key) newCount += 1;
        else returningCount += 1;
      });
      return { month: b.key, newCustomers: newCount, returningCustomers: returningCount };
    });

    return { items };
  }
}
