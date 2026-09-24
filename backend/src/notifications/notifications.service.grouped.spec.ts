import { NotificationTargetType, UserRole } from "../generated/prisma/client";
import { NotificationsService } from "./notifications.service";

/**
 * A counter bill is recorded one saree per request but must reach the admin
 * feed as one notification — the first call creates it, later calls with the
 * same group key update that same row.
 */
describe("NotificationsService.notifyRoleGrouped", () => {
  let prisma: { notification: { findFirst: jest.Mock; create: jest.Mock; update: jest.Mock } };
  let gateway: { emitToRole: jest.Mock; emitToUser: jest.Mock };
  let service: NotificationsService;

  beforeEach(() => {
    prisma = {
      notification: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ id: "n1", targetType: NotificationTargetType.ROLE, ...data })),
        update: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ id: "n1", targetType: NotificationTargetType.ROLE, role: UserRole.ADMIN, ...data })),
      },
    };
    gateway = { emitToRole: jest.fn(), emitToUser: jest.fn() };
    service = new NotificationsService(prisma as never, gateway as never);
  });

  it("creates the notification on the first call, tagged with its group key", async () => {
    await service.notifyRoleGrouped(UserRole.ADMIN, "RETAIL_BILL_RECORDED", "bill-1", () => ({ sareeCount: 1 }));

    expect(prisma.notification.findFirst).toHaveBeenCalledWith({
      where: expect.objectContaining({ role: UserRole.ADMIN, type: "RETAIL_BILL_RECORDED", payload: { path: ["groupKey"], equals: "bill-1" } }),
    });
    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ payload: { sareeCount: 1, groupKey: "bill-1" } }),
    });
    expect(prisma.notification.update).not.toHaveBeenCalled();
  });

  it("merges later calls into the same row, unread again, and re-broadcasts it", async () => {
    prisma.notification.findFirst.mockResolvedValue({
      id: "n1", readAt: new Date(), payload: { sareeCount: 1, groupKey: "bill-1" },
    });
    const merge = jest.fn((prev: Record<string, unknown> | null) => ({ sareeCount: Number(prev?.sareeCount) + 1 }));

    await service.notifyRoleGrouped(UserRole.ADMIN, "RETAIL_BILL_RECORDED", "bill-1", merge);

    expect(merge).toHaveBeenCalledWith({ sareeCount: 1, groupKey: "bill-1" });
    expect(prisma.notification.create).not.toHaveBeenCalled();
    expect(prisma.notification.update).toHaveBeenCalledWith({
      where: { id: "n1" },
      data: { payload: { sareeCount: 2, groupKey: "bill-1" }, readAt: null },
    });
    expect(gateway.emitToRole).toHaveBeenCalledWith(UserRole.ADMIN, expect.objectContaining({ id: "n1" }));
  });
});
