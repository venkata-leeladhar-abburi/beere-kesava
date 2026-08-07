import { SetMetadata } from "@nestjs/common";

export const REQUIRE_PERMISSIONS_KEY = "requiredPermissions";

/**
 * Declares the permission key(s) needed to call a route handler. All listed
 * keys are required (AND).
 *
 * SUPERADMIN and ADMIN roles always pass, regardless of the keys listed here
 * (see PermissionsGuard). Every other role is checked against real data: a
 * per-user UserPermissionOverride wins if present, otherwise the user's role
 * must have a RolePermission row for the key (seeded by prisma/seed.ts).
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(REQUIRE_PERMISSIONS_KEY, permissions);
