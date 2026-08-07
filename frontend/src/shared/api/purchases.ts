import { apiClient } from "./client";

export type PurchasePaymentStatus = "PAID" | "PENDING" | "PARTIAL";

export interface BackendPurchaseSupplier {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  gstCode: string | null;
}

export interface BackendPurchase {
  id: string;
  supplierId: string;
  supplier: BackendPurchaseSupplier;
  date: string;
  sareeCount: number;
  gstNumber: string | null;
  invoiceNumber: string | null;
  billAmount: string;
  status: PurchasePaymentStatus;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const purchasesApi = {
  list: (pageSize = 100, page = 1, supplierId?: string, status?: PurchasePaymentStatus) => {
    const params = new URLSearchParams({ pageSize: String(pageSize), page: String(page) });
    if (supplierId) params.set("supplierId", supplierId);
    if (status) params.set("status", status);
    return apiClient.get<PaginatedResponse<BackendPurchase>>(`/purchases?${params.toString()}`);
  },
};
