import { io, Socket } from "socket.io-client";
import { apiClient } from "./client";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export interface BackendNotification {
  id: string;
  targetType: "USER" | "ROLE";
  userId: string | null;
  role: string | null;
  type: string;
  payload: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateNotificationPayload {
  targetType: "USER" | "ROLE";
  userId?: string;
  role?: "ADMIN" | "SUPERADMIN" | "WORKER" | "WEAVER" | "SHOP" | "ACCOUNTANT";
  type: string;
  payload?: Record<string, unknown>;
}

export const notificationsApi = {
  create: (payload: CreateNotificationPayload) =>
    apiClient.post<BackendNotification>("/notifications", payload),
  list: (params: { role?: string; userId?: string; pageSize?: number } = {}) => {
    const query = new URLSearchParams();
    query.set("pageSize", String(params.pageSize ?? 100));
    if (params.role) query.set("role", params.role);
    if (params.userId) query.set("userId", params.userId);
    return apiClient.get<PaginatedResponse<BackendNotification>>(`/notifications?${query.toString()}`);
  },
  markRead: (id: string) => apiClient.patch<BackendNotification>(`/notifications/${id}/read`, {}),
};

/**
 * Connects to the real-time notifications gateway. Room membership is now
 * derived server-side from this token (see backend's notifications.gateway.ts)
 * — the `params` a caller used to pass are no longer trusted by the server,
 * kept only so existing call sites don't need to change their signature.
 */
export function connectNotificationsSocket(_params: { userId?: string; role?: string } = {}): Socket {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token") || undefined;
  return io(API_BASE_URL, { transports: ["websocket"], auth: { token } });
}
