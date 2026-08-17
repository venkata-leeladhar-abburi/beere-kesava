import { apiClient } from "./client";

export type BackendSupplierReturnStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface BackendSupplierReturnRequest {
  id: string;
  purchaseId: string;
  purchase: { id: string; supplierName: string | null; invoiceNumber: string | null };
  supplierId: string;
  supplier: { id: string; name: string; code: string | null };
  sareeLineId: string;
  sareeLine: { id: string; code: string; sareeType: string | null; color: string | null; quantity: number; returnedQuantity: number };
  quantity: number;
  reason: string | null;
  status: BackendSupplierReturnStatus;
  requestedById: string;
  requestedBy: { id: string; firstName: string; lastName: string };
  decidedById: string | null;
  decidedBy: { id: string; firstName: string; lastName: string } | null;
  decidedAt: string | null;
  decisionNote: string | null;
  createdAt: string;
}

export interface CreateSupplierReturnRequestPayload {
  purchaseId: string;
  sareeLineId: string;
  quantity: number;
  reason?: string;
}

export interface DecideSupplierReturnRequestPayload {
  decision: "APPROVED" | "REJECTED";
  decisionNote?: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const supplierReturnsApi = {
  list: (params: { status?: BackendSupplierReturnStatus; pageSize?: number } = {}) => {
    const query = new URLSearchParams();
    query.set("pageSize", String(params.pageSize ?? 100));
    if (params.status) query.set("status", params.status);
    return apiClient.get<PaginatedResponse<BackendSupplierReturnRequest>>(`/supplier-returns?${query.toString()}`);
  },

  create: (payload: CreateSupplierReturnRequestPayload, requestedById: string) =>
    apiClient.post<BackendSupplierReturnRequest>("/supplier-returns", { ...payload, requestedById }),

  decide: (id: string, payload: DecideSupplierReturnRequestPayload, decidedById: string) =>
    apiClient.post<BackendSupplierReturnRequest>(`/supplier-returns/${id}/decide`, { ...payload, decidedById }),
};
