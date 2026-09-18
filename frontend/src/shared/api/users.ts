import { apiClient } from "./client";

// Backend enum values (backend/prisma/schema.prisma UserRole / AccessLevel).
export type BackendRole = "ADMIN" | "SUPERADMIN" | "WORKER" | "WEAVER" | "SHOP" | "ACCOUNTANT";
export type BackendAccessLevel =
  | "FULL_ACCESS"
  | "RESTRICTED"
  | "DOWNLOAD_RESTRICTED"
  | "MONEY_HIDDEN";
export type BackendStatus = "ACTIVE" | "INACTIVE";

/** One portal's access level — see backend UserPortalAccess. */
export interface BackendPortalAccess {
  role: BackendRole;
  accessLevel: BackendAccessLevel;
}

export interface BackendUser {
  id: string;
  empId: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email: string | null;
  role: BackendRole;
  additionalRoles?: BackendRole[];
  /** The PRIMARY role's level, and the fallback for a portal with no row. */
  accessLevel: BackendAccessLevel;
  /** Per-portal overrides. Resolve with portalAccessLevels(), not directly. */
  portalAccess?: BackendPortalAccess[];
  status: BackendStatus;
  dateAdded: string;
  updatedAt: string;
  linkedWeaverId: string | null;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Frontend role labels (see features/users/components/theme.ts ROLES) don't map
// 1:1 to backend roles — "Finishing Staff" has no backend User equivalent (it's
// its own FinishingStaff table/domain, handled entirely by FinishingStaffContext).
export const FRONTEND_TO_BACKEND_ROLE: Record<string, BackendRole> = {
  Admin: "ADMIN",
  "Worker Staff": "WORKER",
  Weaver: "WEAVER",
  "Shop Staff": "SHOP",
  Accountant: "ACCOUNTANT",
};

export const BACKEND_TO_FRONTEND_ROLE: Record<BackendRole, string> = {
  ADMIN: "Admin",
  SUPERADMIN: "Admin",
  WORKER: "Worker Staff",
  WEAVER: "Weaver",
  SHOP: "Shop Staff",
  ACCOUNTANT: "Accountant",
};

// One label per backend value. This used to collapse the three restricted
// levels into "Semi Access", which meant opening a MONEY_HIDDEN account and
// saving it silently downgraded them to RESTRICTED — the money came back.
const ACCESS_LEVEL_LABELS: Record<BackendAccessLevel, FrontendAccessLevel> = {
  FULL_ACCESS: "Full Access",
  RESTRICTED: "Semi Access",
  DOWNLOAD_RESTRICTED: "No Downloads",
  MONEY_HIDDEN: "Money Hidden",
};

export type FrontendAccessLevel = "Full Access" | "Semi Access" | "No Downloads" | "Money Hidden";

export function backendAccessLevelToFrontend(level: BackendAccessLevel): FrontendAccessLevel {
  return ACCESS_LEVEL_LABELS[level] ?? "Full Access";
}

export function frontendAccessLevelToBackend(level: FrontendAccessLevel): BackendAccessLevel {
  const found = (Object.entries(ACCESS_LEVEL_LABELS) as [BackendAccessLevel, FrontendAccessLevel][])
    .find(([, label]) => label === level);
  return found ? found[0] : "FULL_ACCESS";
}

/**
 * The access level for each portal this person holds, primary first — mirrors
 * the backend's accessLevelMap(). An extra portal with no row of its own is
 * unrestricted; it does NOT inherit the primary role's level.
 */
export function portalAccessLevels(user: BackendUser): BackendPortalAccess[] {
  const roles = [...new Set([user.role, ...(user.additionalRoles ?? [])])];
  return roles.map(role => {
    const explicit = user.portalAccess?.find(p => p.role === role);
    if (explicit) return explicit;
    return { role, accessLevel: role === user.role ? user.accessLevel : ("FULL_ACCESS" as const) };
  });
}

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  mobile: string;
  email?: string;
  role: BackendRole;
  /** Extra portals the person can switch into (never WEAVER/SUPERADMIN). */
  additionalRoles?: BackendRole[];
  accessLevel?: BackendAccessLevel;
  // Only used when role is WEAVER — populates the linked Weaver record.
  photoUrl?: string;
  village?: string;
  cluster?: string;
  looms?: number;
  bankName?: string;
  accountNo?: string;
  ifsc?: string;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  mobile?: string;
  email?: string;
  status?: BackendStatus;
  additionalRoles?: BackendRole[];
}

export const usersApi = {
  list: (params: number | { pageSize?: number; role?: BackendRole; search?: string } = 100) => {
    // Historically this took a bare pageSize; kept working so existing call
    // sites don't have to change, with an options object for the staff
    // directories that need a role/search filter.
    const opts = typeof params === "number" ? { pageSize: params } : params;
    const query = new URLSearchParams({ pageSize: String(opts.pageSize ?? 100) });
    if (opts.role) query.set("role", opts.role);
    if (opts.search) query.set("search", opts.search);
    return apiClient.get<PaginatedResponse<BackendUser>>(`/users?${query.toString()}`);
  },

  create: (payload: CreateUserPayload) => apiClient.post<BackendUser>("/users", payload),

  update: (id: string, payload: UpdateUserPayload) =>
    apiClient.patch<BackendUser>(`/users/${id}`, payload),

  updateStatus: (id: string, status: BackendStatus) =>
    apiClient.patch<BackendUser>(`/users/${id}`, { status }),

  // Its own endpoint, behind its own permission (users.roles.manage) — the
  // general PATCH deliberately can't raise somebody's access level. Plural
  // because the level is per portal and Manage Access saves the whole map.
  updateAccessLevels: (id: string, levels: BackendPortalAccess[]) =>
    apiClient.patch<BackendUser>(`/users/${id}/access-levels`, { levels }),

  remove: (id: string) => apiClient.delete<void>(`/users/${id}`),
};
