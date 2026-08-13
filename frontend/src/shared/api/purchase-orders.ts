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
  createdBy?: { firstName: string; lastName: string } | null;
  items?: {
    id: string;
    materialType: string;
    name: string;
    quantity: number;
    unit: string;
    unitPrice: string | null;
    totalPrice: string | null;
    /** Set once the vendor's real bill splits an amount to this material line. */
    invoicedAmount: string | null;
  }[];
}

export interface CreatePurchaseOrderPayload {
  actorId?: string;
  vendorId: string;
  deliveryDate?: string;
  totalValue?: number;
  urgency?: string;
  items?: {
    materialType: string;
    name: string;
    quantity: number;
    unit?: string;
    unitPrice?: number;
  }[];
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
  approve: (id: string, actorId?: string) =>
    apiClient.post<BackendPurchaseOrder>(`/purchase-orders/${id}/approve`, { actorId }),
  reject: (id: string, reason?: string, actorId?: string) =>
    apiClient.post<BackendPurchaseOrder>(`/purchase-orders/${id}/reject`, { reason, actorId }),
  receiveGrn: (id: string, payload: { grnReceiptId?: string; actorId?: string } = {}) =>
    apiClient.post<BackendPurchaseOrder>(`/purchase-orders/${id}/grn`, payload),
  remove: (id: string) => apiClient.delete<void>(`/purchase-orders/${id}`),
};
