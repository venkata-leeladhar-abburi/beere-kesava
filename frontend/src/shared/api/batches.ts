import { apiClient } from "./client";

export type BackendBatchStatus = "DRAFT" | "ACTIVE" | "COMPLETED";
export type BackendRecipientType = "WEAVER" | "FACTORY_LOOM";

export interface BackendBatchSareeRow {
  id: string;
  batchId: string;
  serial: number;
  sareeId: string | null;
  recipientType: BackendRecipientType | null;
  weaverId: string | null;
  factoryLoomId: string | null;
  designCode: string | null;
  sareeTypeCode: string | null;
  bulkOrderRef: string | null;
  qcPassed: boolean | null;
}

export interface BackendBatch {
  id: string;
  totalCount: number;
  dueDate: string;
  status: BackendBatchStatus;
  createdAt: string;
  updatedAt: string;
  rows: BackendBatchSareeRow[];
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateBatchPayload {
  totalCount: number;
  dueDate: string;
}

export interface AssignBatchRowPayload {
  recipientType: BackendRecipientType;
  weaverId?: string;
  factoryLoomId?: string;
  designCode?: string;
  sareeTypeCode: string;
  loomNumber?: number;
  // NOTE: bulkOrderRef intentionally not sent — no backend Bulk Orders module
  // exists yet (Phase 5), and BatchSareeRow.bulkOrderRef has a real FK to a
  // bulk_orders table, so any non-existent ref would fail with a 500/FK error.
}

export const batchesApi = {
  list: (pageSize = 100) =>
    apiClient.get<PaginatedResponse<BackendBatch>>(`/batches?pageSize=${pageSize}`),

  create: (payload: CreateBatchPayload) => apiClient.post<BackendBatch>("/batches", payload),

  assignRow: (batchId: string, serial: number, payload: AssignBatchRowPayload) =>
    apiClient.patch<BackendBatchSareeRow>(`/batches/${batchId}/rows/${serial}`, payload),

  finalize: (batchId: string) => apiClient.post<BackendBatch>(`/batches/${batchId}/finalize`, {}),

  remove: (batchId: string) => apiClient.delete<void>(`/batches/${batchId}`),
};
