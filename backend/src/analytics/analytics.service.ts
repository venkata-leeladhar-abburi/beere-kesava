import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCashFlow() {
    const invoices = await this.prisma.invoice.findMany({
      select: { invoiceDate: true, paid: true },
    });
    const weaverPayments = await this.prisma.weaverPayment.findMany({
      select: { paymentDate: true, amountPaid: true },
    });
    const vendorPayments = await this.prisma.vendorPayment.findMany({
      select: { date: true, amount: true },
    });

    const monthsMap: Record<string, { month: string; income: number; expenses: number }> = {};
    const now = new Date();

    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString("en-US", { month: "short" });
      monthsMap[key] = { month: key, income: 0, expenses: 0 };
    }

    invoices.forEach((inv) => {
      const key = new Date(inv.invoiceDate).toLocaleString("en-US", { month: "short" });
      if (monthsMap[key]) {
        monthsMap[key].income += Number(inv.paid) / 100000;
      }
    });

    weaverPayments.forEach((p) => {
      const key = new Date(p.paymentDate).toLocaleString("en-US", { month: "short" });
      if (monthsMap[key]) {
        monthsMap[key].expenses += Number(p.amountPaid) / 100000;
      }
    });

    vendorPayments.forEach((vp) => {
      const key = new Date(vp.date).toLocaleString("en-US", { month: "short" });
      if (monthsMap[key]) {
        monthsMap[key].expenses += Number(vp.amount) / 100000;
      }
    });

    return { items: Object.values(monthsMap) };
  }

  async getProductionTrends() {
    const sarees = await this.prisma.batchSareeRow.findMany({
      select: { createdAt: true, qcPassed: true },
    });

    const passedCount = sarees.filter((s) => s.qcPassed === true).length;
    const pendingCount = sarees.filter((s) => s.qcPassed === false || s.qcPassed === null).length;

    return {
      passed: passedCount,
      pending: pendingCount,
      total: sarees.length,
    };
  }

  async getRevenueSplit() {
    const sales = await this.prisma.saleRecord.findMany({
      select: { channel: true, amount: true },
    });

    let retail = 0;
    let wholesale = 0;

    sales.forEach((s) => {
      if (s.channel === "RETAIL") retail += Number(s.amount);
      else wholesale += Number(s.amount);
    });

    return {
      retail,
      wholesale,
      total: retail + wholesale,
    };
  }

  async getTopWeavers() {
    const payments = await this.prisma.weaverPayment.findMany({
      include: { weaver: true },
    });

    const weaverTotals: Record<string, { name: string; amount: number }> = {};

    payments.forEach((p) => {
      if (!p.weaver) return;
      const wId = p.weaver.id;
      if (!weaverTotals[wId]) {
        weaverTotals[wId] = { name: p.weaver.name, amount: 0 };
      }
      weaverTotals[wId].amount += Number(p.amountPaid);
    });

    const sorted = Object.values(weaverTotals)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return { items: sorted };
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

    // Pull every purchase (invoice or sale) with a date, up to "now", so we
    // can determine each customer's first-ever purchase month — including
    // purchases that happened before the range start, which is needed to
    // tell whether an in-range purchase is a "return" or a first-time one.
    const [invoices, sales] = await Promise.all([
      this.prisma.invoice.findMany({
        select: { customerId: true, invoiceDate: true },
      }),
      // customerId is required on SaleRecord, so no filter is needed here —
      // every row already has one.
      this.prisma.saleRecord.findMany({
        select: { customerId: true, date: true },
      }),
    ]);

    const firstPurchase: Record<string, Date> = {};
    const record = (customerId: string | null, date: Date) => {
      if (!customerId) return;
      const existing = firstPurchase[customerId];
      if (!existing || date < existing) firstPurchase[customerId] = date;
    };
    invoices.forEach((i) => record(i.customerId, new Date(i.invoiceDate)));
    sales.forEach((s) => record(s.customerId, new Date(s.date)));

    // Purchases per customer per month (any purchase in that month, dedup by customer).
    const purchasesByMonth: Record<string, Set<string>> = {};
    const addPurchase = (customerId: string | null, date: Date) => {
      if (!customerId) return;
      const key = this.monthKey(date);
      if (!purchasesByMonth[key]) purchasesByMonth[key] = new Set();
      purchasesByMonth[key].add(customerId);
    };
    invoices.forEach((i) => addPurchase(i.customerId, new Date(i.invoiceDate)));
    sales.forEach((s) => addPurchase(s.customerId, new Date(s.date)));

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
