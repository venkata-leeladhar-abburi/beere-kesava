import { apiClient } from "./client";

export interface BackendPurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  vendor: { id: string; name: string; city: string | null; contactName: string | null };
  deliveryDate: string | null;
  totalValue: string;
  urgency: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "RECEIVED";
  grnId: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

export interface CreatePurchaseOrderPayload {
  vendorId: string;
  deliveryDate?: string;
  totalValue?: number;
  urgency?: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const purchaseOrdersApi = {
  list: (pageSize = 100) =>
    apiClient.get<PaginatedResponse<BackendPurchaseOrder>>(`/purchase-orders?pageSize=${pageSize}`),
  create: (payload: CreatePurchaseOrderPayload) =>
    apiClient.post<BackendPurchaseOrder>("/purchase-orders", payload),
  approve: (id: string) => apiClient.post<BackendPurchaseOrder>(`/purchase-orders/${id}/approve`, {}),
  reject: (id: string, reason?: string) =>
    apiClient.post<BackendPurchaseOrder>(`/purchase-orders/${id}/reject`, { reason }),
  receiveGrn: (id: string) => apiClient.post<BackendPurchaseOrder>(`/purchase-orders/${id}/grn`, {}),
};
