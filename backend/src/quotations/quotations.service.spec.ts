import { BadRequestException, NotFoundException } from "@nestjs/common";
import { QuotationsService } from "./quotations.service";

describe("QuotationsService", () => {
  let prisma: any;
  let idGenerator: any;
  let service: QuotationsService;

  const quotation = (over: Record<string, unknown> = {}) => ({
    id: "q1",
    status: "RAISED",
    sarees: [{ sareeId: "s1" }, { sareeId: "s2" }],
    ...over,
  });

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ id: "u1" }) },
      customer: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: "c1", name: "Raja Silks", code: "RAJ", type: "WHOLESALE" }),
      },
      qcRecord: {
        findMany: jest.fn().mockResolvedValue([{ sareeId: "s1" }, { sareeId: "s2" }]),
      },
      quotation: {
        create: jest.fn().mockResolvedValue({ id: "q1" }),
        findUnique: jest.fn().mockResolvedValue(quotation()),
        update: jest.fn().mockResolvedValue({}),
      },
      quotationSaree: {
        createMany: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockReturnValue("qs-update"),
        count: jest.fn().mockResolvedValue(0),
      },
      finishingStaff: { findUnique: jest.fn().mockResolvedValue({ id: "fs1" }) },
      finishingAssignment: {
        createMany: jest.fn().mockReturnValue("fa-create"),
        updateMany: jest.fn().mockReturnValue("fa-update"),
      },
      batchSareeRow: { findMany: jest.fn().mockResolvedValue([]) },
      inventoryRecord: { upsert: jest.fn().mockReturnValue("inv-upsert") },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    idGenerator = { nextScoped: jest.fn().mockResolvedValue("QUO-RAJ-001") };
    service = new QuotationsService(prisma, idGenerator);
  });

  describe("create", () => {
    const dto = (over: Record<string, unknown> = {}) =>
      ({
        raisedById: "u1",
        customerId: "c1",
        sarees: [
          { sareeId: "s1", price: 12000 },
          { sareeId: "s2", price: 8000 },
        ],
        ...over,
      }) as any;

    it("totals the sarees and adds GST only when it is applied", async () => {
      await service.create(dto({ applyGst: true, gstPct: 5 }));
      expect(prisma.quotation.create.mock.calls[0][0].data).toMatchObject({
        subtotal: 20000,
        grandTotal: 21000,
        gstPct: 5,
        quotationNumber: "QUO-RAJ-001",
      });

      await service.create(dto({ applyGst: false, gstPct: 5 }));
      expect(prisma.quotation.create.mock.calls[1][0].data).toMatchObject({
        grandTotal: 20000,
        gstPct: undefined,
      });
    });

    it("quotes only sarees that have passed QC, and names the ones that have not", async () => {
      prisma.qcRecord.findMany.mockResolvedValue([{ sareeId: "s1" }]);
      await expect(service.create(dto())).rejects.toThrow(/s2/);
      expect(prisma.quotation.create).not.toHaveBeenCalled();
    });

    it("is for wholesale customers only", async () => {
      prisma.customer.findUnique.mockResolvedValue({ id: "c1", name: "Walk-in", type: "RETAIL" });
      await expect(service.create(dto())).rejects.toThrow(BadRequestException);
    });

    it("needs a real user to raise it", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.create(dto())).rejects.toThrow(NotFoundException);
    });
  });

  describe("assignFinishing", () => {
    it("refuses sarees that are not on the quotation", async () => {
      await expect(
        service.assignFinishing("q1", { staffId: "fs1", sareeIds: ["s1", "s9"] } as any),
      ).rejects.toThrow(/s9/);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("refuses once the quotation has moved past finishing", async () => {
      prisma.quotation.findUnique.mockResolvedValue(quotation({ status: "DISPATCHED" }));
      await expect(
        service.assignFinishing("q1", { staffId: "fs1", sareeIds: ["s1"] } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it("assigns and moves the quotation into finishing in one transaction", async () => {
      await service.assignFinishing("q1", { staffId: "fs1", sareeIds: ["s1"] } as any);
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.quotation.update).toHaveBeenCalledWith({
        where: { id: "q1" },
        data: { status: "IN_FINISHING" },
      });
    });
  });

  describe("receive", () => {
    it("is PARTIALLY_RECEIVED while any saree is still out", async () => {
      prisma.quotationSaree.count.mockResolvedValue(1);
      await service.receive("q1", { sareeIds: ["s1"] });
      expect(prisma.quotation.update).toHaveBeenCalledWith({
        where: { id: "q1" },
        data: { status: "PARTIALLY_RECEIVED" },
      });
    });

    it("is RECEIVED once every saree is back, and makes each dispatch-ready", async () => {
      await service.receive("q1", { sareeIds: ["s1", "s2"] });
      expect(prisma.inventoryRecord.upsert).toHaveBeenCalledTimes(2);
      expect(prisma.quotation.update).toHaveBeenCalledWith({
        where: { id: "q1" },
        data: { status: "RECEIVED" },
      });
    });
  });

  describe("dispatch", () => {
    it("ships only a fully received quotation", async () => {
      prisma.quotation.findUnique.mockResolvedValue(quotation({ status: "PARTIALLY_RECEIVED" }));
      await expect(service.dispatch("q1")).rejects.toThrow(BadRequestException);

      prisma.quotation.findUnique.mockResolvedValue(quotation({ status: "RECEIVED" }));
      await service.dispatch("q1");
      expect(prisma.quotation.update).toHaveBeenCalledWith({
        where: { id: "q1" },
        data: { status: "DISPATCHED" },
      });
    });
  });
});
