import { apiClient } from "./client";
import { BackendQcResult } from "./qc";

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
  receivedAt: string | null;
  receivedWeight: string | null;
  receivedColor: string | null;
  receivedPhotoUrl: string | null;
  // Actual material split entered at receipt (warp/resham in grams, jari in
  // reels) — Worker Staff's entry, not a re-derived estimate.
  receivedWarpG: string | null;
  receivedReshamG: string | null;
  receivedJariReels: string | null;
  // Admin's per-saree weight/material verification against the received
  // entry above — distinct from BulkOrder.tallied (order-level count check).
  tallied: boolean;
  talliedBy: string | null;
  talliedAt: string | null;
  finishingAssignment: { status: string; updatedAt: string } | null;
  // Latest QC verdict only (newest-first, capped at one server-side). A saree
  // gets a fresh record each round, because a SEMI verdict sends it back to
  // the weaver for rework and it is inspected again once received back.
  // Optional: endpoints other than list/findOne (create, assignRow, finalize)
  // return rows without it.
  qcRecords?: { result: BackendQcResult; qcDate: string }[];
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
  bulkOrderRef?: string;
  loomNumber?: number;
}

export interface AssignBatchRowsPayload {
  rows: (AssignBatchRowPayload & { serial: number })[];
}

export interface ReceiveBatchRowPayload {
  weight: number;
  color?: string;
  photoUrl?: string;
  warpG?: number;
  reshamG?: number;
  jariReels?: number;
  /** Retail selling price for this specific saree, overriding the type's shared rate. */
  sellingPrice?: number;
}

export const batchesApi = {
  list: (pageSize = 100) =>
    apiClient.get<PaginatedResponse<BackendBatch>>(`/batches?pageSize=${pageSize}`),

  create: (payload: CreateBatchPayload) => apiClient.post<BackendBatch>("/batches", payload),

  assignRow: (batchId: string, serial: number, payload: AssignBatchRowPayload) =>
    apiClient.patch<BackendBatchSareeRow>(`/batches/${batchId}/rows/${serial}`, payload),

  // Bulk counterpart — assigns every row in one request instead of the
  // caller looping one PATCH per row (see BatchContext.tsx saveDraftMutation).
  assignRows: (batchId: string, payload: AssignBatchRowsPayload) =>
    apiClient.patch<BackendBatch>(`/batches/${batchId}/rows`, payload),

  receiveRow: (batchId: string, serial: number, payload: ReceiveBatchRowPayload) =>
    apiClient.patch<BackendBatchSareeRow>(`/batches/${batchId}/rows/${serial}/receive`, payload),

  tallyRow: (
    batchId: string,
    serial: number,
    payload: { tallied: boolean; talliedBy?: string; weight?: number; warpG?: number; reshamG?: number; jariReels?: number },
  ) =>
    apiClient.patch<BackendBatchSareeRow>(`/batches/${batchId}/rows/${serial}/tally`, payload),

  finalize: (batchId: string) => apiClient.post<BackendBatch>(`/batches/${batchId}/finalize`, {}),

  remove: (batchId: string) => apiClient.delete<void>(`/batches/${batchId}`),
};
