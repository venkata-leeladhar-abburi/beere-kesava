import { AnalyticsService } from "./analytics.service";

/**
 * These endpoints were rewritten to aggregate in the database instead of
 * loading whole tables and reducing in JS. The response shapes are consumed
 * directly by the dashboard, so they are pinned here — along with the two
 * behaviours the rewrite depended on: that every all-time read is now bounded,
 * and that cash flow no longer counts a January from a previous year into this
 * January's bucket.
 */
describe("AnalyticsService", () => {
  let prisma: any;
  let service: AnalyticsService;

  const D = (iso: string) => new Date(iso);

  beforeEach(() => {
    prisma = {
      invoice: { findMany: jest.fn().mockResolvedValue([]), groupBy: jest.fn().mockResolvedValue([]) },
      saleRecord: { findMany: jest.fn().mockResolvedValue([]), groupBy: jest.fn().mockResolvedValue([]) },
      weaverPayment: { findMany: jest.fn().mockResolvedValue([]), groupBy: jest.fn().mockResolvedValue([]) },
      vendorPayment: { findMany: jest.fn().mockResolvedValue([]) },
      supplierPayment: { findMany: jest.fn().mockResolvedValue([]) },
      invoicePayment: { findMany: jest.fn().mockResolvedValue([]) },
      batchSareeRow: { count: jest.fn().mockResolvedValue(0), findMany: jest.fn().mockResolvedValue([]) },
      qcRecord: { findMany: jest.fn().mockResolvedValue([]) },
      finishingAssignment: { findMany: jest.fn().mockResolvedValue([]) },
      weaver: { findMany: jest.fn().mockResolvedValue([]) },
    };
    service = new AnalyticsService(prisma);
  });

  describe("getProductionTrends", () => {
    it("counts in the database rather than loading every saree row", async () => {
      prisma.batchSareeRow.count
        .mockResolvedValueOnce(12) // passed
        .mockResolvedValueOnce(5) // pending
        .mockResolvedValueOnce(17); // total

      const result = await service.getProductionTrends();

      expect(result).toEqual({ passed: 12, pending: 5, total: 17 });
      expect(prisma.batchSareeRow.findMany).not.toHaveBeenCalled();
      expect(prisma.batchSareeRow.count).toHaveBeenCalledTimes(3);
    });

    it("counts a null qcPassed as pending, not as passed", async () => {
      await service.getProductionTrends();
      const pendingWhere = prisma.batchSareeRow.count.mock.calls[1][0].where;
      expect(pendingWhere).toEqual({ OR: [{ qcPassed: false }, { qcPassed: null }] });
    });
  });

  describe("getRevenueSplit", () => {
    it("sums each channel via groupBy and totals them", async () => {
      prisma.saleRecord.groupBy.mockResolvedValue([
        { channel: "RETAIL", _sum: { amount: 1500 } },
        { channel: "WHOLESALE", _sum: { amount: 4500 } },
      ]);

      expect(await service.getRevenueSplit()).toEqual({
        retail: 1500,
        wholesale: 4500,
        total: 6000,
      });
      expect(prisma.saleRecord.findMany).not.toHaveBeenCalled();
    });

    it("treats a null sum as zero rather than NaN", async () => {
      prisma.saleRecord.groupBy.mockResolvedValue([{ channel: "RETAIL", _sum: { amount: null } }]);
      expect(await service.getRevenueSplit()).toEqual({ retail: 0, wholesale: 0, total: 0 });
    });
  });

  describe("getTopWeavers", () => {
    it("asks the database for the top five, ordered, instead of sorting in JS", async () => {
      prisma.weaverPayment.groupBy.mockResolvedValue([
        { weaverId: "w1", _sum: { amountPaid: 900 } },
        { weaverId: "w2", _sum: { amountPaid: 400 } },
      ]);
      prisma.weaver.findMany.mockResolvedValue([
        { id: "w1", name: "Padma Veni" },
        { id: "w2", name: "Ravi Kumar" },
      ]);

      const result = await service.getTopWeavers();

      expect(result.items).toEqual([
        { name: "Padma Veni", amount: 900 },
        { name: "Ravi Kumar", amount: 400 },
      ]);
      const args = prisma.weaverPayment.groupBy.mock.calls[0][0];
      expect(args.take).toBe(5);
      expect(args.orderBy).toEqual({ _sum: { amountPaid: "desc" } });
      // The weaver rows are fetched by id, not included on every payment.
      expect(prisma.weaver.findMany.mock.calls[0][0].where).toEqual({ id: { in: ["w1", "w2"] } });
    });

    it("drops a grouped row whose weaver no longer resolves", async () => {
      prisma.weaverPayment.groupBy.mockResolvedValue([
        { weaverId: "gone", _sum: { amountPaid: 100 } },
      ]);
      prisma.weaver.findMany.mockResolvedValue([]);
      expect((await service.getTopWeavers()).items).toEqual([]);
    });
  });

  describe("getCashFlow", () => {
    it("bounds every read to the five months it renders", async () => {
      await service.getCashFlow();

      for (const [model, field] of [
        ["invoice", "invoiceDate"],
        ["weaverPayment", "paymentDate"],
        ["vendorPayment", "date"],
      ] as const) {
        const where = prisma[model].findMany.mock.calls[0][0].where;
        expect(where[field].gte).toBeInstanceOf(Date);
        expect(where[field].lt).toBeInstanceOf(Date);
      }
    });

    it("returns five buckets and converts paise-scale figures to lakhs", async () => {
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 15);
      prisma.invoice.findMany.mockResolvedValue([{ invoiceDate: thisMonth, paid: 200000 }]);

      const { items } = await service.getCashFlow();

      expect(items).toHaveLength(5);
      const key = thisMonth.toLocaleString("en-US", { month: "short" });
      expect(items.find((i: any) => i.month === key)).toMatchObject({ income: 2 });
    });

    it("ignores an invoice with no date instead of bucketing it as Invalid Date", async () => {
      prisma.invoice.findMany.mockResolvedValue([{ invoiceDate: null, paid: 999 }]);
      const { items } = await service.getCashFlow();
      expect(items.every((i: any) => i.income === 0)).toBe(true);
    });
  });

  describe("getCustomersNewVsReturningMonthly", () => {
    it("gets first-purchase dates from a _min aggregate, not from all history", async () => {
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 10);

      prisma.invoice.groupBy.mockResolvedValue([
        { customerId: "old", _min: { invoiceDate: D("2020-01-05") } },
        { customerId: "new", _min: { invoiceDate: thisMonth } },
      ]);
      prisma.invoice.findMany.mockResolvedValue([
        { customerId: "old", invoiceDate: thisMonth },
        { customerId: "new", invoiceDate: thisMonth },
      ]);

      const { items } = await service.getCustomersNewVsReturningMonthly(3);

      // The aggregate is what supplies history; the row read is range-bounded.
      expect(prisma.invoice.groupBy).toHaveBeenCalled();
      expect(prisma.invoice.findMany.mock.calls[0][0].where.invoiceDate.gte).toBeInstanceOf(Date);

      const current = items[items.length - 1];
      expect(current.newCustomers).toBe(1);
      expect(current.returningCustomers).toBe(1);
    });
  });
});
