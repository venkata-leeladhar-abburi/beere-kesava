import { apiClient } from "./client";

export type VendorBillStatus = "PENDING" | "PARTIAL" | "PAID" | "OVERDUE";

export interface CreateVendorBillPayload {
  vendorId: string;
  poId?: string;
  amount: number;
  dueDate?: string;
  description?: string;
}

export interface BackendVendorBill {
  id: string;
  vendorId: string;
  poId: string | null;
  amount: string;
  dueDate: string | null;
  status: VendorBillStatus;
  description: string | null;
  createdAt: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const vendorBillsApi = {
  create: (payload: CreateVendorBillPayload) =>
    apiClient.post<BackendVendorBill>("/vendor-bills", payload),
  list: (vendorId?: string, status?: VendorBillStatus) => {
    const params = new URLSearchParams({ pageSize: "100" });
    if (vendorId) params.set("vendorId", vendorId);
    if (status) params.set("status", status);
    return apiClient.get<PaginatedResponse<BackendVendorBill>>(
      `/vendor-bills?${params.toString()}`,
    );
  },
  getOne: (id: string) => apiClient.get<BackendVendorBill>(`/vendor-bills/${id}`),
};
