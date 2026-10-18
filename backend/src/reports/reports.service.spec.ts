import { ReportsService } from "./reports.service";

/**
 * Pins how the live report figures count: a reworked saree counts once in the
 * QC split, and wholesale counter sales (SaleRecords with channel WHOLESALE,
 * no dispatch or invoice) are reported as wholesale — never folded into retail.
 */
describe("ReportsService", () => {
  let prisma: any;
  let service: ReportsService;

  const sale = (saleRef: string, amount: number) => ({
    saleRef,
    sareeId: `S-${saleRef}`,
    date: new Date("2026-10-01T10:00:00Z"),
    amount,
    customer: { name: "Buyer" },
    soldBy: null,
  });

  beforeEach(() => {
    const agg = (sum: number, count: number) => ({
      _sum: { amount: sum, grandTotal: sum, totalPrice: sum, amountPaid: sum },
      _count: { _all: count },
      _min: { date: null, dispatchDate: null, receivedDate: null, paymentDate: null },
      _max: { date: null, dispatchDate: null, receivedDate: null, paymentDate: null },
    });
    prisma = {
      batchSareeRow: { findMany: jest.fn().mockResolvedValue([]) },
      finishingAssignment: {
        findMany: jest.fn().mockResolvedValue([]),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      qcRecord: { findMany: jest.fn().mockResolvedValue([]) },
      saree: { findMany: jest.fn().mockResolvedValue([]) },
      saleRecord: {
        findMany: jest.fn(({ where }) =>
          Promise.resolve(
            where?.channel === "WHOLESALE"
              ? [sale("W1", 9000)]
              : [sale("R1", 1000), sale("R2", 2000)],
          ),
        ),
        aggregate: jest.fn(({ where }) =>
          Promise.resolve(where?.channel === "WHOLESALE" ? agg(9000, 1) : agg(3000, 2)),
        ),
      },
      dispatchRecord: {
        findMany: jest.fn().mockResolvedValue([]),
        aggregate: jest.fn().mockResolvedValue(agg(0, 0)),
      },
      grnItem: { aggregate: jest.fn().mockResolvedValue(agg(0, 0)) },
      grnReceipt: { aggregate: jest.fn().mockResolvedValue(agg(0, 0)) },
      weaverPayment: { aggregate: jest.fn().mockResolvedValue(agg(0, 0)) },
    };
    service = new ReportsService(prisma, {} as any);
  });

  it("marks a bulk order unpaid long past its due date as overdue, like an invoice", async () => {
    const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
    const order = (ref: string, dueDate: Date) => ({
      ref,
      customerId: "c1",
      customer: { code: "RAJ", name: "Raja Silks" },
      createdBy: null,
      createdDate: daysAgo(90),
      dueDate,
      total: 10,
      amountDue: "5000",
      amountPaid: "1000",
      paymentStatus: "PARTIAL",
    });
    prisma.invoice = { findMany: jest.fn().mockResolvedValue([]) };
    prisma.bulkOrder = {
      findMany: jest.fn().mockResolvedValue([order("ORD-1", daysAgo(60)), order("ORD-2", daysAgo(10))]),
    };

    const res = await service.getOutstandingPayments();

    expect(res.items.map((r) => [r.id, r.status])).toEqual([
      ["ORD-1", "OVERDUE"],
      ["ORD-2", "PARTIAL"],
    ]);
    expect(res.totalOutstanding).toBe(8000);
  });

  it("counts each saree once in the QC split, by its newest verdict", async () => {
    // distinct sareeId, newest first — what a SEMI-then-PASSED saree reduces to.
    prisma.qcRecord.findMany.mockResolvedValue([{ result: "PASSED" }, { result: "DEFECTIVE" }]);
    const res = await service.getProductionSummary();
    expect(res.qcByResult).toEqual({ PASSED: 1, SEMI: 0, DEFECTIVE: 1 });
    expect(prisma.qcRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        distinct: ["sareeId"],
        orderBy: [{ sareeId: "asc" }, { qcDate: "desc" }],
      }),
    );
  });

  it("keeps wholesale counter sales out of the retail totals", async () => {
    const res = await service.getSalesSummary();
    expect(res.retailCount).toBe(2);
    expect(res.retailTotalSales).toBe(3000);
    expect(res.wholesaleCounterCount).toBe(1);
    expect(res.wholesaleCounterTotalSales).toBe(9000);
    expect(prisma.saleRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { channel: "RETAIL" } }),
    );
  });

  it("delivers only retail sales in the scheduled retail report", async () => {
    const res = await service.getRetailSalesReport();
    expect(res.count).toBe(2);
    expect(res.totalSales).toBe(3000);
  });

  it("carries counter sales on their own sheet in the wholesale report", async () => {
    const res = await service.getWholesaleSalesReport();
    expect(res.wholesaleCounterSales).toHaveLength(1);
    expect(res.counterSalesTotal).toBe(9000);
    expect(res.combinedTotalSales).toBe(9000);
  });

  it("books counter sales as wholesale revenue in profit and loss", async () => {
    const res = await service.getProfitAndLossReport();
    const line = (source: string) => res.lines.find((l) => l.source === source)?.amount;
    expect(line("Retail sales")).toBe(3000);
    expect(line("Wholesale counter sales")).toBe(9000);
    expect(res.totalRevenue).toBe(12000);
  });
});
