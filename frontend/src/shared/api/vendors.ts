import { apiClient } from "./client";

export interface BackendVendor {
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
  visitingCardUrl: string | null;
  status: "ACTIVE" | "INACTIVE" | "OVERDUE";
  rating: number | null;
  createdAt: string;
}

export interface CreateVendorPayload {
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
  /** Server-relative path from POST /uploads/photo — never a base64 data URL. */
  visitingCardUrl?: string;
  rating?: number;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const vendorsApi = {
  list: (pageSize = 100) => apiClient.get<PaginatedResponse<BackendVendor>>(`/vendors?pageSize=${pageSize}`),
  create: (payload: CreateVendorPayload) => apiClient.post<BackendVendor>("/vendors", payload),
  update: (id: string, payload: Partial<CreateVendorPayload> & { status?: string }) =>
    apiClient.patch<BackendVendor>(`/vendors/${id}`, payload),
  remove: (id: string) => apiClient.delete<void>(`/vendors/${id}`),
};
