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
  /** Human-facing id (INV-<CustomerCode>-NNN); falls back to `id` if not generated. */
  code?: string | null;
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

// ListInvoicesQueryDto caps pageSize at 100 — asking for more is a 400, not a
// bigger page. Callers derive totals, ageing and payment history client-side
// over the whole set, so a single capped page silently dropped older invoices.
// Walk every backend page and merge them.
const INVOICES_MAX_PAGE_SIZE = 100;

export const invoicesApi = {
  list: async (opts?: { pageSize?: number; customerId?: string }): Promise<PaginatedResponse<BackendInvoice>> => {
    const pageSize = Math.min(Math.max(opts?.pageSize ?? INVOICES_MAX_PAGE_SIZE, 1), INVOICES_MAX_PAGE_SIZE);
    const fetchPage = (page: number) => {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (opts?.customerId) params.set("customerId", opts.customerId);
      return apiClient.get<PaginatedResponse<BackendInvoice>>(`/invoices?${params.toString()}`);
    };

    const first = await fetchPage(1);
    const items = [...first.items];
    let page = 1;
    while (items.length < first.total) {
      page += 1;
      const next = await fetchPage(page);
      if (next.items.length === 0) break;
      items.push(...next.items);
    }
    return { items, total: first.total, page: 1, pageSize: items.length };
  },

  findOne: (id: string) => apiClient.get<BackendInvoice>(`/invoices/${id}`),

  create: (payload: CreateInvoicePayload) => apiClient.post<BackendInvoice>("/invoices", payload),

  recordPayment: (id: string, payload: CreateInvoicePaymentPayload) =>
    apiClient.post<BackendInvoice>(`/invoices/${id}/payments`, payload),
};
