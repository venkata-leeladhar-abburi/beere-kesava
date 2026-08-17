import { BadRequestException, ConflictException } from "@nestjs/common";
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
      saree: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn() },
      designLibrary: { findUnique: jest.fn() },
      sareeTypeRate: { findFirst: jest.fn() },
      returnRecord: { create: jest.fn(), findUnique: jest.fn().mockResolvedValue({ returnRef: "RET-SreeKesava-001" }) },
      inventoryRecord: { create: jest.fn() },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    idGenerator = { nextNamed: jest.fn().mockResolvedValue("RET-SreeKesava-001") };
    auditLog = { recordAction: jest.fn() };
    service = new SalesService(prisma, idGenerator, auditLog);
  });

  it("registers the saree, the return and the stock row in a single transaction", async () => {
    await service.registerReturnedSaree(dto());

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.saree.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: "RTN-WS-014",
        origin: "EXTERNAL",
        weightG: 840,
        sourceName: "Sree Kesava",
        status: "UNSOLD",
      }),
    });
    expect(prisma.returnRecord.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ returnRef: "RET-SreeKesava-001", sareeId: "RTN-WS-014", restocked: true }),
    });
    // FINISHING_COMPLETE is what the inventory list treats as sellable stock.
    expect(prisma.inventoryRecord.create).toHaveBeenCalledWith({
      data: { sareeId: "RTN-WS-014", status: "FINISHING_COMPLETE", rawType: "RETURN" },
    });
  });

  it("rejects a tag id that is already in use rather than overwriting the saree", async () => {
    prisma.saree.findUnique.mockResolvedValue({ id: "RTN-WS-014" });

    await expect(service.registerReturnedSaree(dto())).rejects.toThrow(ConflictException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("links a design code that exists in the library", async () => {
    prisma.designLibrary.findUnique.mockResolvedValue({ code: "BKB-045" });

    await service.registerReturnedSaree(dto({ designCode: "BKB-045" }));

    expect(prisma.saree.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ designCode: "BKB-045" }),
    });
  });

  it("rejects an unknown design code instead of silently dropping it", async () => {
    prisma.designLibrary.findUnique.mockResolvedValue(null);

    await expect(service.registerReturnedSaree(dto({ designCode: "NOPE-1" }))).rejects.toThrow(
      BadRequestException,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
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

    expect(prisma.designLibrary.findUnique).not.toHaveBeenCalled();
    expect(prisma.sareeTypeRate.findFirst).not.toHaveBeenCalled();
    expect(prisma.saree.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ designCode: undefined, sareeTypeCode: undefined }),
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
    service = new SalesService(prisma, idGenerator, auditLog);
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
