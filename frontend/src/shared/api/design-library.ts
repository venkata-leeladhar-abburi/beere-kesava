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
}

export const designLibraryApi = {
  list: (pageSize = 100) =>
    apiClient.get<PaginatedResponse<BackendDesign>>(`/design-library?pageSize=${pageSize}`),

  create: (payload: CreateDesignPayload) =>
    apiClient.post<BackendDesign>("/design-library", payload),
};
