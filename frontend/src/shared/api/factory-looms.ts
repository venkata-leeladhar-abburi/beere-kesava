import { apiClient } from "./client";

export type BackendLoomStatus = "ACTIVE" | "IDLE" | "MAINTENANCE";

export interface BackendFactoryLoom {
  id: string;
  /** Human-facing sequential id, e.g. "Loom-001" — assigned server-side. */
  code: string | null;
  loomNumber: string;
  location: string | null;
  operatorName: string | null;
  operatorPhone: string | null;
  status: BackendLoomStatus;
  installedYear: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateFactoryLoomPayload {
  /** Optional — the server generates both the loom number and the display code
   * ("Loom-002") when it isn't supplied, which is how the UI creates looms. */
  loomNumber?: string;
  location?: string;
  operatorName?: string;
  operatorPhone?: string;
  installedYear?: number;
  notes?: string;
}

// status is settable via update but not accepted on create (defaults to ACTIVE server-side).
export interface UpdateFactoryLoomPayload extends Omit<CreateFactoryLoomPayload, "loomNumber"> {
  status?: BackendLoomStatus;
}

export const factoryLoomsApi = {
  list: (pageSize = 100) =>
    apiClient.get<PaginatedResponse<BackendFactoryLoom>>(`/factory-looms?pageSize=${pageSize}`),

  create: (payload: CreateFactoryLoomPayload) =>
    apiClient.post<BackendFactoryLoom>("/factory-looms", payload),

  update: (id: string, payload: UpdateFactoryLoomPayload) =>
    apiClient.patch<BackendFactoryLoom>(`/factory-looms/${id}`, payload),
};
