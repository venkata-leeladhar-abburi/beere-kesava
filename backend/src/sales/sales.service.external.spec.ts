import { BadRequestException } from "@nestjs/common";
import { notificationsStub } from "../common/testing/notifications.stub";
import { SalesService } from "./sales.service";
import { SalesChannel } from "../generated/prisma/client";

/**
 * External-purchase pieces ("{lineCode}-{pieceNo}") have no BatchSareeRow and
 * no Saree row until their first sale. They used to fail at the counter with
 * "Saree … not found" even though scanning accepted them.
 */
describe("SalesService — selling an external-purchase piece", () => {
  let prisma: any;
  let service: SalesService;

  const line = { purchaseId: "EXT-1", quantity: 10, returnedQuantity: 0, returnedPieceNos: [], weight: "650g", color: "Red" };
  const sale = { sareeId: "SRIS-626-002-07", channel: SalesChannel.RETAIL, customerId: "c1", amount: 1000 };

  beforeEach(() => {
    prisma = {
      batchSareeRow: { findUnique: jest.fn().mockResolvedValue(null) },
      saree: { findUnique: jest.fn().mockResolvedValue(null), upsert: jest.fn() },
      purchaseSareeLine: { findFirst: jest.fn().mockResolvedValue(line) },
      saleRecord: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        findUnique: jest.fn().mockResolvedValue({ saleRef: "RETAIL-Vamsi-001" }),
      },
      returnRecord: { findFirst: jest.fn().mockResolvedValue(null) },
      inventoryRecord: { upsert: jest.fn() },
      customer: { findUnique: jest.fn().mockResolvedValue({ id: "c1", name: "Vamsi", type: "RETAIL", phone: null, code: null }) },
      firm: { findFirst: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    const idGenerator = { nextScoped: jest.fn().mockResolvedValue("RETAIL-Vamsi-001") };
    service = new SalesService(prisma, idGenerator as any, { recordAction: jest.fn() } as any, notificationsStub());
    jest.spyOn(service as any, "sendSaleNotification").mockResolvedValue(undefined);
  });

  it("records the sale and takes the piece out of stock in one transaction", async () => {
    await service.createSale(sale);

    expect(prisma.purchaseSareeLine.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { code: "SRIS-626-002" } }));
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.saree.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ id: "SRIS-626-002-07", origin: "EXTERNAL", purchaseId: "EXT-1", weightG: 650, status: "RETAIL" }),
    }));
    expect(prisma.saleRecord.create).toHaveBeenCalledWith({ data: expect.objectContaining({ sareeId: "SRIS-626-002-07", amount: 1000 }) });
    expect(prisma.inventoryRecord.upsert).toHaveBeenCalledWith(expect.objectContaining({ update: { status: "SOLD" } }));
  });

  it("refuses a piece that is already sold", async () => {
    prisma.saleRecord.findFirst.mockResolvedValue({ date: new Date("2026-09-01") });
    await expect(service.createSale(sale)).rejects.toThrow("already been sold");
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("refuses a piece sent back to the supplier", async () => {
    prisma.purchaseSareeLine.findFirst.mockResolvedValue({ ...line, returnedQuantity: 1, returnedPieceNos: [7] });
    await expect(service.createSale(sale)).rejects.toThrow(BadRequestException);
  });

  it("still says not found for an id that is no piece of any purchase", async () => {
    prisma.purchaseSareeLine.findFirst.mockResolvedValue(null);
    await expect(service.createSale(sale)).rejects.toThrow("not found");
  });
});
