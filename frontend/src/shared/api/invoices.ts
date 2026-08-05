import { apiClient } from "./client";

export type BackendInvoiceStatus = "PAID" | "PARTIAL" | "PENDING" | "OVERDUE";

export interface BackendInvoicePayment {
  id: string;
  invoiceId: string;
  amount: string;
  date: string;
  utr: string | null;
  method: string | null;
  firmId: string | null;
}

export interface BackendInvoice {
  id: string;
  customerId: string;
  invoiceDate: string;
  dueDate: string | null;
  total: string;
  paid: string;
  status: BackendInvoiceStatus;
  payments: BackendInvoicePayment[];
  customer: { id: string; name: string; city: string | null; phone: string | null } | null;
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
  total: number;
}

export interface CreateInvoicePaymentPayload {
  amount: number;
  utr?: string;
  method?: string;
  firmId?: string;
}

export const invoicesApi = {
  list: (pageSize = 100) =>
    apiClient.get<PaginatedResponse<BackendInvoice>>(`/invoices?pageSize=${pageSize}`),

  findOne: (id: string) => apiClient.get<BackendInvoice>(`/invoices/${id}`),

  create: (payload: CreateInvoicePayload) => apiClient.post<BackendInvoice>("/invoices", payload),

  recordPayment: (id: string, payload: CreateInvoicePaymentPayload) =>
    apiClient.post<BackendInvoice>(`/invoices/${id}/payments`, payload),
};
