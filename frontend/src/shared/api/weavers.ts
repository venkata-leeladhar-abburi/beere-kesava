import { apiClient } from "./client";

export type BackendWeaverStatus = "ACTIVE" | "INACTIVE";

export interface BackendWeaver {
  id: string;
  /** Human-facing weaver ID (e.g. "Wea-001") — gap-filled against current weaver count, reused after a delete. Distinct from `id`. */
  code: string;
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
  createdAt: string;
}

/** Live performance metrics returned by GET /weavers/:id/stats */
export interface BackendWeaverStats {
  weaverId: string;
  totalSareesWoven: number;
  qcPassCount: number;
  /** Percentage 0-100, one decimal place */
  qcPassRate: number;
  activeBatchRowsCount: number;
  materialIssueCount: number;
}

/** Entry in the GET /weavers/leaderboard response */
export interface BackendWeaverLeaderboardEntry {
  weaverId: string;
  name: string;
  initials: string;
  photoUrl: string;
  village: string | null;
  totalSareesWoven: number;
  qcPassRate: number;
}

/** Entry in the GET /weavers/production-leaderboard response */
export interface BackendWeaverProductionLeaderboardEntry {
  weaverId: string;
  name: string;
  initials: string;
  photoUrl: string;
  village: string | null;
  sareesProduced: number;
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

  remove: (id: string) => apiClient.delete<void>(`/weavers/${id}`),

  /** Live stats: QC pass rate, active batch row count, material issue count, total sarees woven. */
  getStats: (id: string) =>
    apiClient.get<BackendWeaverStats>(`/weavers/${id}/stats`),

  /** Top-10 leaderboard of active weavers ranked by QC pass rate. */
  getLeaderboard: () =>
    apiClient.get<BackendWeaverLeaderboardEntry[]>(`/weavers/leaderboard`),

  /** Top-5 leaderboard of weavers ranked by production volume within a trailing window (default 6 months). */
  getProductionLeaderboard: (months?: number) =>
    apiClient.get<BackendWeaverProductionLeaderboardEntry[]>(
      `/weavers/production-leaderboard${months ? `?months=${months}` : ""}`,
    ),
};
