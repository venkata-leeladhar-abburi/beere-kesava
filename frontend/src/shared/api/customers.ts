import { apiClient } from "./client";

export type BackendCustomerType = "WHOLESALE" | "RETAIL";

export interface BackendCustomer {
  id: string;
  name: string;
  city: string | null;
  phone: string | null;
  address: string | null;
  gstCode: string | null;
  type: BackendCustomerType;
  visitingCardUrl: string | null;
  createdAt: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateCustomerPayload {
  name: string;
  type?: BackendCustomerType;
  city?: string;
  phone?: string;
  address?: string;
  gstCode?: string;
  visitingCardUrl?: string;
}

export interface UpdateCustomerPayload {
  name?: string;
  city?: string;
  phone?: string;
  address?: string;
  gstCode?: string;
  visitingCardUrl?: string;
}

export const customersApi = {
  list: (pageSize = 100) =>
    apiClient.get<PaginatedResponse<BackendCustomer>>(`/customers?pageSize=${pageSize}`),

  findOne: (id: string) => apiClient.get<BackendCustomer>(`/customers/${id}`),

  create: (payload: CreateCustomerPayload) => apiClient.post<BackendCustomer>("/customers", payload),

  update: (id: string, payload: UpdateCustomerPayload) =>
    apiClient.patch<BackendCustomer>(`/customers/${id}`, payload),
};
