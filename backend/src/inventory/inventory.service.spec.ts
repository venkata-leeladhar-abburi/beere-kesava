import { InventoryService } from "./inventory.service";

describe("InventoryService.findProductionCatalog", () => {
  const row = (sareeId: string) => ({
    sareeId,
    batchId: "BATCH-2026-001",
    recipientType: "WEAVER",
    weaverId: "wv-1",
    factoryLoomId: null,
    designCode: "D-01",
    sareeTypeCode: "ST-01",
    bulkOrderRef: null,
    qcPassed: true,
    receivedColor: "Red",
    receivedWeight: "650.00",
    receivedPhotoUrl: null,
    batch: { createdAt: new Date("2026-09-01") },
    weaver: { firstName: "Rama", lastName: "Rao" },
    factoryLoom: null,
    sareeType: { type: "Kanchi Silk" },
    qcRecords: [
      { id: `qc-${sareeId}`, result: "PASSED", qcDate: new Date("2026-09-05"), receivedDate: null, defects: [] },
    ],
  });

  let prisma: {
    batchSareeRow: { findMany: jest.Mock };
    qcRecord: { findMany: jest.Mock };
    saleRecord: { findMany: jest.Mock };
    returnRecord: { findMany: jest.Mock };
  };
  let service: InventoryService;

  beforeEach(() => {
    prisma = {
      batchSareeRow: {
        findMany: jest.fn().mockResolvedValue([
          row("RAMA-L2-B1-001"),
          row("RAMA-L2-B1-002"),
          row("RAMA-L2-B1-003"),
        ]),
      },
      qcRecord: {
        findMany: jest.fn().mockResolvedValue([{ id: "qc-RAMA-L2-B1-001", photoUrl: "/uploads/photos/a.jpg" }]),
      },
      saleRecord: {
        findMany: jest.fn().mockResolvedValue([
          { sareeId: "RAMA-L2-B1-002", date: new Date("2026-09-10") },
          { sareeId: "RAMA-L2-B1-003", date: new Date("2026-09-10") },
        ]),
      },
      returnRecord: {
        // 003 came back after its sale and was put back on the shelf.
        findMany: jest.fn().mockResolvedValue([
          { sareeId: "RAMA-L2-B1-003", createdAt: new Date("2026-09-12"), restocked: true },
        ]),
      },
    };
    service = new InventoryService(prisma as never);
  });

  it("reports sold only for a sale no restocked return has undone", async () => {
    const items = await service.findProductionCatalog();
    const sold = Object.fromEntries(items.map((i) => [i.sareeId, i.sold]));

    expect(sold).toEqual({
      "RAMA-L2-B1-001": false,
      "RAMA-L2-B1-002": true,
      "RAMA-L2-B1-003": false,
    });
  });

  it("carries QC, owner and photo facts but no money", async () => {
    const [first] = await service.findProductionCatalog();

    expect(first).toMatchObject({
      weaverName: "Rama Rao",
      weaverLoom: 2,
      sareeTypeName: "Kanchi Silk",
      weightG: 650,
      photoUrl: "/uploads/photos/a.jpg",
      qc: { result: "PASSED", defects: [] },
    });
    const serialized = JSON.stringify(first);
    for (const key of ["makingCharge", "deduction", "payable", "retailPrice", "sellingPrice"]) {
      expect(serialized).not.toContain(key);
    }
  });

  it("never selects the QC photo column in the main query", async () => {
    await service.findProductionCatalog();
    const select = prisma.batchSareeRow.findMany.mock.calls[0][0].select;

    expect(select.qcRecords.select.photoUrl).toBeUndefined();
  });
});
