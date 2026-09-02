import { notificationsStub } from "../common/testing/notifications.stub";
import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { SalesService } from "./sales.service";
import { RegisterReturnedSareeDto } from "./dto/register-returned-saree.dto";

describe("SalesService.registerReturnedSaree", () => {
  let prisma: any;
  let idGenerator: any;
  let auditLog: any;
  let service: SalesService;

  const dto = (overrides: Partial<RegisterReturnedSareeDto> = {}): RegisterReturnedSareeDto => ({
    sareeId: "RTN-WS-014",
    sourceName: "Sree Kesava",
    reason: "Defective",
    weightG: 840,
    ...overrides,
  });

  beforeEach(() => {
    prisma = {
      saree: { findUnique: jest.fn().mockResolvedValue(null), findFirst: jest.fn().mockResolvedValue(null), create: jest.fn() },
      sareeTypeRate: { findFirst: jest.fn() },
      returnRecord: { create: jest.fn(), findUnique: jest.fn().mockResolvedValue({ returnRef: "RET-SreeKesava-001" }) },
      inventoryRecord: { create: jest.fn() },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    idGenerator = { nextNamed: jest.fn().mockResolvedValue("RET-SreeKesava-001") };
    auditLog = { recordAction: jest.fn() };
    service = new SalesService(prisma, idGenerator, auditLog, notificationsStub());
  });

  it("registers the saree and its return in a single transaction, held out of stock", async () => {
    await service.registerReturnedSaree(dto());

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.saree.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: "RTN-WS-014",
        origin: "EXTERNAL",
        weightG: 840,
        sourceName: "Sree Kesava",
        // Held for inspection — sellable only once it is sent to inventory.
        status: "RETURNED",
      }),
    });
    expect(prisma.returnRecord.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ returnRef: "RET-SreeKesava-001", sareeId: "RTN-WS-014", restocked: false }),
    });
    // No stock row yet: sendReturnToInventory writes that, not registration.
    expect(prisma.inventoryRecord.create).not.toHaveBeenCalled();
  });

  it("rejects a tag id that is already in use rather than overwriting the saree", async () => {
    prisma.saree.findFirst.mockResolvedValue({ id: "RTN-WS-014" });

    await expect(service.registerReturnedSaree(dto())).rejects.toThrow(ConflictException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("appends the operator's note to the reason so an \"Other\" return still says why", async () => {
    await service.registerReturnedSarees({
      sourceName: "Sree Kesava",
      items: [{ sareeId: "RTN-WS-020", reason: "Other", reasonNote: "Zari tarnished", weightG: 800 }],
    });

    expect(prisma.returnRecord.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ reason: "Other — Zari tarnished" }),
    });
  });

  it("rejects a consignment that uses the same tag id twice", async () => {
    await expect(
      service.registerReturnedSarees({
        sourceName: "Sree Kesava",
        items: [
          { sareeId: "RTN-WS-030", reason: "Defective", weightG: 800 },
          { sareeId: "RTN-WS-030", reason: "Defective", weightG: 820 },
        ],
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("writes every piece of a multi-saree consignment in one transaction", async () => {
    idGenerator.nextNamed
      .mockResolvedValueOnce("RET-SreeKesava-001")
      .mockResolvedValueOnce("RET-SreeKesava-002");

    await service.registerReturnedSarees({
      sourceName: "Sree Kesava",
      items: [
        { sareeId: "RTN-WS-040", reason: "Overstock", weightG: 800 },
        { sareeId: "RTN-WS-041", reason: "Overstock", weightG: 810 },
      ],
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.saree.create).toHaveBeenCalledTimes(2);
    expect(prisma.returnRecord.create).toHaveBeenCalledTimes(2);
  });

  it("resolves the saree type by its human name to a rate code", async () => {
    prisma.sareeTypeRate.findFirst.mockResolvedValue({ code: "SB-001", type: "Self Brocade" });

    await service.registerReturnedSaree(dto({ sareeType: "Self Brocade" }));

    expect(prisma.saree.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ sareeTypeCode: "SB-001" }),
    });
  });

  it("rejects an unconfigured saree type instead of silently dropping it", async () => {
    prisma.sareeTypeRate.findFirst.mockResolvedValue(null);

    await expect(service.registerReturnedSaree(dto({ sareeType: "Imaginary Silk" }))).rejects.toThrow(
      BadRequestException,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("leaves optional master-data links unset when nothing was entered", async () => {
    await service.registerReturnedSaree(dto());

    expect(prisma.sareeTypeRate.findFirst).not.toHaveBeenCalled();
    expect(prisma.saree.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ sareeTypeCode: undefined }),
    });
  });

  it("records the return against the audit trail", async () => {
    await service.registerReturnedSaree(dto());

    expect(auditLog.recordAction).toHaveBeenCalledWith(
      expect.objectContaining({ module: "SALES", entityType: "ReturnRecord", entityId: "RET-SreeKesava-001" }),
    );
  });

  it("derives the return's id segment from the free-text source name, since there is no registered Customer here", async () => {
    await service.registerReturnedSaree(dto({ sourceName: "Shiva Traders" }));

    expect(idGenerator.nextNamed).toHaveBeenCalledWith("RET", "ShivaTraders");
  });
});

describe("SalesService.createReturn", () => {
  let prisma: any;
  let idGenerator: any;
  let auditLog: any;
  let service: SalesService;

  beforeEach(() => {
    prisma = {
      saree: { findUnique: jest.fn().mockResolvedValue({ id: "SR-001", status: "WHOLESALE" }), update: jest.fn() },
      saleRecord: { findFirst: jest.fn() },
      returnRecord: {
        create: jest.fn(),
        findUnique: jest.fn().mockResolvedValue({ returnRef: "RET-SreeGaneshSilks-001" }),
      },
      inventoryRecord: { upsert: jest.fn() },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    idGenerator = { nextNamed: jest.fn().mockResolvedValue("RET-SreeGaneshSilks-001") };
    auditLog = { recordAction: jest.fn() };
    service = new SalesService(prisma, idGenerator, auditLog, notificationsStub());
  });

  it("reads the id segment off the wholesale customer's business name", async () => {
    prisma.saleRecord.findFirst.mockResolvedValue({
      customer: { name: "Sree Ganesh Silks", type: "WHOLESALE" },
    });

    await service.createReturn({ sareeId: "SR-001" });

    expect(idGenerator.nextNamed).toHaveBeenCalledWith("RET", "SreeGaneshSilks");
  });

  it("reads the id segment off the retail customer's first name", async () => {
    prisma.saleRecord.findFirst.mockResolvedValue({
      customer: { name: "Padma Veni", type: "RETAIL" },
    });

    await service.createReturn({ sareeId: "SR-001" });

    expect(idGenerator.nextNamed).toHaveBeenCalledWith("RET", "Padma");
  });

  it("rejects a return when the saree has no sale record to identify the customer from", async () => {
    prisma.saleRecord.findFirst.mockResolvedValue(null);

    await expect(service.createReturn({ sareeId: "SR-001" })).rejects.toThrow(
      "No sale record found for saree SR-001",
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

describe("SalesService.sendReturnToInventory", () => {
  let prisma: any;
  let auditLog: any;
  let service: SalesService;

  const held = {
    returnRef: "RET-SreeKesava-001",
    sareeId: "RTN-WS-014",
    restocked: false,
    saree: { id: "RTN-WS-014", status: "RETURNED" },
  };

  beforeEach(() => {
    prisma = {
      returnRecord: {
        findUnique: jest.fn().mockResolvedValue(held),
        update: jest.fn(),
      },
      saree: { update: jest.fn() },
      inventoryRecord: { upsert: jest.fn() },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    auditLog = { recordAction: jest.fn() };
    service = new SalesService(prisma, { nextNamed: jest.fn() } as any, auditLog, notificationsStub());
  });

  it("flips the return, the saree and the stock row together", async () => {
    await service.sendReturnToInventory("RET-SreeKesava-001");

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.returnRecord.update).toHaveBeenCalledWith({
      where: { returnRef: "RET-SreeKesava-001" },
      data: { restocked: true },
    });
    expect(prisma.saree.update).toHaveBeenCalledWith({
      where: { id: "RTN-WS-014" },
      data: { status: "UNSOLD" },
    });
    expect(prisma.inventoryRecord.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { sareeId: "RTN-WS-014" } }),
    );
  });

  it("is a no-op on a return that is already in stock, so two staff can press it at once", async () => {
    prisma.returnRecord.findUnique.mockResolvedValue({ ...held, restocked: true });

    await service.sendReturnToInventory("RET-SreeKesava-001");

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(auditLog.recordAction).not.toHaveBeenCalled();
  });

  it("rejects an unknown return ref", async () => {
    prisma.returnRecord.findUnique.mockResolvedValue(null);

    await expect(service.sendReturnToInventory("RET-NOPE-001")).rejects.toThrow(NotFoundException);
  });
});
