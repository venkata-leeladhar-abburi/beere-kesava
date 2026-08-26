import { apiClient } from "./client";

export interface BackendDesign {
  code: string;
  name: string;
  typeCode: string;
  typeName: string;
  description: string | null;
  color: string | null;
  weaverId: string | null;
  notesForWeaver: string | null;
  colorSlipPhotoUrl: string | null;
  designGraphUrl: string | null;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateDesignPayload {
  code: string;
  name: string;
  typeCode: string;
  typeName: string;
  description?: string;
  color?: string;
  notesForWeaver?: string;
  /** Server-relative path from POST /uploads/photo — never a base64 data URL. */
  colorSlipPhotoUrl?: string;
  designGraphUrl?: string;
}

export type UpdateDesignPayload = Partial<Omit<CreateDesignPayload, "code">>;

export const designLibraryApi = {
  list: (pageSize = 100) =>
    apiClient.get<PaginatedResponse<BackendDesign>>(`/design-library?pageSize=${pageSize}`),

  create: (payload: CreateDesignPayload) =>
    apiClient.post<BackendDesign>("/design-library", payload),

  update: (code: string, payload: UpdateDesignPayload) =>
    apiClient.patch<BackendDesign>(`/design-library/${encodeURIComponent(code)}`, payload),
};
