import { OverduePaymentsService } from "./overdue-payments.service";

describe("OverduePaymentsService", () => {
  let prisma: any;
  let notifications: any;
  let service: OverduePaymentsService;

  beforeEach(() => {
    prisma = {
      invoice: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            {
              id: "i1",
              code: "INV-1",
              customerId: "c1",
              dueDate: new Date("2026-08-01"),
              total: "1000",
              paid: "250",
            },
          ]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      bulkOrder: {
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    notifications = { create: jest.fn().mockResolvedValue({}) };
    service = new OverduePaymentsService(prisma, notifications);
  });

  it("marks only unpaid invoices past 45 days overdue, in one statement", async () => {
    await service.runScan();

    const where = prisma.invoice.updateMany.mock.calls[0][0].where;
    expect(where.status).toEqual({ in: ["PENDING", "PARTIAL"] });
    const cutoff = where.dueDate.lt as Date;
    const days = (Date.now() - cutoff.getTime()) / 86_400_000;
    expect(Math.round(days)).toBe(45);
    expect(prisma.invoice.updateMany.mock.calls[0][0].data).toEqual({ status: "OVERDUE" });
  });

  it("tells accountants what is still outstanding on each", async () => {
    await service.runScan();

    expect(notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "ACCOUNTANT",
        type: "invoice_overdue",
        payload: expect.objectContaining({ outstanding: 750 }),
      }),
    );
  });

  it("sends nothing when nothing is overdue", async () => {
    prisma.invoice.findMany.mockResolvedValue([]);
    await service.runScan();
    expect(notifications.create).not.toHaveBeenCalled();
  });
});
