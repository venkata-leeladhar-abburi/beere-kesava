import { apiClient } from "./client";

export interface BackendAuditLog {
  id: string;
  userId: string | null;
  status: "LOGIN" | "LOGOUT" | "FAILED";
  device: string | null;
  duration: number | null;
  failReason: string | null;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    role: string;
  } | null;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const auditLogApi = {
  list: (pageSize = 100) =>
    apiClient.get<PaginatedResponse<BackendAuditLog>>(`/audit-log?pageSize=${pageSize}`),
};
