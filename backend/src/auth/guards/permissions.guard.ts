import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { AppException, ForbiddenRoleError } from "../../common/errors";
import { Reflector } from "@nestjs/core";
import { UserRole } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { REQUIRE_PERMISSIONS_KEY } from "../decorators/require-permissions.decorator";
import { REQUIRE_ROLES_KEY } from "../decorators/require-roles.decorator";
import type { AuthenticatedUser } from "../strategies/jwt.strategy";

/**
 * Role-based + DB-backed permission check.
 *
 *   - SUPERADMIN and ADMIN roles bypass every check unconditionally (full
 *     access), regardless of what's in RolePermission/UserPermissionOverride.
 *   - @RequirePermissions("some.key") — for any other role, this now does a
 *     real lookup against the Permission/RolePermission/UserPermissionOverride
 *     tables (populated by prisma/seed.ts):
 *       1. A UserPermissionOverride row for this user + permission, if
 *          present, wins outright (granted: true → allow, granted: false →
 *          deny), regardless of the role default.
 *       2. Otherwise, the user's role must have a RolePermission row for
 *          every key listed on the route (all keys required, i.e. AND).
 *       3. If neither exists, the request is denied.
 *   - @RequireRoles(...) — unchanged: any other role is denied unless it
 *     appears in the listed roles. This is the simple whole-route/module
 *     scoping mechanism; it does not consult the permission tables at all.
 *
 * Routes with neither decorator are left open to any authenticated user
 * (enforced by the global JwtAuthGuard alone).
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      REQUIRE_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(REQUIRE_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const hasPermissionCheck = !!requiredPermissions && requiredPermissions.length > 0;
    const hasRoleCheck = !!requiredRoles && requiredRoles.length > 0;

    if (!hasPermissionCheck && !hasRoleCheck) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      throw new AppException(401, "AUTH_REQUIRED", "Authentication required.");
    }

    if (user.role === UserRole.SUPERADMIN || user.role === UserRole.ADMIN) {
      return true;
    }

    if (hasPermissionCheck) {
      const allowed = await this.hasAllPermissions(user, requiredPermissions);
      if (!allowed) {
        throw new ForbiddenRoleError(
          `You do not have permission to perform this action (requires: ${requiredPermissions.join(", ")}).`,
        );
      }
    }

    if (hasRoleCheck && !requiredRoles.includes(user.role)) {
      throw new ForbiddenRoleError(
        `Your role (${user.role}) is not permitted to perform this action.`,
      );
    }

    return true;
  }

  /**
   * A user must satisfy every listed permission key. For each key:
   *   - a per-user UserPermissionOverride, if present, decides it outright;
   *   - otherwise fall back to whether the user's role has a RolePermission
   *     row for that key.
   */
  private async hasAllPermissions(
    user: AuthenticatedUser,
    permissionKeys: string[],
  ): Promise<boolean> {
    const permissions = await this.prisma.permission.findMany({
      where: { key: { in: permissionKeys } },
      select: {
        id: true,
        key: true,
        rolePermissions: { where: { role: user.role }, select: { id: true } },
        userOverrides: { where: { userId: user.id ?? "" }, select: { granted: true } },
      },
    });

    if (permissions.length !== permissionKeys.length) {
      // A required key isn't even seeded in the Permission catalog — fail
      // closed rather than silently allowing.
      return false;
    }

    return permissions.every((permission) => {
      const override = permission.userOverrides[0];
      if (override) {
        return override.granted;
      }
      return permission.rolePermissions.length > 0;
    });
  }
}
