import { BadRequestException, NotFoundException } from "@nestjs/common";
import { PurchaseOrdersService } from "./purchase-orders.service";

describe("PurchaseOrdersService", () => {
  let prisma: any;
  let idGenerator: any;
  let auditLog: any;
  let notifications: any;
  let service: PurchaseOrdersService;

  const vendor = { id: "v1", code: "RAJ", name: "Raja Yarns" };
  const po = (over: Record<string, unknown> = {}) => ({
    id: "po1",
    poNumber: "PO-RAJ-001",
    status: "PENDING",
    firmId: "firm-a",
    vendor,
    items: [],
    ...over,
  });

  beforeEach(() => {
    prisma = {
      vendor: { findUnique: jest.fn().mockResolvedValue(vendor) },
      firm: { findUnique: jest.fn().mockResolvedValue({ id: "firm-a" }) },
      purchaseOrder: {
        create: jest
          .fn()
          .mockImplementation(({ data }) =>
            Promise.resolve({
              id: "po1",
              ...data,
              items: data.items?.create ?? [],
              totalValue: data.totalValue,
            }),
          ),
        findUnique: jest.fn().mockResolvedValue(po()),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...po(), ...data })),
        delete: jest.fn().mockResolvedValue({}),
      },
      grnReceipt: {
        findUnique: jest.fn().mockResolvedValue({ id: "grn1", firmId: null }),
        update: jest.fn().mockResolvedValue({}),
      },
      grnItem: { findMany: jest.fn().mockResolvedValue([]) },
    };
    idGenerator = { nextScoped: jest.fn().mockResolvedValue("PO-RAJ-001") };
    auditLog = { recordAction: jest.fn().mockResolvedValue({}) };
    notifications = { notifyRole: jest.fn().mockResolvedValue({}) };
    service = new PurchaseOrdersService(prisma, idGenerator, auditLog, notifications);
  });

  describe("create", () => {
    const dto = {
      vendorId: "v1",
      firmId: "firm-a",
      totalValue: 2500,
      items: [
        { materialType: "SILK", name: "Mulberry", quantity: 2.5, unitPrice: 1000 },
        { materialType: "JARI", name: "Gold", quantity: 3 },
      ],
    } as any;

    it("prices each line and asks the superadmin to approve", async () => {
      await service.create(dto);

      const lines = prisma.purchaseOrder.create.mock.calls[0][0].data.items.create;
      expect(lines[0]).toMatchObject({ totalPrice: 2500, unit: "KG" });
      // No unit price entered: the line has no total rather than a made-up 0.
      expect(lines[1]).toMatchObject({ totalPrice: null, unitPrice: null });
      expect(notifications.notifyRole).toHaveBeenCalledWith(
        "SUPERADMIN",
        "PURCHASE_ORDER_RAISED",
        expect.objectContaining({ poNumber: "PO-RAJ-001", itemCount: 2 }),
      );
    });

    it("numbers POs by the vendor's id when it has no code, never by its name", async () => {
      prisma.vendor.findUnique.mockResolvedValue({ ...vendor, code: null });
      await service.create(dto);
      expect(idGenerator.nextScoped).toHaveBeenCalledWith("PO", "v1");
    });

    it("refuses an unknown vendor or firm", async () => {
      prisma.vendor.findUnique.mockResolvedValueOnce(null);
      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      prisma.firm.findUnique.mockResolvedValueOnce(null);
      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      expect(prisma.purchaseOrder.create).not.toHaveBeenCalled();
    });
  });

  describe("approval", () => {
    it("approves and rejects only a PENDING order", async () => {
      await service.approve("po1", {});
      expect(prisma.purchaseOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: "APPROVED" } }),
      );

      prisma.purchaseOrder.findUnique.mockResolvedValue(po({ status: "APPROVED" }));
      await expect(service.approve("po1", {} as any)).rejects.toThrow(BadRequestException);
      await expect(service.reject("po1", { reason: "x" } as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("keeps the reason on a rejection", async () => {
      await service.reject("po1", { reason: "Price too high" });
      expect(prisma.purchaseOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: "REJECTED", rejectionReason: "Price too high" },
        }),
      );
    });
  });

  describe("receiveGrn", () => {
    beforeEach(() => prisma.purchaseOrder.findUnique.mockResolvedValue(po({ status: "APPROVED" })));

    it("receives only an APPROVED order", async () => {
      prisma.purchaseOrder.findUnique.mockResolvedValue(po({ status: "PENDING" }));
      await expect(service.receiveGrn("po1", {} as any)).rejects.toThrow(BadRequestException);
    });

    it("copies the order's firm onto a receipt that has none", async () => {
      await service.receiveGrn("po1", { grnReceiptId: "grn1" });
      expect(prisma.grnReceipt.update).toHaveBeenCalledWith({
        where: { id: "grn1" },
        data: { firmId: "firm-a" },
      });
    });

    it("never overwrites a firm the receiving clerk already set", async () => {
      prisma.grnReceipt.findUnique.mockResolvedValue({ id: "grn1", firmId: "firm-b" });
      await service.receiveGrn("po1", { grnReceiptId: "grn1" });
      expect(prisma.grnReceipt.update).not.toHaveBeenCalled();
    });

    it("flags a short delivery, net of rejected quantity, across units", async () => {
      prisma.purchaseOrder.update.mockResolvedValue({
        ...po({ status: "RECEIVED" }),
        items: [{ id: "li1", name: "Mulberry", materialType: "SILK", unit: "KG", quantity: "10" }],
      });
      // 9.5 kg arrived, in grams, and 500 g of it was refused: 1 kg short.
      prisma.grnItem.findMany.mockResolvedValue([
        { poItemId: "li1", quantity: "9500", unit: "G", rejectedQuantity: "500" },
      ]);

      await service.receiveGrn("po1", { grnReceiptId: "grn1" });

      const mismatch = notifications.notifyRole.mock.calls.filter(
        (c: any[]) => c[1] === "GRN_QUANTITY_MISMATCH",
      );
      expect(mismatch.map((c: any[]) => c[0])).toEqual(["SUPERADMIN", "ACCOUNTANT"]);
      expect(mismatch[0][2].lines[0]).toMatchObject({
        ordered: 10,
        received: 9,
        shortByGrams: 1000,
      });
    });

    it("ignores sub-gram rounding differences", async () => {
      prisma.purchaseOrder.update.mockResolvedValue({
        ...po({ status: "RECEIVED" }),
        items: [{ id: "li1", name: "Mulberry", materialType: "SILK", unit: "KG", quantity: "10" }],
      });
      prisma.grnItem.findMany.mockResolvedValue([
        { poItemId: "li1", quantity: "9999.6", unit: "G", rejectedQuantity: "0" },
      ]);

      await service.receiveGrn("po1", { grnReceiptId: "grn1" });

      expect(notifications.notifyRole.mock.calls.map((c: any[]) => c[1])).not.toContain(
        "GRN_QUANTITY_MISMATCH",
      );
    });
  });

  describe("remove", () => {
    it("refuses to delete an order with a receipt or bills behind it", async () => {
      prisma.purchaseOrder.findUnique.mockResolvedValue({
        ...po(),
        grnReceiptId: "grn1",
        vendorBills: [],
      });
      await expect(service.remove("po1")).rejects.toThrow(/GRN receipt/);

      prisma.purchaseOrder.findUnique.mockResolvedValue({
        ...po(),
        grnReceiptId: null,
        vendorBills: [{ id: "b1" }],
      });
      await expect(service.remove("po1")).rejects.toThrow(/vendor bills/);
      expect(prisma.purchaseOrder.delete).not.toHaveBeenCalled();
    });

    it("deletes a bare order and records who did it", async () => {
      prisma.purchaseOrder.findUnique.mockResolvedValue({
        ...po(),
        grnReceiptId: null,
        vendorBills: [],
      });
      await service.remove("po1", { actorId: "u1" });
      expect(prisma.purchaseOrder.delete).toHaveBeenCalledWith({ where: { id: "po1" } });
      expect(auditLog.recordAction).toHaveBeenCalledWith(
        expect.objectContaining({ actorId: "u1" }),
      );
    });
  });
});
