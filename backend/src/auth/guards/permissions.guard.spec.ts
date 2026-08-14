import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "../../generated/prisma/client";
import { PermissionsGuard } from "./permissions.guard";
import type { AuthenticatedUser } from "../strategies/jwt.strategy";

describe("PermissionsGuard", () => {
  let reflector: Reflector;
  let prisma: any;
  let guard: PermissionsGuard;

  const buildContext = (user?: AuthenticatedUser): ExecutionContext =>
    ({
      getHandler: () => ({}) as any,
      getClass: () => ({}) as any,
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  const user = (role: UserRole): AuthenticatedUser => ({
    id: "u1",
    mobile: "9999999999",
    role,
    name: "Test User",
  });

  beforeEach(() => {
    reflector = new Reflector();
    prisma = { permission: { findMany: jest.fn() } };
    guard = new PermissionsGuard(reflector, prisma);
  });

  it("allows any authenticated user through when no @RequirePermissions/@RequireRoles metadata is present", async () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(undefined);

    await expect(guard.canActivate(buildContext(user(UserRole.WORKER)))).resolves.toBe(true);
  });

  it("throws ForbiddenException when a guarded route is hit with no user on the request", async () => {
    jest
      .spyOn(reflector, "getAllAndOverride")
      .mockReturnValueOnce(["some.permission"]) // requiredPermissions
      .mockReturnValueOnce(undefined); // requiredRoles

    await expect(guard.canActivate(buildContext(undefined))).rejects.toThrow(ForbiddenException);
  });

  it("lets SUPERADMIN bypass a @RequirePermissions check", async () => {
    jest
      .spyOn(reflector, "getAllAndOverride")
      .mockReturnValueOnce(["some.permission"])
      .mockReturnValueOnce(undefined);

    await expect(
      guard.canActivate(buildContext(user(UserRole.SUPERADMIN))),
    ).resolves.toBe(true);
  });

  it("lets ADMIN bypass a @RequireRoles check even when ADMIN isn't in the listed roles", async () => {
    jest
      .spyOn(reflector, "getAllAndOverride")
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce([UserRole.WEAVER]);

    await expect(guard.canActivate(buildContext(user(UserRole.ADMIN)))).resolves.toBe(true);
  });

  it("denies when @RequirePermissions is set and the role has no matching RolePermission or override", async () => {
    jest
      .spyOn(reflector, "getAllAndOverride")
      .mockReturnValueOnce(["inventory.write"])
      .mockReturnValueOnce(undefined);
    prisma.permission.findMany.mockResolvedValue([
      { id: "p1", key: "inventory.write", rolePermissions: [], userOverrides: [] },
    ]);

    await expect(guard.canActivate(buildContext(user(UserRole.WORKER)))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it("allows when the role has a matching RolePermission row for every required key", async () => {
    jest
      .spyOn(reflector, "getAllAndOverride")
      .mockReturnValueOnce(["inventory.write"])
      .mockReturnValueOnce(undefined);
    prisma.permission.findMany.mockResolvedValue([
      { id: "p1", key: "inventory.write", rolePermissions: [{ id: "rp1" }], userOverrides: [] },
    ]);

    await expect(guard.canActivate(buildContext(user(UserRole.WORKER)))).resolves.toBe(true);
  });

  it("a per-user override wins over the role default in both directions", async () => {
    jest
      .spyOn(reflector, "getAllAndOverride")
      .mockReturnValueOnce(["inventory.write"])
      .mockReturnValueOnce(undefined);
    prisma.permission.findMany.mockResolvedValue([
      {
        id: "p1",
        key: "inventory.write",
        rolePermissions: [{ id: "rp1" }], // role default: allowed
        userOverrides: [{ granted: false }], // but this user is explicitly denied
      },
    ]);

    await expect(guard.canActivate(buildContext(user(UserRole.WORKER)))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it("denies a role not present in @RequireRoles", async () => {
    jest
      .spyOn(reflector, "getAllAndOverride")
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce([UserRole.WEAVER]);

    await expect(guard.canActivate(buildContext(user(UserRole.WORKER)))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it("allows a role that is present in @RequireRoles", async () => {
    jest
      .spyOn(reflector, "getAllAndOverride")
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce([UserRole.WEAVER, UserRole.WORKER]);

    await expect(guard.canActivate(buildContext(user(UserRole.WEAVER)))).resolves.toBe(true);
  });
});
