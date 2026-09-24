import { notificationMocks, type NotificationMocks, type NotificationsStub } from "../common/testing/notifications.stub";
import { SalesService } from "./sales.service";
import { SalesChannel } from "../generated/prisma/client";

/**
 * The shop records a basket one saree per request. Sarees sharing a billId
 * must build up one admin notification, not one each.
 */
describe("SalesService — one notification per counter bill", () => {
  let prisma: any;
  let notifications: NotificationMocks & { notifyRoleGrouped: jest.Mock };
  let service: SalesService;
  // What notifyRoleGrouped has stored so far, as the real service would.
  let stored: Record<string, unknown> | null;

  const customer = { name: "Chetan", phone: "7793960939" };
  const sale = (sareeId: string, amount: number, extra: Record<string, unknown> = {}) => ({
    sareeId, channel: SalesChannel.RETAIL, customerId: "c1", amount, paymentMethod: "cash", ...extra,
  });
  const notify = (saleRef: string, dto: ReturnType<typeof sale>) =>
    (service as any).notifySaleRecorded(saleRef, dto, customer) as Promise<void>;

  beforeEach(() => {
    stored = null;
    prisma = {
      batchSareeRow: {
        findMany: jest.fn().mockImplementation(({ where }) =>
          Promise.resolve(where.sareeId.in.map((id: string) => ({
            sareeId: id,
            weaver: { name: "Ramoji Rao" },
            factoryLoom: null,
            sareeType: { code: "KJ-001", type: "KANJIVARAM", retailPrice: 1500 },
            sareeTypeCode: "KJ-001",
            receivedSellingPrice: null,
          })))),
      },
      user: { findUnique: jest.fn() },
    };
    notifications = {
      ...notificationMocks(),
      notifyRoleGrouped: jest.fn().mockImplementation((_role, _type, _key, merge) => {
        stored = merge(stored);
        return Promise.resolve(null);
      }),
    };
    service = new SalesService(prisma, {} as any, {} as any, notifications as unknown as NotificationsStub);
  });

  it("adds each saree on the bill to one notification and totals it", async () => {
    await notify("RETAIL-Chetan-001-001", sale("RAMOJI-L1-B001-008", 1350, { billId: "b1", originalPrice: 1500, discountNote: "10%" }));
    await notify("RETAIL-Chetan-001-002", sale("RAMOJI-L1-B001-009", 1500, { billId: "b1", originalPrice: 1500 }));

    expect(notifications.notifyRoleGrouped).toHaveBeenCalledTimes(2);
    expect(notifications.notifyRoleGrouped).toHaveBeenCalledWith("ADMIN", "RETAIL_BILL_RECORDED", "b1", expect.any(Function));
    expect(notifications.notifyRole).not.toHaveBeenCalled();
    expect(stored).toMatchObject({
      billRef: "RETAIL-Chetan-001-001",
      customerName: "Chetan",
      sareeCount: 2,
      retailTotal: 3000,
      discount: 150,
      total: 2850,
      lines: [
        { sareeId: "RAMOJI-L1-B001-008", discount: 150, discountNote: "10%", amount: 1350,
          sareeType: "KJ-001 · KANJIVARAM", source: { kind: "weaver", name: "Ramoji Rao", detail: "Loom 1" } },
        { sareeId: "RAMOJI-L1-B001-009", discount: 0, amount: 1500 },
      ],
    });
  });

  it("never lists the same sale twice if it is reported again", async () => {
    const dto = sale("RAMOJI-L1-B001-008", 1500, { billId: "b1" });
    await notify("RETAIL-Chetan-001-001", dto);
    await notify("RETAIL-Chetan-001-001", dto);

    expect(stored).toMatchObject({ sareeCount: 1, total: 1500 });
  });

  it("keeps a sale made without a bill as its own notification", async () => {
    await notify("RETAIL-Chetan-001-001", sale("RAMOJI-L1-B001-008", 1500));

    expect(notifications.notifyRoleGrouped).not.toHaveBeenCalled();
    expect(notifications.notifyRole).toHaveBeenCalledWith("ADMIN", "RETAIL_SALE_RECORDED", expect.objectContaining({ amount: 1500 }));
  });
});
