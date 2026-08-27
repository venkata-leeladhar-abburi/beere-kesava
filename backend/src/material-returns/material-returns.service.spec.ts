import { BadRequestException, NotFoundException } from "@nestjs/common";
import { MaterialReturnsService } from "./material-returns.service";
import { MaterialIssueStatus, MaterialReturnStatus } from "../generated/prisma/client";

/**
 * createAutoReturnForReceipt is the backing logic for BatchesService.receiveRow's
 * outstanding-material check: a saree can only be received with a declared
 * warp/resham/jari weight if that much is still outstanding against the
 * weaver, and receiving it draws that amount down via a synthetic,
 * already-approved MaterialReturnRecord (see batches.service.ts).
 */
describe("MaterialReturnsService.createAutoReturnForReceipt", () => {
  let prisma: any;
  let idGenerator: any;
  let auditLog: any;
  let storage: any;
  let service: MaterialReturnsService;

  const issueItem = (overrides: Record<string, unknown> = {}) => ({
    materialType: "WARP",
    warpSubtype: null,
    quantity: 600,
    unit: "G",
    jariType: null,
    jariGrade: null,
    jariColor: null,
    ...overrides,
  });

  beforeEach(() => {
    prisma = {
      materialIssueRecord: {
        findMany: jest.fn().mockResolvedValue([
          { status: MaterialIssueStatus.SIGNED, items: [issueItem()] },
        ]),
      },
      materialReturnRecord: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: "MRR-2026-001", ...data })),
      },
      weaver: {
        findUnique: jest.fn().mockResolvedValue({ id: "w-1", code: null, firstName: "Ramesh" }),
      },
    };
    idGenerator = { nextScoped: jest.fn().mockResolvedValue("MRR-2026-001") };
    auditLog = { recordAction: jest.fn() };
    storage = { upload: jest.fn() };
    service = new MaterialReturnsService(prisma, idGenerator, auditLog, storage);
  });

  it("draws down outstanding and creates an already-approved return when enough is outstanding", async () => {
    const result = await service.createAutoReturnForReceipt({
      weaverId: "w-1",
      batchId: "BATCH-0007",
      receivedById: "u-1",
      requests: [{ materialType: "WARP", grams: 500 }],
    });

    expect(prisma.materialReturnRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          weaverId: "w-1",
          batchId: "BATCH-0007",
          receivedById: "u-1",
          status: MaterialReturnStatus.APPROVED,
          signatureCaptured: false,
          items: { create: [expect.objectContaining({ materialType: "WARP", quantity: 500, unit: "G" })] },
        }),
      }),
    );
    expect(result).toMatchObject({ id: "MRR-2026-001" });
  });

  it("refuses when the weaver's outstanding balance can't cover the declared weight", async () => {
    await expect(
      service.createAutoReturnForReceipt({
        weaverId: "w-1",
        batchId: "BATCH-0007",
        receivedById: "u-1",
        requests: [{ materialType: "WARP" as any, grams: 700 }],
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.materialReturnRecord.create).not.toHaveBeenCalled();
  });

  it("does not restore RawMaterialStock — the material stays consumed in the saree, not the warehouse", async () => {
    await service.createAutoReturnForReceipt({
      weaverId: "w-1",
      batchId: "BATCH-0007",
      receivedById: "u-1",
      requests: [{ materialType: "WARP", grams: 500 }],
    });

    expect(prisma.rawMaterialStock).toBeUndefined();
  });

  it("returns null and creates nothing when every requested amount is zero", async () => {
    const result = await service.createAutoReturnForReceipt({
      weaverId: "w-1",
      batchId: "BATCH-0007",
      receivedById: "u-1",
      requests: [{ materialType: "WARP", grams: 0 }],
    });

    expect(result).toBeNull();
    expect(prisma.materialReturnRecord.create).not.toHaveBeenCalled();
  });

  it("404s when the weaver doesn't exist", async () => {
    prisma.weaver.findUnique.mockResolvedValue(null);

    await expect(
      service.createAutoReturnForReceipt({
        weaverId: "w-ghost",
        batchId: "BATCH-0007",
        receivedById: "u-1",
        requests: [{ materialType: "WARP" as any, grams: 100 }],
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it("scopes findAll to the weaver's own returns when scopedWeaverId is given, ignoring query overrides", async () => {
    prisma.materialReturnRecord.findMany.mockResolvedValue([]);
    prisma.materialReturnRecord.count.mockResolvedValue(0);

    await service.findAll(
      { page: 1, pageSize: 10, weaverId: "w-OTHER", factoryLoomId: "fl-9" },
      "w-1",
    );

    expect(prisma.materialReturnRecord.findMany.mock.calls[0][0].where).toEqual(
      expect.objectContaining({ weaverId: "w-1", factoryLoomId: undefined }),
    );
  });

  it("404s findOne for a return that belongs to a different weaver", async () => {
    prisma.materialReturnRecord.findUnique.mockResolvedValue({ id: "MRR-2026-001", weaverId: "w-OTHER" });

    await expect(service.findOne("MRR-2026-001", "w-1")).rejects.toThrow(NotFoundException);
  });

  it("scopes getOutstanding to the weaver's own balance, ignoring a factoryLoomId in the query", async () => {
    const result = await service.getOutstanding({ factoryLoomId: "fl-9" }, "w-1");

    expect(prisma.materialIssueRecord.findMany.mock.calls[0][0].where).toEqual(
      expect.objectContaining({ weaverId: "w-1" }),
    );
    expect(result).toBeDefined();
  });

  it("allocates across multiple outstanding groups of the same material type, largest first", async () => {
    prisma.materialIssueRecord.findMany.mockResolvedValue([
      {
        status: MaterialIssueStatus.SIGNED,
        items: [
          issueItem({ warpSubtype: "RESHAM_WARP", quantity: 200 }),
          issueItem({ warpSubtype: "JARI_WARP", quantity: 500 }),
        ],
      },
    ]);

    await service.createAutoReturnForReceipt({
      weaverId: "w-1",
      batchId: "BATCH-0007",
      receivedById: "u-1",
      requests: [{ materialType: "WARP", grams: 600 }],
    });

    const items = prisma.materialReturnRecord.create.mock.calls[0][0].data.items.create;
    expect(items).toEqual([
      expect.objectContaining({ warpSubtype: "JARI_WARP", quantity: 500 }),
      expect.objectContaining({ warpSubtype: "RESHAM_WARP", quantity: 100 }),
    ]);
  });
});
