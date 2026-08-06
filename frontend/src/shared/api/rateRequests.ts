import { apiClient } from "./client";

export interface BackendRateChangeRequest {
  id: string;
  sareeTypeCode: string;
  sareeType: { code: string; type: string; makingCharge: number };
  oldMakingCharge: number;
  newMakingCharge: number;
  oldRetailPrice: number;
  newRetailPrice: number;
  oldWholesalePrice: number;
  newWholesalePrice: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reason?: string | null;
  requestedBy: { id: string; firstName: string; lastName: string };
  decidedBy?: { id: string; firstName: string; lastName: string } | null;
  createdAt: string;
  decidedAt?: string | null;
}

export interface CreateRateRequestPayload {
  sareeTypeCode: string;
  newMakingCharge: number;
  newRetailPrice: number;
  newWholesalePrice: number;
  reason?: string;
  requestedById: string;
}

export const rateRequestsApi = {
  list: (status?: string) =>
    apiClient.get<{ items: BackendRateChangeRequest[] }>(`/rate-requests${status ? `?status=${status}` : ""}`),
  create: (payload: CreateRateRequestPayload) => apiClient.post<BackendRateChangeRequest>("/rate-requests", payload),
  approve: (id: string, decidedById?: string) =>
    apiClient.patch<BackendRateChangeRequest>(`/rate-requests/${id}/approve`, { decidedById }),
  reject: (id: string, decidedById?: string, reason?: string) =>
    apiClient.patch<BackendRateChangeRequest>(`/rate-requests/${id}/reject`, { decidedById, reason }),
};
