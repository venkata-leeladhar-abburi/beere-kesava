import { BadRequestException } from "@nestjs/common";
import { notificationsStub } from "../common/testing/notifications.stub";
import { SalesService } from "./sales.service";
import { SalesChannel } from "../generated/prisma/client";
import { CreateSaleDto } from "./dto/create-sale.dto";
import { passthroughSareeCodes } from "../saree-codes/testing";

/**
 * Confirming the same counter bill twice. The till writes one sale per saree,
 * so a connection that drops mid-bill (the shop switching Wi-Fi to mobile
 * data) can lose the answer to a request the server already committed — and
 * the till then sends that saree again. The resend has to come back as the
 * sale already written, or the piece reads as "already sold" and falls off a
 * bill it has in fact been charged on.
 */
describe("SalesService — confirming the same bill again", () => {
  let prisma: any;
  let service: SalesService;
  const BILL = "7b0f3c1e-2f5a-4d1b-9a53-1b9f3f0d7c11";

  const sale = (extra: Partial<CreateSaleDto> = {}): CreateSaleDto => ({
    sareeId: "RAMOJI-L1-B001-008",
    channel: SalesChannel.RETAIL,
    customerId: "c1",
    amount: 1000,
    paymentMethod: "cash",
    billId: BILL,
    ...extra,
  });

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
      returnRecord: { findFirst: jest.fn().mockResolvedValue(null) },
      inventoryRecord: { findUnique: jest.fn().mockResolvedValue(null), upsert: jest.fn() },
      customer: { findUnique: jest.fn().mockResolvedValue({ id: "c1", name: "Chetan", type: "RETAIL", phone: null, code: null }) },
      firm: { findFirst: jest.fn().mockResolvedValue(null) },
      saree: { upsert: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
      user: { findUnique: jest.fn() },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    const idGenerator = { nextScoped: jest.fn().mockResolvedValue("RETAIL-Chetan-001") };
    service = new SalesService(prisma, idGenerator as any, { recordAction: jest.fn() } as any, notificationsStub(), passthroughSareeCodes);
    jest.spyOn(service as any, "sendSaleNotification").mockResolvedValue(undefined);
  });

  it("returns the sale already written for a saree resent on the same bill", async () => {
    prisma.saleRecord.findFirst.mockImplementation(({ where }: any) =>
      Promise.resolve(where.billId === BILL ? { saleRef: "RETAIL-Chetan-001" } : null),
    );

    const resent = await service.createSale(sale());

    expect(resent).toEqual({ saleRef: "RETAIL-Chetan-001" });
    // Nothing written a second time: no duplicate SaleRecord, no second
    // sale ref spent on the same piece.
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.saleRecord.create).not.toHaveBeenCalled();
  });

  it("records the saree normally when this bill has not charged it yet", async () => {
    await service.createSale(sale());

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it("still refuses a saree sold on a different bill", async () => {
    prisma.saleRecord.findFirst.mockImplementation(({ where }: any) =>
      Promise.resolve(where.billId ? null : { saleRef: "RETAIL-Earlier-001", date: new Date() }),
    );

    await expect(service.createSale(sale())).rejects.toThrow(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
