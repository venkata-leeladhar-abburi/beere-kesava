import { SetMetadata } from "@nestjs/common";
import { UserRole } from "../../generated/prisma/client";

export const REQUIRE_ROLES_KEY = "requiredRoles";

/**
 * Declares which roles may call a route handler (or every handler in a
 * controller, when applied at the class level).
 *
 * SUPERADMIN and ADMIN always pass regardless of the roles listed here (see
 * PermissionsGuard) — this mirrors the existing @RequirePermissions
 * pragmatic-role-check pattern, just keyed by role instead of a permission
 * string. Routes without this decorator (and without @RequirePermissions)
 * remain open to any authenticated user, enforced by the global JwtAuthGuard
 * alone.
 */
export const RequireRoles = (...roles: UserRole[]) => SetMetadata(REQUIRE_ROLES_KEY, roles);

/**
 * Shorthand for a route/controller that should stay ADMIN/SUPERADMIN-only.
 * SUPERADMIN and ADMIN already bypass the role check in PermissionsGuard, so
 * this simply denies every other role.
 */
export const AdminOnly = () => RequireRoles(UserRole.ADMIN, UserRole.SUPERADMIN);
