import { NotFoundException } from "@nestjs/common";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import { NotificationTargetType, UserRole } from "../generated/prisma/client";
import { NotificationsService } from "./notifications.service";

/**
 * markRead() used to look a notification up by id alone, which let any
 * authenticated user mark any other user's notification read by guessing an
 * id. These tests pin the ownership scope that replaced it.
 */
describe("NotificationsService.markRead", () => {
  let prisma: {
    notification: {
      findFirst: jest.Mock;
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
        findFirst: jest.fn().mockResolvedValue({ id: "n1" }),
        update: jest.fn().mockResolvedValue({ id: "n1", readAt: new Date() }),
      },
    };
    service = new NotificationsService(prisma as never, { } as never);
  });

  /** The OR branches the service asked Prisma to match on. */
  const whereOr = () =>
    prisma.notification.findFirst.mock.calls[0][0].where.OR as Array<Record<string, unknown>>;

  it("scopes the lookup to the caller's own id and role", async () => {
    await service.markRead("n1", asUser());

    const where = prisma.notification.findFirst.mock.calls[0][0].where;
    expect(where.id).toBe("n1");
    expect(whereOr()).toEqual(
      expect.arrayContaining([
        { targetType: NotificationTargetType.ROLE, role: UserRole.SHOP },
        { targetType: NotificationTargetType.USER, userId: "user-1" },
      ]),
    );
  });

  it("omits the per-user branch when the session carries no user id", async () => {
    // `userId: undefined` would make Prisma drop the condition and match every
    // USER-targeted notification, re-opening the hole this scope closed.
    await service.markRead("n1", asUser({ id: undefined }));

    expect(whereOr()).toEqual([
      { targetType: NotificationTargetType.ROLE, role: UserRole.SHOP },
    ]);
    expect(JSON.stringify(whereOr())).not.toContain("userId");
  });

  it("reports a notification addressed to someone else as not found", async () => {
    // The scoped query simply returns nothing; the caller must not be able to
    // tell "exists but not yours" apart from "does not exist".
    prisma.notification.findFirst.mockResolvedValue(null);

    await expect(service.markRead("someone-elses", asUser())).rejects.toThrow(NotFoundException);
    expect(prisma.notification.update).not.toHaveBeenCalled();
  });

  it("marks an owned notification read", async () => {
    await service.markRead("n1", asUser());

    expect(prisma.notification.update).toHaveBeenCalledWith({
      where: { id: "n1" },
      data: { readAt: expect.any(Date) },
    });
  });
});
