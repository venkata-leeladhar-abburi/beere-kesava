import { apiClient } from "./client";

// TODO(auth): there is no real login/session yet, so /purchase-requests'
// requestedById/decidedById (required real User FKs) can't come from a
// logged-in user. Stopgap until JWT/OTP auth lands: a single real "System
// Admin" User row was seeded for this purpose (EMP-010) — every request
// raised/decided from this frontend is attributed to that user until then.
export const STOPGAP_ACTING_USER_ID = "8a14068c-5adc-489d-b00d-11a43495774c";

export type BackendPurchaseRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface BackendPurchaseRequest {
  id: string;
  supplierId: string | null;
  requestedById: string;
  sareeType: string | null;
  quantity: number;
  estimatedAmount: string | null;
  urgency: string | null;
  reason: string | null;
  status: BackendPurchaseRequestStatus;
  decidedById: string | null;
  decidedDate: string | null;
  decisionNote: string | null;
  createdAt: string;
}

export interface CreatePurchaseRequestPayload {
  supplierId?: string;
  sareeType?: string;
  quantity: number;
  estimatedAmount?: number;
  urgency?: string;
  reason?: string;
}

export interface DecidePurchaseRequestPayload {
  decision: "APPROVED" | "REJECTED";
  decisionNote?: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const purchaseRequestsApi = {
  list: (pageSize = 100) =>
    apiClient.get<PaginatedResponse<BackendPurchaseRequest>>(`/purchase-requests?pageSize=${pageSize}`),
  create: (payload: CreatePurchaseRequestPayload) =>
    apiClient.post<BackendPurchaseRequest>("/purchase-requests", {
      ...payload,
      requestedById: STOPGAP_ACTING_USER_ID,
    }),
  decide: (id: string, payload: DecidePurchaseRequestPayload) =>
    apiClient.post<BackendPurchaseRequest>(`/purchase-requests/${id}/decide`, {
      ...payload,
      decidedById: STOPGAP_ACTING_USER_ID,
    }),
};
