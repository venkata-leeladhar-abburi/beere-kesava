import { apiClient } from "./client";

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ─── Finishing staff ────────────────────────────────────────────────────────
export type BackendActiveStatus = "ACTIVE" | "INACTIVE";

export interface BackendFinishingStaff {
  id: string;
  empId: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email: string | null;
  specialisation: string | null;
  notes: string | null;
  status: BackendActiveStatus;
  createdAt: string;
}

export interface CreateFinishingStaffPayload {
  firstName: string;
  lastName: string;
  mobile: string;
  email?: string;
  specialisation?: string;
  notes?: string;
}

export interface UpdateFinishingStaffPayload extends Partial<CreateFinishingStaffPayload> {
  status?: BackendActiveStatus;
}

export const finishingStaffApi = {
  list: (pageSize = 100) =>
    apiClient.get<PaginatedResponse<BackendFinishingStaff>>(`/finishing/staff?pageSize=${pageSize}`),

  create: (payload: CreateFinishingStaffPayload) =>
    apiClient.post<BackendFinishingStaff>("/finishing/staff", payload),

  update: (id: string, payload: UpdateFinishingStaffPayload) =>
    apiClient.patch<BackendFinishingStaff>(`/finishing/staff/${id}`, payload),

  remove: (id: string) => apiClient.delete<void>(`/finishing/staff/${id}`),
};

// ─── Finishing assignments ──────────────────────────────────────────────────
export type BackendFinishingAssignmentStatus = "AWAITING_RETURN" | "RETURNED";
export type BackendFinishingCondition = "PERFECT" | "DAMAGED";
export type BackendDamageSeverity = "MINOR" | "MODERATE" | "SEVERE";

export interface BackendFinishingAssignment {
  id: string;
  sareeId: string;
  designCode: string | null;
  sareeType: string | null;
  finishingStaffId: string;
  assignedById: string;
  assignedBy?: { id: string; firstName: string; lastName: string } | null;
  assignedDate: string;
  status: BackendFinishingAssignmentStatus;
  condition: BackendFinishingCondition | null;
  damageType: string | null;
  damageSeverity: BackendDamageSeverity | null;
  damageNotes: string | null;
  damagePhotoUrl: string | null;
  quotationRef: string | null;
  quotation: { quotationNumber: string } | null;
  /** Last write to the row — the closest thing the backend has to a
   *  "returned at" timestamp for a RETURNED assignment. */
  updatedAt: string;
  batchSareeRow: {
    batchId: string;
    designCode: string | null;
    design: { code: string; name: string } | null;
    sareeTypeCode: string | null;
    weaver: { id: string; name: string } | null;
    /** Latest QC verdict only (backend takes 1, newest first). Sent as an
     *  array — it was typed as a singular `qcRecord` here, which never
     *  existed on the payload, so every consumer read `undefined`. */
    qcRecords: { result: "PASSED" | "SEMI" | "DEFECTIVE" }[];
  };
  finishingStaff: BackendFinishingStaff;
}

export interface CreateFinishingAssignmentPayload {
  sareeIds: string[];
  finishingStaffId: string;
  assignedById: string;
  quotationRef?: string;
}

export interface ReceiveFinishingReturnPayload {
  condition: BackendFinishingCondition;
  damageType?: string;
  damageSeverity?: BackendDamageSeverity;
  damageNotes?: string;
  damagePhotoUrl?: string;
}

export const finishingAssignmentsApi = {
  list: (pageSize = 100) =>
    apiClient.get<PaginatedResponse<BackendFinishingAssignment>>(
      `/finishing/assignments?pageSize=${pageSize}`,
    ),

  create: (payload: CreateFinishingAssignmentPayload) =>
    apiClient.post<BackendFinishingAssignment[]>("/finishing/assignments", payload),

  receiveReturn: (id: string, payload: ReceiveFinishingReturnPayload) =>
    apiClient.post<BackendFinishingAssignment>(`/finishing/assignments/${id}/receive`, payload),
};
