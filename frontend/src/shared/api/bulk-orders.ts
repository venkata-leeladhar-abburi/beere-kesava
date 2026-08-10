import { apiClient } from "./client";

export type BackendBulkOrderStatus = "ON_TRACK" | "AT_RISK" | "OVERDUE";
export type BackendDispatchStatus = "PENDING" | "DISPATCHED" | "INVOICED";
export type BackendOrderPaymentStatus = "PENDING" | "PARTIAL" | "PAID";

export interface BackendBulkOrder {
  ref: string;
  customerId: string;
  dueDate: string;
  createdDate: string;
  status: BackendBulkOrderStatus;
  sareeTypeCode: string | null;
  designCode: string | null;
  total: number;
  done: number;
  shortage: number;
  dispatchStatus: BackendDispatchStatus;
  paymentStatus: BackendOrderPaymentStatus;
  amountDue: string;
  amountPaid: string;
  gstCode: string | null;
  address: string | null;
  phone: string | null;
  visitingCardUrl: string | null;
  photoUrls: string[];
  tallied: boolean;
  talliedBy: string | null;
  talliedDate: string | null;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateBulkOrderPayload {
  customerId: string;
  dueDate: string;
  sareeTypeCode?: string;
  designCode?: string;
  total: number;
  amountDue: number;
  gstCode?: string;
  address?: string;
  phone?: string;
  visitingCardUrl?: string;
  photoUrls?: string[];
}

export interface UpdateBulkOrderPayload {
  status?: BackendBulkOrderStatus;
  done?: number;
  shortage?: number;
  paymentStatus?: BackendOrderPaymentStatus;
  amountPaid?: number;
  tallied?: boolean;
  talliedBy?: string;
}

export const bulkOrdersApi = {
  list: (pageSize = 100) =>
    apiClient.get<PaginatedResponse<BackendBulkOrder>>(`/bulk-orders?pageSize=${pageSize}`),

  findOne: (ref: string) => apiClient.get<BackendBulkOrder>(`/bulk-orders/${ref}`),

  create: (payload: CreateBulkOrderPayload) => apiClient.post<BackendBulkOrder>("/bulk-orders", payload),

  update: (ref: string, payload: UpdateBulkOrderPayload) =>
    apiClient.patch<BackendBulkOrder>(`/bulk-orders/${ref}`, payload),

  remove: (ref: string) => apiClient.delete<void>(`/bulk-orders/${ref}`),
};
