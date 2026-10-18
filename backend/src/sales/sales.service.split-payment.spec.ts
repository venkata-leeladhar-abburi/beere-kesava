import { BadRequestException } from "@nestjs/common";
import { notificationsStub } from "../common/testing/notifications.stub";
import { SalesService } from "./sales.service";
import { SalesChannel } from "../generated/prisma/client";
import { CreateSaleDto } from "./dto/create-sale.dto";
import { passthroughSareeCodes } from "../saree-codes/testing";

/**
 * A counter bill paid with more than one method — part cash, part UPI. Each
 * saree carries its share of every method; the service checks the shares add
 * up, records the sale as "split" and writes one SalePayment row per method.
 */
describe("SalesService — split payment on a counter sale", () => {
  let prisma: any;
  let service: SalesService;

  const sale = (extra: Partial<CreateSaleDto> = {}): CreateSaleDto => ({
    sareeId: "RAMOJI-L1-B001-008",
    channel: SalesChannel.RETAIL,
    customerId: "c1",
    amount: 1600,
    ...extra,
  });

  const created = () => prisma.saleRecord.create.mock.calls[0][0].data;

  beforeEach(() => {
    prisma = {
      batchSareeRow: {
        findUnique: jest
          .fn()
          .mockResolvedValue({
            sareeId: "RAMOJI-L1-B001-008",
            qcPassed: true,
            batchId: "B001",
            weaverId: "w1",
          }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      dispatchSaree: { findMany: jest.fn().mockResolvedValue([]) },
      saleRecord: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        findUnique: jest.fn().mockResolvedValue({ saleRef: "RETAIL-Chetan-001" }),
      },
      inventoryRecord: { findUnique: jest.fn().mockResolvedValue(null), upsert: jest.fn() },
      customer: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: "c1", name: "Chetan", type: "RETAIL", phone: null, code: null }),
      },
      firm: { findFirst: jest.fn().mockResolvedValue(null) },
      saree: { upsert: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
      user: { findUnique: jest.fn() },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    const idGenerator = { nextScoped: jest.fn().mockResolvedValue("RETAIL-Chetan-001") };
    service = new SalesService(
      prisma,
      idGenerator as any,
      { recordAction: jest.fn() } as any,
      notificationsStub(),
      passthroughSareeCodes,
    );
    jest.spyOn(service as any, "sendSaleNotification").mockResolvedValue(undefined);
  });

  it("keeps a single-method sale exactly as before, with no payment rows", async () => {
    await service.createSale(sale({ paymentMethod: "upi", paymentRef: "TXN1" }));

    expect(created()).toMatchObject({ paymentMethod: "upi", paymentRef: "TXN1" });
    expect(created()).not.toHaveProperty("payments");
  });

  it("records a split as 'split' with one payment row per method", async () => {
    await service.createSale(
      sale({
        paymentMethod: "split",
        payments: [
          { method: "cash", amount: 600 },
          { method: "upi", amount: 1000, reference: "TXN9" },
        ],
      }),
    );

    expect(created()).toMatchObject({
      paymentMethod: "split",
      paymentRef: null,
      payments: {
        create: [
          { method: "cash", amount: 600, reference: null },
          { method: "upi", amount: 1000, reference: "TXN9" },
        ],
      },
    });
  });

  it("treats several legs as a split even when paymentMethod is left out", async () => {
    await service.createSale(
      sale({
        payments: [
          { method: "cash", amount: 100 },
          { method: "card", amount: 1500 },
        ],
      }),
    );

    expect(created().paymentMethod).toBe("split");
  });

  it("keeps a saree whose share of a split bill came from one method marked split", async () => {
    await service.createSale(
      sale({ paymentMethod: "split", payments: [{ method: "cash", amount: 1600 }] }),
    );

    expect(created()).toMatchObject({
      paymentMethod: "split",
      payments: { create: [{ method: "cash", amount: 1600, reference: null }] },
    });
  });

  it("reads one leg without 'split' as an ordinary single-method sale", async () => {
    await service.createSale(
      sale({ payments: [{ method: "upi", amount: 1600, reference: "TXN2" }] }),
    );

    expect(created()).toMatchObject({ paymentMethod: "upi", paymentRef: "TXN2" });
    expect(created()).not.toHaveProperty("payments");
  });

  it("matches the legs to the amount to the paisa, GST paise included", async () => {
    await expect(
      service.createSale(
        sale({
          amount: 1050.5,
          payments: [
            { method: "cash", amount: 500.25 },
            { method: "upi", amount: 550.25 },
          ],
        }),
      ),
    ).resolves.toBeDefined();
  });

  it("rejects legs that do not add up to the sale amount, before spending a sale ref", async () => {
    await expect(
      service.createSale(
        sale({
          payments: [
            { method: "cash", amount: 600 },
            { method: "upi", amount: 900 },
          ],
        }),
      ),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects the same method listed twice", async () => {
    await expect(
      service.createSale(
        sale({
          payments: [
            { method: "cash", amount: 800 },
            { method: "cash", amount: 800 },
          ],
        }),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it("rejects 'split' with no legs, and a single method that contradicts the legs", async () => {
    await expect(service.createSale(sale({ paymentMethod: "split" }))).rejects.toThrow(
      BadRequestException,
    );
    await expect(
      service.createSale(
        sale({
          paymentMethod: "cash",
          payments: [
            { method: "cash", amount: 600 },
            { method: "upi", amount: 1000 },
          ],
        }),
      ),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.createSale(
        sale({ paymentMethod: "cash", payments: [{ method: "upi", amount: 1600 }] }),
      ),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
