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
    // `batch` is a required relation the service always includes — the scan
    // result reports the batch's own date alongside the saree's.
    batch: { id: "b1", createdAt: new Date("2026-08-01") },
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
      returnRecord: { findFirst: jest.fn().mockResolvedValue(null) },
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

/**
 * An external purchase is stored as one LINE covering several physical
 * pieces, and `finalAmount` is that whole line's total. Handing it back as a
 * scanned piece's selling price put the entire line's value on the counter
 * for one saree — a ten-piece line of ₹23,000 sarees scanned as ₹2,30,000,
 * disagreeing with the ₹23,000 the piece's own printed tag showed.
 */
describe("ScanService.lookup — external piece selling price", () => {
  const purchaseLine = (over: Record<string, unknown> = {}) => ({
    id: "l1",
    code: "JJSI-OS-001",
    quantity: 10,
    returnedQuantity: 0,
    price: 20_000,
    sellPercent: 15,
    finalAmount: 230_000, // (20000 + 15%) x 10 — the LINE total
    sareeType: "SELF BROCADE",
    color: null,
    weight: null,
    purchase: {
      id: "EXT-1",
      date: new Date("2026-09-01"),
      invoiceNumber: "OS",
      supplier: { id: "sup1", name: "JJ Silks", initials: "JJS" },
      supplierName: null,
    },
    ...over,
  });

  const serviceFor = (line: unknown) =>
    new ScanService({
      batchSareeRow: { findUnique: jest.fn().mockResolvedValue(null) },
      purchaseSareeLine: { findFirst: jest.fn().mockResolvedValue(line) },
    } as never);

  it("prices one piece, not the whole line it was bought in", async () => {
    const result = await serviceFor(purchaseLine()).lookup("JJSI-OS-001-01");

    expect(result.sellingPrice).toBe(23_000);
    expect(result.costPrice).toBe(20_000);
  });

  it("keeps the paise of a hand-typed selling price", async () => {
    // ₹13,600 sold at ₹26,928.55 — the markup the External Purchase form
    // stores for that is not a round percentage.
    const line = purchaseLine({ price: 13_600, sellPercent: 98.00404411, quantity: 3 });

    const result = await serviceFor(line).lookup("JJSI-OS-001-02");

    expect(result.sellingPrice).toBe(26_928.55);
  });

  it("a single-piece line is unchanged — it was always its own total", async () => {
    const line = purchaseLine({ quantity: 1, price: 20_000, sellPercent: 15, finalAmount: 23_000 });

    const result = await serviceFor(line).lookup("JJSI-OS-001-01");

    expect(result.sellingPrice).toBe(23_000);
  });
});
