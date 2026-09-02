import { notificationMocks, type NotificationMocks } from "../common/testing/notifications.stub";
import { BadRequestException } from "@nestjs/common";
import { ShopReceiptsService } from "./shop-receipts.service";

/**
 * The rules that keep the shop's stock honest: a verdict per saree, a reason
 * for every discrepancy, and a consignment that stays open until nothing on it
 * is still outstanding.
 */
describe("ShopReceiptsService.create", () => {
  const dispatch = {
    id: "d1",
    type: "SHOP",
    challanNumber: "DC-2627-001",
    receiptStatus: "PENDING",
    sarees: [
      { sareeId: "S-1", receiptStatus: null },
      { sareeId: "S-2", receiptStatus: null },
    ],
  };

  let prisma: any;
  let tx: any;
  let notifications: NotificationMocks;
  let service: ShopReceiptsService;
  /** What DispatchSaree rows look like after the writes this test made. */
  let lines: Array<{ receiptStatus: string | null }>;

  beforeEach(() => {
    lines = [{ receiptStatus: null }, { receiptStatus: null }];
    tx = {
      shopReceipt: { create: jest.fn().mockResolvedValue({ id: "r1", code: "SGR-2627-001" }) },
      dispatchSaree: {
        update: jest.fn(),
        findMany: jest.fn().mockImplementation(() => Promise.resolve(lines)),
      },
      inventoryRecord: { updateMany: jest.fn() },
      dispatchRecord: { update: jest.fn() },
    };
    prisma = {
      dispatchRecord: { findUnique: jest.fn().mockResolvedValue(dispatch) },
      user: { findUnique: jest.fn().mockResolvedValue({ id: "u1" }) },
      shopReceipt: {
        findUnique: jest.fn().mockResolvedValue({ id: "r1", code: "SGR-2627-001" }),
      },
      $transaction: jest.fn((fn: (t: unknown) => unknown) => fn(tx)),
    };
    notifications = notificationMocks();
    service = new ShopReceiptsService(
      prisma,
      { recordAction: jest.fn() } as any,
      { nextScoped: jest.fn().mockResolvedValue("SGR-2627-001") } as any,
      notifications as unknown as ConstructorParameters<typeof ShopReceiptsService>[3],
    );
  });

  it("leaves a consignment PARTIALLY_RECEIVED while a saree is still outstanding", async () => {
    lines = [{ receiptStatus: "RECEIVED" }, { receiptStatus: null }];

    await service.create({ dispatchId: "d1", items: [{ sareeId: "S-1", status: "RECEIVED" }] });

    expect(tx.dispatchRecord.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { receiptStatus: "PARTIALLY_RECEIVED" } }),
    );
  });

  it("closes the consignment once every saree has a verdict", async () => {
    lines = [{ receiptStatus: "RECEIVED" }, { receiptStatus: "DAMAGED" }];

    await service.create({
      dispatchId: "d1",
      items: [
        { sareeId: "S-1", status: "RECEIVED" },
        { sareeId: "S-2", status: "DAMAGED", remarks: "Torn pallu" },
      ],
    });

    expect(tx.dispatchRecord.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { receiptStatus: "RECEIVED" } }),
    );
    // A damaged piece is physically here but must not be sold before someone
    // has looked at it.
    expect(tx.inventoryRecord.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "DAMAGED_REVIEW_NEEDED" } }),
    );
  });

  it("rejects a discrepancy with no reason", async () => {
    await expect(
      service.create({ dispatchId: "d1", items: [{ sareeId: "S-1", status: "MISSING" }] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects a saree that is not on the consignment", async () => {
    await expect(
      service.create({ dispatchId: "d1", items: [{ sareeId: "S-9", status: "RECEIVED" }] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("pushes a shortage to the admins", async () => {
    lines = [{ receiptStatus: "RECEIVED" }, { receiptStatus: "MISSING" }];

    await service.create({
      dispatchId: "d1",
      items: [
        { sareeId: "S-1", status: "RECEIVED" },
        { sareeId: "S-2", status: "MISSING", remarks: "Not in the bundle" },
      ],
    });

    expect(notifications.notifyRole).toHaveBeenCalledWith(
      "ADMIN",
      "SHOP_RECEIPT_DISCREPANCY_ALERT",
      expect.objectContaining({ damaged: 0, missing: 1 }),
    );
    // Once, not once per owner role. Superadmins already receive an
    // ADMIN-targeted notification on both paths (the gateway joins them to
    // every role room, and their REST feed is unscoped), so a second row
    // would be a duplicate that both roles see twice.
    expect(notifications.notifyRole).toHaveBeenCalledTimes(1);
  });

  it("refuses a consignment that has already been fully received", async () => {
    prisma.dispatchRecord.findUnique.mockResolvedValue({ ...dispatch, receiptStatus: "RECEIVED" });

    await expect(
      service.create({ dispatchId: "d1", items: [{ sareeId: "S-1", status: "RECEIVED" }] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
