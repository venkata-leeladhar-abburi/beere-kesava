import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "../../generated/prisma/client";
import { PermissionsGuard } from "./permissions.guard";
import type { AuthenticatedUser } from "../strategies/jwt.strategy";

describe("PermissionsGuard", () => {
  let reflector: Reflector;
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
    guard = new PermissionsGuard(reflector);
  });

  it("allows any authenticated user through when no @RequirePermissions/@RequireRoles metadata is present", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(undefined);

    expect(guard.canActivate(buildContext(user(UserRole.WORKER)))).toBe(true);
  });

  it("throws ForbiddenException when a guarded route is hit with no user on the request", () => {
    jest
      .spyOn(reflector, "getAllAndOverride")
      .mockReturnValueOnce(["some.permission"]) // requiredPermissions
      .mockReturnValueOnce(undefined); // requiredRoles

    expect(() => guard.canActivate(buildContext(undefined))).toThrow(ForbiddenException);
  });

  it("lets SUPERADMIN bypass a @RequirePermissions check", () => {
    jest
      .spyOn(reflector, "getAllAndOverride")
      .mockReturnValueOnce(["some.permission"])
      .mockReturnValueOnce(undefined);

    expect(guard.canActivate(buildContext(user(UserRole.SUPERADMIN)))).toBe(true);
  });

  it("lets ADMIN bypass a @RequireRoles check even when ADMIN isn't in the listed roles", () => {
    jest
      .spyOn(reflector, "getAllAndOverride")
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce([UserRole.WEAVER]);

    expect(guard.canActivate(buildContext(user(UserRole.ADMIN)))).toBe(true);
  });

  it("denies any non-admin role outright when @RequirePermissions is set (no granular check exists)", () => {
    jest
      .spyOn(reflector, "getAllAndOverride")
      .mockReturnValueOnce(["inventory.write"])
      .mockReturnValueOnce(undefined);

    expect(() => guard.canActivate(buildContext(user(UserRole.WORKER)))).toThrow(
      ForbiddenException,
    );
  });

  it("denies a role not present in @RequireRoles", () => {
    jest
      .spyOn(reflector, "getAllAndOverride")
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce([UserRole.WEAVER]);

    expect(() => guard.canActivate(buildContext(user(UserRole.WORKER)))).toThrow(
      ForbiddenException,
    );
  });

  it("allows a role that is present in @RequireRoles", () => {
    jest
      .spyOn(reflector, "getAllAndOverride")
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce([UserRole.WEAVER, UserRole.WORKER]);

    expect(guard.canActivate(buildContext(user(UserRole.WEAVER)))).toBe(true);
  });
});
