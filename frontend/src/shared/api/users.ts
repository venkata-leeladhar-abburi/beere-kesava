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
}

export const usersApi = {
  list: (pageSize = 100) =>
    apiClient.get<PaginatedResponse<BackendUser>>(`/users?pageSize=${pageSize}`),

  create: (payload: CreateUserPayload) => apiClient.post<BackendUser>("/users", payload),

  updateStatus: (id: string, status: BackendStatus) =>
    apiClient.patch<BackendUser>(`/users/${id}`, { status }),
};
