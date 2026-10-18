import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { InvoicesService } from "./invoices.service";

describe("InvoicesService", () => {
  let prisma: any;
  let tx: any;
  let idGenerator: any;
  let auditLog: any;
  let notifications: any;
  let service: InvoicesService;

  const wholesale = { id: "c1", name: "Raja Silks", code: "RAJ", type: "WHOLESALE" };
  const invoice = (over: Record<string, unknown> = {}) => ({
    id: "inv1",
    code: "INV-RAJ-001",
    total: "300.30",
    paid: "0",
    status: "PENDING",
    dispatch: { firmId: "firm-a" },
    ...over,
  });

  beforeEach(() => {
    tx = {
      invoice: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      invoicePayment: { create: jest.fn().mockResolvedValue({}) },
    };
    prisma = {
      customer: { findUnique: jest.fn().mockResolvedValue(wholesale) },
      invoice: {
        findUnique: jest.fn().mockResolvedValue(invoice()),
        create: jest.fn().mockResolvedValue({ id: "inv1", dueDate: null }),
      },
      dispatchRecord: { findUnique: jest.fn().mockResolvedValue({ invoiceNumber: null }) },
      $transaction: jest.fn((fn: (t: unknown) => unknown) => fn(tx)),
    };
    idGenerator = { nextScoped: jest.fn().mockResolvedValue("INV-RAJ-001") };
    auditLog = { recordAction: jest.fn().mockResolvedValue({}) };
    notifications = { notifyRole: jest.fn().mockResolvedValue({}) };
    service = new InvoicesService(prisma, idGenerator, auditLog, notifications);
  });

  describe("create", () => {
    it("raises invoices for wholesale customers only", async () => {
      prisma.customer.findUnique.mockResolvedValue({ ...wholesale, type: "RETAIL" });
      await expect(service.create({ customerId: "c1", total: 500 } as any)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.invoice.create).not.toHaveBeenCalled();
    });

    it("returns the existing invoice for a dispatch instead of billing it twice", async () => {
      prisma.invoice.findUnique.mockResolvedValue(invoice({ dispatchId: "d1" }));

      await service.create({ customerId: "c1", dispatchId: "d1", total: 500 });

      expect(prisma.invoice.create).not.toHaveBeenCalled();
    });

    it("reuses the number a dispatch already printed instead of allocating a second one", async () => {
      prisma.invoice.findUnique.mockResolvedValueOnce(null);
      prisma.dispatchRecord.findUnique.mockResolvedValue({ invoiceNumber: "INV-RAJ-007" });

      await service.create({ customerId: "c1", dispatchId: "d1", total: 500 });

      expect(idGenerator.nextScoped).not.toHaveBeenCalled();
      expect(prisma.invoice.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ code: "INV-RAJ-007", dispatchId: "d1" }),
      });
    });

    it("numbers the invoice by customer and tells accountants", async () => {
      await service.create({ customerId: "c1", total: 500 });

      expect(idGenerator.nextScoped).toHaveBeenCalledWith("INV", "RAJ");
      expect(notifications.notifyRole).toHaveBeenCalledWith(
        "ACCOUNTANT",
        "INVOICE_CREATED",
        expect.objectContaining({ invoiceNumber: "INV-RAJ-001", total: 500 }),
      );
    });
  });

  describe("recordPayment", () => {
    const pay = (amount: number, over: Record<string, unknown> = {}) =>
      service.recordPayment("inv1", { amount, method: "UPI", actorId: "u1", ...over });

    it("records a part payment as PARTIAL", async () => {
      await pay(100.1);

      expect(tx.invoice.updateMany).toHaveBeenCalledWith({
        where: { id: "inv1", paid: "0" },
        data: { paid: 100.1, status: "PARTIAL" },
      });
      expect(tx.invoicePayment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ amount: 100.1, firmId: "firm-a" }),
        }),
      );
    });

    it("settles in full when the paise add up, even where floats drift", async () => {
      // 100.10 + 200.20 is 300.29999999999995 in floats: this invoice used to
      // stay PARTIAL forever, then turn OVERDUE.
      prisma.invoice.findUnique.mockResolvedValue(invoice({ paid: "100.10", status: "PARTIAL" }));

      await pay(200.2);

      expect(tx.invoice.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: { paid: 300.3, status: "PAID" } }),
      );
      expect(notifications.notifyRole).toHaveBeenCalledWith(
        "ACCOUNTANT",
        "INVOICE_PAID",
        expect.objectContaining({ outstanding: 0 }),
      );
    });

    it("refuses more than the outstanding balance, by a single paisa", async () => {
      prisma.invoice.findUnique.mockResolvedValue(invoice({ paid: "100.10" }));
      await expect(pay(200.21)).rejects.toThrow(BadRequestException);
      expect(tx.invoice.updateMany).not.toHaveBeenCalled();
    });

    it("refuses a payment on an invoice that is already paid", async () => {
      prisma.invoice.findUnique.mockResolvedValue(invoice({ status: "PAID", paid: "300.30" }));
      await expect(pay(1)).rejects.toThrow(/already fully paid/);
    });

    it("only lets the firm that raised the invoice collect it", async () => {
      await expect(pay(10, { firmId: "firm-b" })).rejects.toThrow(/different firm/);
    });

    it("lets an invoice from before firms were recorded take the named firm", async () => {
      prisma.invoice.findUnique.mockResolvedValue(invoice({ dispatch: null }));
      await pay(10, { firmId: "firm-b" });
      expect(tx.invoicePayment.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ firmId: "firm-b" }) }),
      );
    });

    it("refuses, and records nothing, when someone else paid in the meantime", async () => {
      tx.invoice.updateMany.mockResolvedValue({ count: 0 });

      await expect(pay(50)).rejects.toThrow(ConflictException);
      expect(tx.invoicePayment.create).not.toHaveBeenCalled();
      expect(auditLog.recordAction).not.toHaveBeenCalled();
    });

    it("404s an unknown invoice", async () => {
      prisma.invoice.findUnique.mockResolvedValue(null);
      await expect(pay(10)).rejects.toThrow(NotFoundException);
    });
  });
});
