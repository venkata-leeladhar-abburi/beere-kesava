import { notificationsStub } from "../common/testing/notifications.stub";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { SupplierReturnsService } from "./supplier-returns.service";
import { CreateSupplierReturnRequestDto } from "./dto/create-supplier-return-request.dto";
import { DecideSupplierReturnRequestDto } from "./dto/decide-supplier-return-request.dto";

describe("SupplierReturnsService", () => {
  let prisma: any;
  let idGenerator: any;
  let auditLog: any;
  let service: SupplierReturnsService;

  const purchase = { id: "EXT-2026-001", supplierId: "supplier-1", supplier: { id: "supplier-1", name: "Ravi Silks", code: "RaviSilks-001" } };
  const line = { id: "line-1", purchaseId: "EXT-2026-001", quantity: 10, returnedQuantity: 2 };

  const createDto = (overrides: Partial<CreateSupplierReturnRequestDto> = {}): CreateSupplierReturnRequestDto => ({
    requestedById: "user-1",
    purchaseId: "EXT-2026-001",
    sareeLineId: "line-1",
    quantity: 3,
    ...overrides,
  });

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ id: "user-1" }) },
      purchase: { findUnique: jest.fn().mockResolvedValue(purchase), update: jest.fn() },
      purchaseSareeLine: {
        findUnique: jest.fn().mockResolvedValue(line),
        // The row after an atomic `increment`, as Postgres would return it.
        update: jest.fn().mockImplementation(({ data }) => ({
          ...line,
          returnedQuantity: line.returnedQuantity + (data.returnedQuantity?.increment ?? 0),
        })),
      },
      supplierReturnRequest: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { quantity: 0 } }),
        create: jest.fn().mockImplementation(({ data }) => ({ ...data, supplier: purchase.supplier, purchase, sareeLine: line })),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      $queryRaw: jest.fn().mockResolvedValue([]),
      $transaction: jest.fn().mockImplementation((fn: any) => fn(prisma)),
    };
    idGenerator = { nextScoped: jest.fn().mockResolvedValue("RR-RaviSilks-001-001") };
    auditLog = { recordAction: jest.fn() };
    service = new SupplierReturnsService(prisma, idGenerator, auditLog, notificationsStub());
  });

  describe("create", () => {
    it("allocates a scoped id off the supplier's own code and creates the request as PENDING", async () => {
      await service.create(createDto());

      expect(idGenerator.nextScoped).toHaveBeenCalledWith("RR", "RaviSilks-001");
      expect(prisma.supplierReturnRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ id: "RR-RaviSilks-001-001", quantity: 3 }) }),
      );
    });

    it("falls back to the supplier's name segment, never its UUID, when it has no code", async () => {
      prisma.purchase.findUnique.mockResolvedValue({
        ...purchase,
        supplier: { id: "7141a9e5-2b1c-4d3e-8f90-a1b2c3d4e5f6", name: "Ravi Silks", code: null },
      });

      await service.create(createDto());

      expect(idGenerator.nextScoped).toHaveBeenCalledWith("RR", "RaviSilks");
    });

    it("rejects a purchase with no registered supplier rather than guessing one", async () => {
      prisma.purchase.findUnique.mockResolvedValue({ id: "EXT-2026-002", supplierId: null, supplier: null });

      await expect(service.create(createDto())).rejects.toThrow(BadRequestException);
      expect(prisma.supplierReturnRequest.create).not.toHaveBeenCalled();
    });

    it("rejects a saree line that doesn't belong to the given purchase", async () => {
      prisma.purchaseSareeLine.findUnique.mockResolvedValue({ ...line, purchaseId: "some-other-purchase" });

      await expect(service.create(createDto())).rejects.toThrow(NotFoundException);
    });

    it("rejects a quantity larger than what's left after prior returns and pending requests", async () => {
      // line has quantity 10, returnedQuantity 2 -> 8 left; 5 already pending -> 3 available
      prisma.supplierReturnRequest.aggregate.mockResolvedValue({ _sum: { quantity: 5 } });

      await expect(service.create(createDto({ quantity: 4 }))).rejects.toThrow(BadRequestException);
      expect(prisma.supplierReturnRequest.create).not.toHaveBeenCalled();
    });

    it("re-checks availability under a row lock on the line", async () => {
      await service.create(createDto());

      expect(prisma.$queryRaw).toHaveBeenCalled();
    });

    it("allows exactly the remaining available quantity", async () => {
      prisma.supplierReturnRequest.aggregate.mockResolvedValue({ _sum: { quantity: 5 } });

      await expect(service.create(createDto({ quantity: 3 }))).resolves.toBeDefined();
    });
  });

  describe("decide", () => {
    const pendingRequest = {
      id: "RR-RaviSilks-001-001",
      status: "PENDING",
      sareeLineId: "line-1",
      quantity: 3,
      supplier: purchase.supplier,
    };

    const decideDto = (overrides: Partial<DecideSupplierReturnRequestDto> = {}): DecideSupplierReturnRequestDto => ({
      decidedById: "admin-1",
      decision: "APPROVED",
      ...overrides,
    });

    beforeEach(() => {
      prisma.supplierReturnRequest.findUnique.mockResolvedValue(pendingRequest);
      prisma.user.findUnique.mockResolvedValue({ id: "admin-1" });
    });

    it("increments the saree line's returnedQuantity on approval", async () => {
      await service.decide("RR-RaviSilks-001-001", decideDto());

      expect(prisma.purchaseSareeLine.update).toHaveBeenCalledWith({
        where: { id: "line-1" },
        data: { returnedQuantity: { increment: 3 } },
      });
    });

    it("only claims the request while it is still PENDING", async () => {
      await service.decide("RR-RaviSilks-001-001", decideDto());

      expect(prisma.supplierReturnRequest.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "RR-RaviSilks-001-001", status: "PENDING" } }),
      );
    });

    it("moves no stock when a concurrent decision got there first", async () => {
      prisma.supplierReturnRequest.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.decide("RR-RaviSilks-001-001", decideDto())).rejects.toThrow(/already been decided/);
      expect(prisma.purchaseSareeLine.update).not.toHaveBeenCalled();
    });

    it("refuses a request that belongs to a debit note", async () => {
      prisma.supplierReturnRequest.findUnique.mockResolvedValue({ ...pendingRequest, debitNoteId: "DN-RaviSilks-001-001" });

      await expect(service.decide("RR-RaviSilks-001-001", decideDto())).rejects.toThrow(/decide it from the debit note/);
    });

    it("takes the approved pieces off the purchase's stored saree count", async () => {
      await service.decide("RR-RaviSilks-001-001", decideDto());

      expect(prisma.purchase.update).toHaveBeenCalledWith({
        where: { id: line.purchaseId },
        data: { sareeCount: { decrement: 3 } },
      });
    });

    it("leaves the saree line untouched on rejection", async () => {
      await service.decide("RR-RaviSilks-001-001", decideDto({ decision: "REJECTED" }));

      expect(prisma.purchaseSareeLine.update).not.toHaveBeenCalled();
      expect(prisma.purchase.update).not.toHaveBeenCalled();
    });

    it("refuses to decide a request that isn't PENDING", async () => {
      prisma.supplierReturnRequest.findUnique.mockResolvedValue({ ...pendingRequest, status: "APPROVED" });

      await expect(service.decide("RR-RaviSilks-001-001", decideDto())).rejects.toThrow(BadRequestException);
    });

    it("refuses an approval that would return more pieces than the line has", async () => {
      // 9 already returned + 3 > 10 — the increment overshoots and the transaction rolls back.
      prisma.purchaseSareeLine.update.mockResolvedValue({ ...line, returnedQuantity: 12 });

      await expect(service.decide("RR-RaviSilks-001-001", decideDto())).rejects.toThrow(BadRequestException);
      expect(prisma.purchase.update).not.toHaveBeenCalled();
    });
  });
});
