import { NotificationTargetType, UserRole } from "../generated/prisma/client";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import { ListNotificationsQueryDto } from "./dto/list-notifications-query.dto";
import { NotificationsService } from "./notifications.service";

/**
 * findAll/markRead used to trust the caller's query/id unscoped, which let
 * any authenticated user read or mark-read another user's or role's
 * notifications. These tests pin the ownership scope that replaced it.
 */
describe("NotificationsService", () => {
  let prisma: {
    notification: {
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };
  let service: NotificationsService;

  const asUser = (overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser => ({
    id: "user-1",
    mobile: "9999999999",
    role: UserRole.SHOP,
    name: "Shop Staff",
    ...overrides,
  });

  beforeEach(() => {
    prisma = {
      notification: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn().mockResolvedValue({ id: "n1", userId: "user-1", role: UserRole.SHOP }),
        update: jest.fn().mockResolvedValue({ id: "n1", readAt: new Date() }),
      },
    };
    service = new NotificationsService(prisma as never, {} as never);
  });

  describe("findAll", () => {
    const baseQuery: ListNotificationsQueryDto = { page: 1, pageSize: 20, unreadOnly: false };

    it("scopes a non-admin to their own id and role, ignoring the query's userId/role", async () => {
      await service.findAll({ ...baseQuery, userId: "someone-else", role: UserRole.ADMIN }, asUser());

      const where = prisma.notification.findMany.mock.calls[0][0].where;
      expect(where.OR).toEqual(
        expect.arrayContaining([{ userId: "user-1" }, { role: UserRole.SHOP }]),
      );
    });

    it("omits the per-user branch when the session carries no user id", async () => {
      await service.findAll(baseQuery, asUser({ id: undefined }));

      const where = prisma.notification.findMany.mock.calls[0][0].where;
      expect(where.OR).toEqual([{ role: UserRole.SHOP }]);
    });

    it("lets an admin filter by any userId/role from the query", async () => {
      await service.findAll(
        { ...baseQuery, userId: "someone-else", role: UserRole.WEAVER },
        asUser({ role: UserRole.ADMIN }),
      );

      const where = prisma.notification.findMany.mock.calls[0][0].where;
      expect(where).toMatchObject({ userId: "someone-else", role: UserRole.WEAVER });
    });
  });

  describe("markRead", () => {
    it("marks an owned notification (matching userId) read", async () => {
      await service.markRead("n1", asUser());

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: "n1" },
        data: { readAt: expect.any(Date) },
      });
    });

    it("marks a role-targeted notification addressed to the caller's role read", async () => {
      prisma.notification.findUnique.mockResolvedValue({
        id: "n2",
        userId: null,
        role: UserRole.SHOP,
        targetType: NotificationTargetType.ROLE,
      });

      await service.markRead("n2", asUser());

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: "n2" },
        data: { readAt: expect.any(Date) },
      });
    });

    it("throws NOT_FOUND when the notification does not exist", async () => {
      prisma.notification.findUnique.mockResolvedValue(null);

      await expect(service.markRead("missing", asUser())).rejects.toMatchObject({ code: "NOT_FOUND" });
      expect(prisma.notification.update).not.toHaveBeenCalled();
    });

    it("throws FORBIDDEN_SCOPE for a notification addressed to someone else", async () => {
      prisma.notification.findUnique.mockResolvedValue({
        id: "n1",
        userId: "someone-else",
        role: UserRole.WEAVER,
      });

      await expect(service.markRead("n1", asUser())).rejects.toMatchObject({ code: "FORBIDDEN_SCOPE" });
      expect(prisma.notification.update).not.toHaveBeenCalled();
    });

    it("lets an admin mark any notification read regardless of ownership", async () => {
      prisma.notification.findUnique.mockResolvedValue({
        id: "n1",
        userId: "someone-else",
        role: UserRole.WEAVER,
      });

      await service.markRead("n1", asUser({ role: UserRole.ADMIN }));

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: "n1" },
        data: { readAt: expect.any(Date) },
      });
    });
  });
});
