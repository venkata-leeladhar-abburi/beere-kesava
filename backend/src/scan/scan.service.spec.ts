import { ScanService } from "./scan.service";

/**
 * A SHOP dispatch delivers a saree to the shop floor — that is what *makes* it
 * counter stock. Treating every dispatch as "gone" meant each saree the shop
 * was sent became unsellable the moment it arrived.
 */
describe("ScanService.lookup — sale eligibility", () => {
  let prisma: any;
  let service: ScanService;

  const wovenRow = {
    batchId: "b1",
    recipientType: "WEAVER",
    weaver: null,
    factoryLoom: null,
    design: null,
    sareeType: null,
    qcRecords: [],
    finishingAssignment: null,
    qcPassed: true,
    receivedSellingPrice: null,
    weaverId: null,
    factoryLoomId: null,
  };

  const dispatchOf = (type: "SHOP" | "WHOLESALE") => [
    { dispatch: { type, dispatchDate: new Date("2026-08-21") } },
  ];

  beforeEach(() => {
    prisma = {
      batchSareeRow: { findUnique: jest.fn().mockResolvedValue({ ...wovenRow }) },
      inventoryRecord: { findUnique: jest.fn().mockResolvedValue(null) },
      dispatchSaree: { findMany: jest.fn().mockResolvedValue([]) },
      saleRecord: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    service = new ScanService(prisma);
  });

  it("marks a saree dispatched to the shop as sellable at the counter", async () => {
    prisma.dispatchSaree.findMany.mockResolvedValue(dispatchOf("SHOP"));

    const result = await service.lookup("RAMARAO-L1-001");

    expect(result.saleEligibility).toBe("PASSED");
    expect(result.atShop).toBe(true);
  });

  it("marks a QC-passed saree still in the factory as not in the shop", async () => {
    const result = await service.lookup("RAMARAO-L1-001");

    expect(result.saleEligibility).toBe("NOT_IN_SHOP");
    expect(result.atShop).toBe(false);
  });

  it("marks a wholesale-dispatched saree as gone", async () => {
    prisma.dispatchSaree.findMany.mockResolvedValue(dispatchOf("WHOLESALE"));

    const result = await service.lookup("RAMARAO-L1-001");

    expect(result.saleEligibility).toBe("WHOLESALE_DISPATCHED");
    expect(result.atShop).toBe(false);
  });

  it("a sale still beats everything else", async () => {
    prisma.dispatchSaree.findMany.mockResolvedValue(dispatchOf("SHOP"));
    prisma.saleRecord.findFirst.mockResolvedValue({ id: "s1" });

    const result = await service.lookup("RAMARAO-L1-001");

    expect(result.saleEligibility).toBe("SOLD");
  });

  it("QC failure still blocks a saree that somehow reached the shop", async () => {
    prisma.batchSareeRow.findUnique.mockResolvedValue({ ...wovenRow, qcPassed: false });
    prisma.dispatchSaree.findMany.mockResolvedValue(dispatchOf("SHOP"));

    const result = await service.lookup("RAMARAO-L1-001");

    expect(result.saleEligibility).toBe("QC_NOT_PASSED");
  });
});
