import { apiClient } from "./client";

export type BackendInvoiceStatus = "PAID" | "PARTIAL" | "PENDING" | "OVERDUE";

/** Minimal identity of the staff member who performed an action, for attribution display. */
export interface BackendActorSummary {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface BackendInvoicePayment {
  id: string;
  invoiceId: string;
  amount: string;
  date: string;
  utr: string | null;
  method: string | null;
  firmId: string | null;
  /** Accountant / Shop Staff who recorded this collection. */
  recordedBy?: BackendActorSummary | null;
}

export interface BackendInvoice {
  id: string;
  customerId: string;
  invoiceDate: string;
  dueDate: string | null;
  total: string;
  paid: string;
  status: BackendInvoiceStatus;
  dispatchId: string | null;
  payments: BackendInvoicePayment[];
  customer: { id: string; name: string; city: string | null; phone: string | null; type: "WHOLESALE" | "RETAIL" } | null;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateInvoicePayload {
  customerId: string;
  dueDate?: string;
  dispatchId?: string;
  total: number;
}

export interface CreateInvoicePaymentPayload {
  amount: number;
  utr?: string;
  method?: string;
  firmId?: string;
}

export const invoicesApi = {
  list: (opts?: { pageSize?: number; customerId?: string }) => {
    const params = new URLSearchParams({ pageSize: String(opts?.pageSize ?? 100) });
    if (opts?.customerId) params.set("customerId", opts.customerId);
    return apiClient.get<PaginatedResponse<BackendInvoice>>(`/invoices?${params.toString()}`);
  },

  findOne: (id: string) => apiClient.get<BackendInvoice>(`/invoices/${id}`),

  create: (payload: CreateInvoicePayload) => apiClient.post<BackendInvoice>("/invoices", payload),

  recordPayment: (id: string, payload: CreateInvoicePaymentPayload) =>
    apiClient.post<BackendInvoice>(`/invoices/${id}/payments`, payload),
};
