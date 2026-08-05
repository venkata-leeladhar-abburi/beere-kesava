import { apiClient } from "./client";

export type SalesChannel = "RETAIL" | "WHOLESALE";

export interface BackendSaleRecord {
  ref: string;
  sareeId: string;
  channel: SalesChannel;
  customerId: string | null;
  amount: string; // Prisma Decimal serialised as string
  saleDate: string;
}

export interface BackendSaleReturn {
  ref: string;
  saleRef: string;
  sareeId: string;
  reason: string;
  returnDate: string;
  refundAmount: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateSalePayload {
  sareeId: string;
  channel: SalesChannel;
  /** Required when channel === 'WHOLESALE' */
  customerId?: string;
  amount: number;
}

export interface CreateReturnPayload {
  saleRef: string;
  reason: string;
  refundAmount?: number;
}

export const salesApi = {
  /** POST /sales — record a completed retail or wholesale sale */
  create: (payload: CreateSalePayload) =>
    apiClient.post<BackendSaleRecord>("/sales", payload),

  /** GET /sales — paginated list of all sales */
  list: (pageSize = 100) =>
    apiClient.get<PaginatedResponse<BackendSaleRecord>>(`/sales?pageSize=${pageSize}`),

  /** GET /sales/:saleRef */
  findOne: (saleRef: string) =>
    apiClient.get<BackendSaleRecord>(`/sales/${saleRef}`),

  /** POST /sales/returns — record a returned saree */
  createReturn: (payload: CreateReturnPayload) =>
    apiClient.post<BackendSaleReturn>("/sales/returns", payload),

  /** GET /sales/returns/all */
  listReturns: (pageSize = 100) =>
    apiClient.get<PaginatedResponse<BackendSaleReturn>>(`/sales/returns/all?pageSize=${pageSize}`),
};
