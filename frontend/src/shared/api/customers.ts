import { apiClient } from "./client";

export type BackendCustomerType = "WHOLESALE" | "RETAIL";

export interface BackendCustomer {
  id: string;
  code: string | null;
  name: string;
  contactName: string | null;
  city: string | null;
  phone: string | null;
  address: string | null;
  gstCode: string | null;
  bankName: string | null;
  accountNumber: string | null;
  ifscCode: string | null;
  type: BackendCustomerType;
  visitingCardUrl: string | null;
  whatsapp: string | null;
  state: string | null;
  paymentTerms: string | null;
  notes: string | null;
  createdAt: string;
  // Real purchase count/lifetime spend/last-visit computed off SaleRecord
  // (CustomersService.findAll) — always present on list responses.
  totalPurchases: number;
  totalSpend: number;
  lastPurchaseDate: string | null;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateCustomerPayload {
  name: string;
  contactName?: string;
  type?: BackendCustomerType;
  city?: string;
  phone?: string;
  address?: string;
  gstCode?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  visitingCardUrl?: string;
  whatsapp?: string;
  state?: string;
  paymentTerms?: string;
  notes?: string;
  /** User who performed this — recorded on the action log so the history
   *  names the real person, including an admin working inside a staff portal. */
  actorId?: string;
}

export interface UpdateCustomerPayload {
  name?: string;
  contactName?: string;
  city?: string;
  phone?: string;
  address?: string;
  gstCode?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  visitingCardUrl?: string;
  whatsapp?: string;
  state?: string;
  paymentTerms?: string;
  notes?: string;
  /** User who performed this — recorded on the action log so the history
   *  names the real person, including an admin working inside a staff portal. */
  actorId?: string;
}

export const customersApi = {
  /** Every customer, fetched page by page. A single page used to be the whole
   *  list, so once there were more than 100 customers the oldest silently
   *  vanished from every screen (e.g. wholesale codes -001 to -039). */
  list: async (pageSize = 500, type?: BackendCustomerType): Promise<PaginatedResponse<BackendCustomer>> => {
    const items: BackendCustomer[] = [];
    for (let page = 1; ; page++) {
      const params = new URLSearchParams({ page: String(page), pageSize: String(Math.min(pageSize, 500)) });
      if (type) params.set("type", type);
      const res = await apiClient.get<PaginatedResponse<BackendCustomer>>(`/customers?${params.toString()}`);
      items.push(...res.items);
      if (res.items.length === 0 || items.length >= res.total) {
        return { ...res, items, page: 1, pageSize: items.length };
      }
    }
  },

  findOne: (id: string) => apiClient.get<BackendCustomer>(`/customers/${id}`),

  create: (payload: CreateCustomerPayload) => apiClient.post<BackendCustomer>("/customers", payload),

  update: (id: string, payload: UpdateCustomerPayload) =>
    apiClient.patch<BackendCustomer>(`/customers/${id}`, payload),

  remove: (id: string) => apiClient.delete<void>(`/customers/${id}`),
};
