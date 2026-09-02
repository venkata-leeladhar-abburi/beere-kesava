import { apiClient } from "./client";

export type BackendQcResult = "PASSED" | "SEMI" | "DEFECTIVE";

export interface BackendQcRecord {
  id: string;
  sareeId: string;
  weaverId: string | null;
  factoryLoomId: string | null;
  batchId: string | null;
  result: BackendQcResult;
  defects: string[];
  makingCharge: string;
  deduction: string;
  payable: string;
  receivedDate: string;
  qcDate: string;
  photoUrl: string | null;
  notes: string | null;
  inspectedById: string;
  /** Real name of who performed the check — joined server-side from the User relation. */
  inspectedBy?: { firstName: string; lastName: string } | null;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateQcRecordPayload {
  sareeId: string;
  result: BackendQcResult;
  defects?: string[];
  // Only meaningful for a "semi" result — server clamps to [0, makingCharge].
  semiDeduction?: number;
  notes?: string;
  photoUrl?: string;
  receivedDaysAgo?: number;
  inspectedById: string;
}

export interface BackendReadyForFinishingRecord extends BackendQcRecord {
  batchSareeRow: {
    sareeId: string | null;
    designCode: string | null;
    sareeTypeCode: string | null;
    bulkOrderRef: string | null;
    design: { code: string; name: string } | null;
    sareeType: { code: string; type: string } | null;
    weaver: { id: string; name: string } | null;
  };
}

export const qcApi = {
  list: (pageSize = 500) => apiClient.get<PaginatedResponse<BackendQcRecord>>(`/qc?pageSize=${pageSize}`),

  findOne: (sareeId: string) => apiClient.get<BackendQcRecord>(`/qc/${sareeId}`),

  readyForFinishing: () => apiClient.get<BackendReadyForFinishingRecord[]>("/qc/ready-for-finishing"),

  create: (payload: CreateQcRecordPayload) => apiClient.post<BackendQcRecord>("/qc", payload),

  // Adds or revises the deduction on an existing verdict — entering one at
  // inspection time is optional, so Defective History can set it afterwards.
  updateDeduction: (id: string, payload: { deduction: number; actorId?: string }) =>
    apiClient.patch<BackendQcRecord>(`/qc/${id}/deduction`, payload),
};
