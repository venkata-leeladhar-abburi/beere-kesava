import { apiClient } from "./client";

export type BackendQuotationStatus =
  | "RAISED"
  | "IN_FINISHING"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  | "DISPATCHED";
export type BackendQuotationSareeStatus = "PENDING" | "IN_FINISHING" | "RECEIVED";

export interface BackendQuotationSaree {
  quotationId: string;
  sareeId: string;
  finishingStatus: BackendQuotationSareeStatus;
  price: string;
}

export interface BackendQuotation {
  id: string;
  quotationNumber: string;
  quotationDate: string;
  customerId: string | null;
  bulkOrderRef: string | null;
  applyGst: boolean;
  gstPct: string | null;
  subtotal: string;
  grandTotal: string;
  firmId: string | null;
  status: BackendQuotationStatus;
  raisedById: string;
  raisedBy?: { id: string; firstName: string; lastName: string } | null;
  createdAt: string;
  sarees: BackendQuotationSaree[];
  customer: { id: string; name: string; city: string | null; phone: string | null; address: string | null; gstCode: string | null } | null;
  bulkOrder: { ref: string } | null;
  finishingAssignments?: { sareeId: string; finishingStaff: { id: string; firstName: string; lastName: string } }[];
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateQuotationPayload {
  customerId: string;
  bulkOrderRef?: string;
  applyGst?: boolean;
  gstPct?: number;
  firmId?: string;
  raisedById: string;
  sarees: { sareeId: string; price: number }[];
}

export const quotationsApi = {
  list: (pageSize = 100) =>
    apiClient.get<PaginatedResponse<BackendQuotation>>(`/quotations?pageSize=${pageSize}`),

  findOne: (id: string) => apiClient.get<BackendQuotation>(`/quotations/${id}`),

  create: (payload: CreateQuotationPayload) => apiClient.post<BackendQuotation>("/quotations", payload),

  assignFinishing: (id: string, payload: { sareeIds: string[]; staffId: string; assignedById: string }) => 
    apiClient.post<BackendQuotation>(`/quotations/${id}/assign-finishing`, payload),

  receiveSarees: (id: string, sareeIds: string[]) =>
    apiClient.post<BackendQuotation>(`/quotations/${id}/receive`, { sareeIds }),

  dispatch: (id: string) => apiClient.post<BackendQuotation>(`/quotations/${id}/dispatch`, {}),
};
