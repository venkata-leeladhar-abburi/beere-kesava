import { apiClient } from "./client";

export interface BackendRate {
  code: string;
  type: string;
  description: string | null;
  makingCharge: string;
  retailPrice: string;
  wholesalePrice: string;
  stdWeightG: string;
  warpWeightG: string;
  reshamWeightG: string;
  jariWeightG: string;
  updatedAt: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateRatePayload {
  code: string;
  type: string;
  description?: string;
  makingCharge: number;
  retailPrice: number;
  wholesalePrice: number;
  stdWeightG: number;
  warpWeightG: number;
  reshamWeightG: number;
  jariWeightG: number;
}

export type UpdateRatePayload = Partial<Omit<CreateRatePayload, "code">>;

export const ratesApi = {
  list: (pageSize = 100) =>
    apiClient.get<PaginatedResponse<BackendRate>>(`/rates?pageSize=${pageSize}`),
  create: (payload: CreateRatePayload) => apiClient.post<BackendRate>("/rates", payload),
  update: (code: string, payload: UpdateRatePayload) =>
    apiClient.patch<BackendRate>(`/rates/${encodeURIComponent(code)}`, payload),
};
