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

// Making charge (₹ per saree) for a rate row — the figure a weaver is paid
// per completed saree of this type. Consumers must read this instead of any
// hardcoded/mock per-type charge.
export function ratePerSaree(rate: Pick<BackendRate, "makingCharge">): number {
  return Number(rate.makingCharge);
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "1 week ago";
  if (weeks < 5) return `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  return months <= 1 ? "1 month ago" : `${months} months ago`;
}

// Shared BackendRate -> display-record conversion, used anywhere a saree
// type's full card (charge, retail/wholesale, weights) needs to be shown
// off real data instead of a hardcoded record.
export interface SareeTypeDisplayRecord {
  code: string; type: string; description: string;
  charge: string; retail: string; wholesale: string;
  stdWeight: string; warpWeight: string; reshamWeight: string; jariWeight: string;
  changed: string;
}

export function backendRateToDisplayRecord(backend: BackendRate): SareeTypeDisplayRecord {
  return {
    code: backend.code,
    type: backend.type,
    description: backend.description ?? "",
    charge: String(Math.round(Number(backend.makingCharge))),
    retail: String(Math.round(Number(backend.retailPrice))),
    wholesale: String(Math.round(Number(backend.wholesalePrice))),
    stdWeight: String(Math.round(Number(backend.stdWeightG))),
    warpWeight: String(Math.round(Number(backend.warpWeightG))),
    reshamWeight: String(Math.round(Number(backend.reshamWeightG))),
    jariWeight: String(Math.round(Number(backend.jariWeightG))),
    changed: timeAgo(backend.updatedAt),
  };
}
