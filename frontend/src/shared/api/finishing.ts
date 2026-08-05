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
  assignedDate: string;
  status: BackendFinishingAssignmentStatus;
  condition: BackendFinishingCondition | null;
  damageType: string | null;
  damageSeverity: BackendDamageSeverity | null;
  damageNotes: string | null;
  damagePhotoUrl: string | null;
  quotationRef: string | null;
  batchSareeRow: {
    batchId: string;
    designCode: string | null;
    design: { code: string; name: string } | null;
    weaver: { id: string; name: string } | null;
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
