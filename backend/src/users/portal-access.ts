import { AccessLevel, UserRole } from "../generated/prisma/client";

/** A `UserPortalAccess` row, narrowed to what resolution actually needs. */
export interface PortalAccessRow {
  role: UserRole;
  accessLevel: AccessLevel;
}

export interface UserWithPortalAccess {
  role: UserRole;
  accessLevel: AccessLevel;
  portalAccess?: PortalAccessRow[] | null;
}

/**
 * The access level that applies while this person is in `active`.
 *
 * Somebody who is an Accountant and a Shop Staff is not necessarily as trusted
 * in both — MONEY_HIDDEN and DOWNLOAD_RESTRICTED change what the UI renders
 * (see MoneyValue.tsx / DownloadAccess.tsx), so the level has to follow the
 * portal, not the person. Order: an explicit row for that portal, else the
 * primary role's own level, else unrestricted.
 *
 * Every session's token must carry the level for the portal it was issued
 * for — both at login and on POST /auth/switch-role.
 */
export function accessLevelFor(user: UserWithPortalAccess, active: UserRole): AccessLevel {
  const explicit = user.portalAccess?.find((p) => p.role === active);
  if (explicit) return explicit.accessLevel;
  if (active === user.role) return user.accessLevel;
  return AccessLevel.FULL_ACCESS;
}

/**
 * The level for every portal this person holds, primary first — what the
 * Manage Access screen renders and edits.
 */
export function accessLevelMap(
  user: UserWithPortalAccess & { additionalRoles?: UserRole[] | null },
): PortalAccessRow[] {
  const roles = [...new Set([user.role, ...(user.additionalRoles ?? [])])];
  return roles.map((role) => ({ role, accessLevel: accessLevelFor(user, role) }));
}
