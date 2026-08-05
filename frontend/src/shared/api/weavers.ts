import { apiClient } from "./client";

export type BackendWeaverStatus = "ACTIVE" | "INACTIVE";

export interface BackendWeaver {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  initials: string;
  village: string | null;
  cluster: string | null;
  looms: number;
  status: BackendWeaverStatus;
  photoUrl: string;
  email: string;
  phone: string;
  bankName: string | null;
  accountNo: string | null;
  ifsc: string | null;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateWeaverPayload {
  firstName: string;
  lastName: string;
  initials?: string;
  village?: string;
  cluster?: string;
  looms?: number;
  photoUrl: string;
  email: string;
  phone: string;
  bankName?: string;
  accountNo?: string;
  ifsc?: string;
}

export interface UpdateWeaverPayload extends Partial<CreateWeaverPayload> {
  status?: BackendWeaverStatus;
}

export const weaversApi = {
  list: (pageSize = 100) =>
    apiClient.get<PaginatedResponse<BackendWeaver>>(`/weavers?pageSize=${pageSize}`),

  findOne: (id: string) => apiClient.get<BackendWeaver>(`/weavers/${id}`),

  create: (payload: CreateWeaverPayload) => apiClient.post<BackendWeaver>("/weavers", payload),

  update: (id: string, payload: UpdateWeaverPayload) =>
    apiClient.patch<BackendWeaver>(`/weavers/${id}`, payload),
};
