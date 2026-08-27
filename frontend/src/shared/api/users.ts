import { apiClient } from "./client";

// Backend enum values (backend/prisma/schema.prisma UserRole / AccessLevel).
export type BackendRole = "ADMIN" | "SUPERADMIN" | "WORKER" | "WEAVER" | "SHOP" | "ACCOUNTANT";
export type BackendAccessLevel =
  | "FULL_ACCESS"
  | "RESTRICTED"
  | "DOWNLOAD_RESTRICTED"
  | "MONEY_HIDDEN";
export type BackendStatus = "ACTIVE" | "INACTIVE";

export interface BackendUser {
  id: string;
  empId: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email: string | null;
  role: BackendRole;
  accessLevel: BackendAccessLevel;
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

// The frontend UI only exposes two access levels (Full/Semi); the backend has
// four. RESTRICTED/DOWNLOAD_RESTRICTED/MONEY_HIDDEN all display as "Semi Access".
export function backendAccessLevelToFrontend(level: BackendAccessLevel): "Full Access" | "Semi Access" {
  return level === "FULL_ACCESS" ? "Full Access" : "Semi Access";
}

export function frontendAccessLevelToBackend(level: "Full Access" | "Semi Access"): BackendAccessLevel {
  return level === "Full Access" ? "FULL_ACCESS" : "RESTRICTED";
}

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  mobile: string;
  email?: string;
  role: BackendRole;
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

  remove: (id: string) => apiClient.delete<void>(`/users/${id}`),
};
