import { SetMetadata } from "@nestjs/common";

export const REQUIRE_PERMISSIONS_KEY = "requiredPermissions";

/**
 * Declares the permission key(s) needed to call a route handler.
 * SUPERADMIN and ADMIN roles always pass, regardless of the keys listed here
 * (see PermissionsGuard) — this is a pragmatic role-based check, not a full
 * evaluation of the Permission/RolePermission/UserPermissionOverride tables,
 * since those tables are not yet populated with real data.
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(REQUIRE_PERMISSIONS_KEY, permissions);
