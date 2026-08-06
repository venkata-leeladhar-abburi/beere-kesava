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

export interface ActionLogEntry {
  id: string;
  userId: string | null;
  role: string;
  module: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  recordLabel: string | null;
  oldValue: string | null;
  newValue: string | null;
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

  listActions: (params: { pageSize?: number; module?: string } = {}) => {
    const { pageSize = 100, module } = params;
    const query = new URLSearchParams({ pageSize: String(pageSize) });
    if (module && module !== "All Modules") query.set("module", module);
    return apiClient.get<PaginatedResponse<ActionLogEntry>>(`/audit-log/actions?${query.toString()}`);
  },
};
