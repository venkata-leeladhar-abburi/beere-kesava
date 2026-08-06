import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "../../generated/prisma/client";
import { REQUIRE_PERMISSIONS_KEY } from "../decorators/require-permissions.decorator";
import { REQUIRE_ROLES_KEY } from "../decorators/require-roles.decorator";
import type { AuthenticatedUser } from "../strategies/jwt.strategy";

/**
 * Pragmatic role-based permission check.
 *
 * The Permission/RolePermission/UserPermissionOverride tables in the schema
 * are designed for a fully granular RBAC system, but they are not populated
 * with real data yet. Rather than build out an unused evaluation path, this
 * guard applies the rule requested by the business:
 *   - SUPERADMIN and ADMIN roles bypass every check (full access).
 *   - @RequirePermissions(...) — any other role is denied outright (no
 *     RolePermission-backed check exists yet for these keys).
 *   - @RequireRoles(...) — any other role is denied unless it appears in the
 *     listed roles. This is the module-scoping mechanism: apply at the
 *     @Controller() class level when a whole module belongs to one access
 *     tier, or per-method when a module mixes tiers.
 *
 * Routes with neither decorator are left open to any authenticated user
 * (enforced by the global JwtAuthGuard alone).
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
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
      throw new ForbiddenException("Authentication required.");
    }

    if (user.role === UserRole.SUPERADMIN || user.role === UserRole.ADMIN) {
      return true;
    }

    if (hasPermissionCheck) {
      throw new ForbiddenException(
        `You do not have permission to perform this action (requires: ${requiredPermissions.join(", ")}).`,
      );
    }

    if (hasRoleCheck && !requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        `Your role (${user.role}) is not permitted to perform this action.`,
      );
    }

    return true;
  }
}
