import { BadRequestException } from "@nestjs/common";
import { notificationsStub } from "../common/testing/notifications.stub";
import { SalesService } from "./sales.service";
import { SalesChannel } from "../generated/prisma/client";
import { CreateSaleDto } from "./dto/create-sale.dto";
import { passthroughSareeCodes } from "../saree-codes/testing";

/**
 * GST on a counter bill: optional, bill-wide, and already included in each
 * saree's `amount`. The service stores the rate, the saree's share of the tax,
 * the buyer's GSTIN and the seller's GSTIN as it stood at sale time.
 */
describe("SalesService — GST on a counter sale", () => {
  let prisma: any;
  let service: SalesService;

  const sale = (extra: Partial<CreateSaleDto> = {}): CreateSaleDto => ({
    sareeId: "RAMOJI-L1-B001-008",
    channel: SalesChannel.RETAIL,
    customerId: "c1",
    amount: 1050,
    paymentMethod: "cash",
    ...extra,
  });

  const created = () => prisma.saleRecord.create.mock.calls[0][0].data;

  beforeEach(() => {
    prisma = {
      batchSareeRow: {
        findUnique: jest.fn().mockResolvedValue({ sareeId: "RAMOJI-L1-B001-008", qcPassed: true, batchId: "B001", weaverId: "w1" }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      dispatchSaree: { findMany: jest.fn().mockResolvedValue([]) },
      saleRecord: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        findUnique: jest.fn().mockResolvedValue({ saleRef: "RETAIL-Chetan-001" }),
      },
      inventoryRecord: { findUnique: jest.fn().mockResolvedValue(null), upsert: jest.fn() },
      customer: { findUnique: jest.fn().mockResolvedValue({ id: "c1", name: "Chetan", type: "RETAIL", phone: null, code: null }) },
      firm: { findFirst: jest.fn().mockResolvedValue({ id: "f1", gstNumber: " 37AABCB1234C1Z5 " }) },
      saree: { upsert: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
      user: { findUnique: jest.fn() },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    const idGenerator = { nextScoped: jest.fn().mockResolvedValue("RETAIL-Chetan-001") };
    service = new SalesService(prisma, idGenerator as any, { recordAction: jest.fn() } as any, notificationsStub(), passthroughSareeCodes);
    // The admin feed is covered by the bill-notification spec.
    jest.spyOn(service as any, "sendSaleNotification").mockResolvedValue(undefined);
  });

  it("records no GST columns on a sale without GST", async () => {
    await service.createSale(sale({ amount: 1000 }));

    expect(created()).not.toHaveProperty("gstRate");
    expect(created()).not.toHaveProperty("gstAmount");
  });

  it("stores the rate, the saree's share, the buyer's GSTIN and the firm's GSTIN", async () => {
    await service.createSale(sale({ gstRate: 5, gstAmount: 50, customerGstin: "36AAACR5055K1Z5", billId: "7b0f3c1e-2f5a-4d1b-9a53-1b9f3f0d7c11" }));

    expect(created()).toMatchObject({
      amount: 1050,
      gstRate: 5,
      gstAmount: 50,
      customerGstin: "36AAACR5055K1Z5",
      sellerGstin: "37AABCB1234C1Z5",
      billId: "7b0f3c1e-2f5a-4d1b-9a53-1b9f3f0d7c11",
    });
  });

  it("allows the rupee the counter's whole-rupee rounding and split move onto one saree", async () => {
    // 12% on ₹1,234 is ₹148.08; the counter rounds CGST and SGST to ₹74 each.
    await expect(service.createSale(sale({ amount: 1382, gstRate: 12, gstAmount: 148 }))).resolves.toBeDefined();
    // A saree's share of a bill's GST can sit a rupee or so off its own 5%.
    await expect(service.createSale(sale({ amount: 1051, gstRate: 5, gstAmount: 51 }))).resolves.toBeDefined();
  });

  it("rejects GST that does not match the rate", async () => {
    await expect(service.createSale(sale({ amount: 1180, gstRate: 5, gstAmount: 180 }))).rejects.toThrow(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects a rate without an amount, and an amount without a rate", async () => {
    await expect(service.createSale(sale({ gstRate: 5 }))).rejects.toThrow(BadRequestException);
    await expect(service.createSale(sale({ gstAmount: 50 }))).rejects.toThrow(BadRequestException);
  });

  it("rejects a customer GSTIN on a sale that charges no GST", async () => {
    await expect(service.createSale(sale({ amount: 1000, customerGstin: "36AAACR5055K1Z5" }))).rejects.toThrow(BadRequestException);
  });

  it("leaves the seller GSTIN empty when the retail firm has none on file", async () => {
    prisma.firm.findFirst.mockResolvedValue({ id: "f1", gstNumber: null });
    await service.createSale(sale({ gstRate: 5, gstAmount: 50 }));

    expect(created()).toMatchObject({ sellerGstin: null, customerGstin: null });
  });
});
