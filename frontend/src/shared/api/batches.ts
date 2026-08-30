import { apiClient } from "./client";
import { BackendQcResult } from "./qc";

export type BackendBatchStatus = "DRAFT" | "ACTIVE" | "COMPLETED";
export type BackendRecipientType = "WEAVER" | "FACTORY_LOOM";

/** Minimal identity of the staff member (any role) who performed an action, for attribution display. */
export interface BackendActorSummary {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

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
  /** Worker Staff who physically received this saree — undefined on endpoints that don't select it. */
  receivedByUser?: BackendActorSummary | null;
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
  /** Admin/staff who tallied this row — undefined on endpoints that don't select it. */
  talliedByUser?: BackendActorSummary | null;
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
  /** Who created this batch — undefined on endpoints that don't select it. */
  createdBy?: BackendActorSummary | null;
  /** Batch-level tally attribution — currently unset by any endpoint; only per-row talliedByUser is wired. */
  talliedBy?: BackendActorSummary | null;
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
  actorId?: string;
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
  /** Required whenever warpG/reshamG/jariReels are set — see BatchesService.receiveRow. */
  actorId?: string;
}

const BATCHES_MAX_PAGE_SIZE = 500;

export const batchesApi = {
  // Every caller (BatchContext etc.) treats this as "the full batch list" and
  // does its own filtering/derivation client-side over the whole set — a
  // single capped page silently dropped batches past the cap (e.g. older
  // completed batches), which looked like "completed batches aren't
  // showing." Walk every backend page and merge them so callers always see
  // every batch, not just the first pageSize.
  list: async (pageSize = BATCHES_MAX_PAGE_SIZE): Promise<PaginatedResponse<BackendBatch>> => {
    const first = await apiClient.get<PaginatedResponse<BackendBatch>>(`/batches?page=1&pageSize=${pageSize}`);
    const items = [...first.items];
    let page = 1;
    while (items.length < first.total) {
      page += 1;
      const next = await apiClient.get<PaginatedResponse<BackendBatch>>(`/batches?page=${page}&pageSize=${pageSize}`);
      if (next.items.length === 0) break;
      items.push(...next.items);
    }
    return { items, total: first.total, page: 1, pageSize: items.length };
  },

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
    payload: { tallied: boolean; weight?: number; warpG?: number; reshamG?: number; jariReels?: number },
  ) =>
    apiClient.patch<BackendBatchSareeRow>(`/batches/${batchId}/rows/${serial}/tally`, payload),

  finalize: (batchId: string) => apiClient.post<BackendBatch>(`/batches/${batchId}/finalize`, {}),

  remove: (batchId: string) => apiClient.delete<void>(`/batches/${batchId}`),
};
