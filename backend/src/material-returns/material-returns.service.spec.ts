import { NotFoundException } from "@nestjs/common";
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
    service = new MaterialReturnsService(prisma, idGenerator, auditLog, storage, { create: jest.fn() } as any);
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

  it("records the saree and flags the excess when the declared weight exceeds what's outstanding", async () => {
    // 600g outstanding, saree declares 700g — a saree heavier than its type's
    // standard weight. Refusing this used to leave the saree unreceived and
    // its material weights unrecorded anywhere.
    const result = await service.createAutoReturnForReceipt({
      weaverId: "w-1",
      batchId: "BATCH-0007",
      receivedById: "u-1",
      requests: [{ materialType: "WARP", grams: 700 }],
    });

    expect(prisma.materialReturnRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          // Only the 600g actually outstanding is drawn down — outstanding
          // goes to zero, never negative.
          items: { create: [expect.objectContaining({ materialType: "WARP", quantity: 600 })] },
          notes: expect.stringContaining("OVER-DECLARED"),
        }),
      }),
    );
    expect(prisma.materialReturnRecord.create.mock.calls[0][0].data.notes).toContain("100g WARP");
    expect(result).toMatchObject({ id: "MRR-2026-001" });
  });

  it("still records the excess when the weaver has nothing outstanding at all", async () => {
    prisma.materialIssueRecord.findMany.mockResolvedValue([]);

    const result = await service.createAutoReturnForReceipt({
      weaverId: "w-1",
      batchId: "BATCH-0007",
      receivedById: "u-1",
      requests: [{ materialType: "WARP", grams: 500 }],
    });

    // Nothing to draw down, so no items — but the receipt is not blocked and
    // the over-declaration is on the record for admin.
    expect(prisma.materialReturnRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          items: { create: [] },
          notes: expect.stringContaining("500g WARP"),
        }),
      }),
    );
    expect(result).toMatchObject({ id: "MRR-2026-001" });
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

/**
 * getOutstanding backs the Return Materials page's "Outstanding Material with
 * <weaver>" panel. Selecting a loom, then a batch, narrows the same balance —
 * and each row is one GRN line, so the admin can trace the weight back to the
 * receipt it was issued from.
 */
describe("MaterialReturnsService.getOutstanding", () => {
  let prisma: any;
  let service: MaterialReturnsService;

  const issueItem = (overrides: Record<string, unknown> = {}) => ({
    materialType: "RESHAM",
    warpSubtype: null,
    quantity: 1,
    unit: "KG",
    jariType: null,
    jariGrade: null,
    jariColor: null,
    grnBatchId: null,
    grnItemId: null,
    grnItem: null,
    ...overrides,
  });

  beforeEach(() => {
    prisma = {
      materialIssueRecord: { findMany: jest.fn().mockResolvedValue([]) },
      materialReturnRecord: { findMany: jest.fn().mockResolvedValue([]) },
    };
    service = new MaterialReturnsService(prisma, {} as any, {} as any, {} as any, {} as any);
  });

  it("passes loomNumber and batchId through to BOTH the issue and the return query", async () => {
    await service.getOutstanding({ weaverId: "w-1", loomNumber: "1", batchId: "BATCH-014" });

    expect(prisma.materialIssueRecord.findMany.mock.calls[0][0].where).toEqual(
      expect.objectContaining({ weaverId: "w-1", loomNumber: "1", batchId: "BATCH-014" }),
    );
    expect(prisma.materialReturnRecord.findMany.mock.calls[0][0].where).toEqual(
      expect.objectContaining({ weaverId: "w-1", loomNumber: "1", batchId: "BATCH-014" }),
    );
  });

  it("omits the loom/batch filters entirely when none is selected", async () => {
    await service.getOutstanding({ weaverId: "w-1" });

    const where = prisma.materialIssueRecord.findMany.mock.calls[0][0].where;
    expect(where).not.toHaveProperty("loomNumber");
    expect(where).not.toHaveProperty("batchId");
  });

  it("keeps two GRN receipts of the same material as separate, traceable lines", async () => {
    prisma.materialIssueRecord.findMany.mockResolvedValue([
      {
        id: "MIR-2026-001",
        status: MaterialIssueStatus.SIGNED,
        items: [
          issueItem({
            quantity: 3,
            grnBatchId: "GRN-A-001",
            grnItemId: "gi-1",
            grnItem: { itemCode: "GRN-A-001-1", description: "Gold 2-ply", name: "Resham" },
          }),
          issueItem({
            quantity: 2,
            grnBatchId: "GRN-B-002",
            grnItemId: "gi-2",
            grnItem: { itemCode: "GRN-B-002-1", description: null, name: "Resham" },
          }),
        ],
      },
    ]);

    const result = await service.getOutstanding({ weaverId: "w-1" });

    expect(result).toEqual([
      expect.objectContaining({
        grnBatchId: "GRN-A-001",
        grnItemCode: "GRN-A-001-1",
        description: "Gold 2-ply",
        unit: "KG",
        issueIds: ["MIR-2026-001"],
        issuedGrams: 3000,
        returnedGrams: 0,
        outstandingGrams: 3000,
      }),
      expect.objectContaining({
        grnBatchId: "GRN-B-002",
        // Falls back to the GRN line's name when it carries no description.
        description: "Resham",
        outstandingGrams: 2000,
      }),
    ]);
  });

  it("draws a return down across that variant's GRN lines oldest-issued first", async () => {
    prisma.materialIssueRecord.findMany.mockResolvedValue([
      {
        id: "MIR-2026-001",
        status: MaterialIssueStatus.SIGNED,
        items: [issueItem({ quantity: 3, grnBatchId: "GRN-A-001", grnItemId: "gi-1" })],
      },
      {
        id: "MIR-2026-002",
        status: MaterialIssueStatus.SIGNED,
        items: [issueItem({ quantity: 2, grnBatchId: "GRN-B-002", grnItemId: "gi-2" })],
      },
    ]);
    // Returns carry no GRN link — 4kg of "Resham" comes back, nothing more.
    prisma.materialReturnRecord.findMany.mockResolvedValue([
      { id: "MRR-2026-001", status: MaterialReturnStatus.APPROVED, items: [issueItem({ quantity: 4 })] },
    ]);

    const result = await service.getOutstanding({ weaverId: "w-1" });

    // The older GRN-A line absorbs its full 3kg, GRN-B absorbs the last 1kg
    // and keeps 1kg outstanding. Fully-returned lines drop out.
    expect(result).toEqual([
      expect.objectContaining({
        grnBatchId: "GRN-B-002",
        issuedGrams: 2000,
        returnedGrams: 1000,
        outstandingGrams: 1000,
      }),
    ]);
  });

  it("never reports negative outstanding when more was returned than issued", async () => {
    prisma.materialIssueRecord.findMany.mockResolvedValue([
      { id: "MIR-2026-001", status: MaterialIssueStatus.SIGNED, items: [issueItem({ quantity: 1 })] },
    ]);
    prisma.materialReturnRecord.findMany.mockResolvedValue([
      { id: "MRR-2026-001", status: MaterialReturnStatus.APPROVED, items: [issueItem({ quantity: 5 })] },
    ]);

    expect(await service.getOutstanding({ weaverId: "w-1" })).toEqual([]);
  });
});
