import { apiClient } from "./client";

export interface BackendSupplier {
  id: string;
  code: string | null;
  name: string;
  initials: string | null;
  contactName: string | null;
  phone: string | null;
  whatsapp: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  gstCode: string | null;
  specialty: string | null;
  terms: string | null;
  bankName: string | null;
  accountNo: string | null;
  ifscCode: string | null;
  notes: string | null;
  status: "ACTIVE" | "INACTIVE" | "OVERDUE";
  rating: number | null;
  createdAt: string;
}

export interface CreateSupplierPayload {
  name: string;
  initials?: string;
  contactName?: string;
  phone?: string;
  whatsapp?: string;
  city?: string;
  state?: string;
  address?: string;
  gstCode?: string;
  specialty?: string;
  terms?: string;
  bankName?: string;
  accountNo?: string;
  ifscCode?: string;
  notes?: string;
  rating?: number;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const suppliersApi = {
  list: (pageSize = 100) =>
    apiClient.get<PaginatedResponse<BackendSupplier>>(`/suppliers?pageSize=${pageSize}`),
  create: (payload: CreateSupplierPayload) => apiClient.post<BackendSupplier>("/suppliers", payload),
  update: (id: string, payload: Partial<CreateSupplierPayload> & { status?: string }) =>
    apiClient.patch<BackendSupplier>(`/suppliers/${id}`, payload),
  remove: (id: string) => apiClient.delete<void>(`/suppliers/${id}`),
};
