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

  listActions: (
    params: { pageSize?: number; page?: number; module?: string; userId?: string; modules?: string[] } = {},
  ) => {
    const { pageSize = 100, page, module, userId, modules } = params;
    const query = new URLSearchParams({ pageSize: String(pageSize) });
    if (page) query.set("page", String(page));
    if (userId) query.set("userId", userId);
    // A portal's whole module set — used by the staff directories to scope a
    // person's history to the portal they work in.
    if (modules?.length) query.set("modules", modules.join(","));
    else if (module && module !== "All Modules") query.set("module", module);
    return apiClient.get<PaginatedResponse<ActionLogEntry>>(`/audit-log/actions?${query.toString()}`);
  },
};
