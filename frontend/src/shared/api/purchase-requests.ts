import { apiClient } from "./client";

// TODO(auth): callers that have a real logged-in user should pass their own
// id instead of this fallback (see useAuth().user?.id in QcContext,
// FinishingContext, MaterialIssueContext). This module has no access to
// AuthContext, so it always falls back to the seeded ADMIN-001 "Store Admin"
// user — the previous EMP-010 placeholder id didn't exist in the database,
// so every call using it was silently failing with a 404.
export const STOPGAP_ACTING_USER_ID = "9e7ec2bf-93bf-4cf4-87ce-03856eb6cc4c";

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
