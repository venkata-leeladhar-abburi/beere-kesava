import { apiClient } from "./client";

export type BackendDispatchType = "SHOP" | "WHOLESALE";

export interface BackendDispatchSaree {
  dispatchId: string;
  sareeId: string;
}

export interface BackendDispatchRecord {
  id: string;
  type: BackendDispatchType;
  dispatchDate: string;
  lrNumber: string | null;
  transportCompany: string | null;
  vehicleNumber: string | null;
  driverName: string | null;
  customerId: string | null;
  customer: { id: string; name: string; phone: string | null; address: string | null; city: string | null } | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  pricePerSaree: string | null;
  totalAmount: string;
  gstPct: string | null;
  grandTotal: string;
  firmId: string | null;
  paymentDueDate: string | null;
  bulkOrderRef: string | null;
  quotationRef: string | null;
  pendingTransport: boolean;
  pendingReceipt: boolean;
  notes: string | null;
  expectedDelivery: string | null;
  specialInstructions: string | null;
  sarees: BackendDispatchSaree[];
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateDispatchPayload {
  type: BackendDispatchType;
  sareeIds: string[];
  lrNumber?: string;
  transportCompany?: string;
  vehicleNumber?: string;
  driverName?: string;
  pendingTransport?: boolean;
  pendingReceipt?: boolean;
  notes?: string;
  expectedDelivery?: string;
  specialInstructions?: string;
  bulkOrderRef?: string;
  quotationRef?: string;
  // Wholesale only
  customerId?: string;
  invoiceNumber?: string;
  pricePerSaree?: number;
  gstPct?: number;
  firmId?: string;
  paymentDueDate?: string;
}

export interface UpdateDispatchPayload {
  lrNumber?: string;
  transportCompany?: string;
  vehicleNumber?: string;
  driverName?: string;
  dispatchDate?: string;
  notes?: string;
  expectedDelivery?: string;
  specialInstructions?: string;
  pendingTransport?: boolean;
  pendingReceipt?: boolean;
}

export const dispatchApi = {
  list: (pageSize = 100) =>
    apiClient.get<PaginatedResponse<BackendDispatchRecord>>(`/dispatch?pageSize=${pageSize}`),

  findOne: (id: string) => apiClient.get<BackendDispatchRecord>(`/dispatch/${id}`),

  create: (payload: CreateDispatchPayload) => apiClient.post<BackendDispatchRecord>("/dispatch", payload),

  update: (id: string, payload: UpdateDispatchPayload) =>
    apiClient.patch<BackendDispatchRecord>(`/dispatch/${id}`, payload),

  delete: (id: string, actorId: string) => apiClient.delete(`/dispatch/${id}?actorId=${actorId}`),
};
