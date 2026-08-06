import { apiClient } from "./client";

export interface BackendWarpRequest {
  id: string;
  weaverId: string;
  weaver: { id: string; name: string; initials: string; village?: string | null };
  loomNumber?: string | null;
  warpType: string;
  lengthMeters: number;
  color?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedAt: string;
  decidedAt?: string | null;
  decidedBy?: { id: string; firstName: string; lastName: string } | null;
  notes?: string | null;
}

export interface CreateWarpRequestPayload {
  weaverId: string;
  loomNumber?: string;
  warpType: string;
  lengthMeters: number;
  color?: string;
  notes?: string;
}

export const warpRequestsApi = {
  list: (status?: string) =>
    apiClient.get<{ items: BackendWarpRequest[] }>(`/warp-requests${status ? `?status=${status}` : ""}`),
  create: (payload: CreateWarpRequestPayload) => apiClient.post<BackendWarpRequest>("/warp-requests", payload),
  approve: (id: string, decidedById?: string) =>
    apiClient.patch<BackendWarpRequest>(`/warp-requests/${id}/approve`, { decidedById }),
  reject: (id: string, decidedById?: string, notes?: string) =>
    apiClient.patch<BackendWarpRequest>(`/warp-requests/${id}/reject`, { decidedById, notes }),
};
