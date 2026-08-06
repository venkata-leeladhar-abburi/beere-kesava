import { UserRole } from "../generated/prisma/client";
import { AuditLogService } from "./audit-log.service";

describe("AuditLogService.recordAction", () => {
  let prisma: any;
  let service: AuditLogService;

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn() },
      actionLog: { create: jest.fn().mockResolvedValue({ id: "log-1" }) },
    };
    service = new AuditLogService(prisma);
  });

  it("resolves actorId to a real user and writes their id + role", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "u1", role: UserRole.WORKER });

    await service.recordAction({
      actorId: "u1",
      module: "WEAVERS",
      action: "Added weaver Test",
      entityType: "Weaver",
      entityId: "w1",
      recordLabel: "Test",
    });

    expect(prisma.actionLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "u1",
        role: UserRole.WORKER,
        module: "WEAVERS",
        action: "Added weaver Test",
        entityType: "Weaver",
        entityId: "w1",
        recordLabel: "Test",
      }),
    });
  });

  it("writes with userId left null and a placeholder ADMIN role when no actorId is supplied", async () => {
    await service.recordAction({ module: "WEAVERS", action: "Did something" });

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.actionLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: undefined, role: UserRole.ADMIN }),
    });
  });

  it("writes with userId left null when actorId does not resolve to any user", async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await service.recordAction({ actorId: "nonexistent", module: "WEAVERS", action: "x" });

    expect(prisma.actionLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: undefined, role: UserRole.ADMIN }),
    });
  });

  it("coalesces null oldValue/newValue to undefined so Prisma treats them as 'not set'", async () => {
    await service.recordAction({
      module: "WEAVERS",
      action: "x",
      oldValue: null,
      newValue: null,
    });

    expect(prisma.actionLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ oldValue: undefined, newValue: undefined }),
    });
  });
});
