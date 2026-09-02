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
      purchase: { findUnique: jest.fn().mockResolvedValue(purchase) },
      purchaseSareeLine: { findUnique: jest.fn().mockResolvedValue(line), update: jest.fn() },
      supplierReturnRequest: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { quantity: 0 } }),
        create: jest.fn().mockImplementation(({ data }) => ({ ...data, supplier: purchase.supplier, purchase, sareeLine: line })),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
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
        data: { returnedQuantity: 5 }, // 2 + 3
      });
    });

    it("leaves the saree line untouched on rejection", async () => {
      await service.decide("RR-RaviSilks-001-001", decideDto({ decision: "REJECTED" }));

      expect(prisma.purchaseSareeLine.update).not.toHaveBeenCalled();
    });

    it("refuses to decide a request that isn't PENDING", async () => {
      prisma.supplierReturnRequest.findUnique.mockResolvedValue({ ...pendingRequest, status: "APPROVED" });

      await expect(service.decide("RR-RaviSilks-001-001", decideDto())).rejects.toThrow(BadRequestException);
    });

    it("refuses an approval that would return more pieces than the line has", async () => {
      prisma.purchaseSareeLine.findUnique.mockResolvedValue({ ...line, returnedQuantity: 9 }); // 9 + 3 > 10

      await expect(service.decide("RR-RaviSilks-001-001", decideDto())).rejects.toThrow(BadRequestException);
      expect(prisma.purchaseSareeLine.update).not.toHaveBeenCalled();
    });
  });
});
