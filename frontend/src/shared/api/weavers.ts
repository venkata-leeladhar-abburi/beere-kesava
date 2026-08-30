import { apiClient } from "./client";

/**
 * Shared React Query key for the unfiltered weaver roster (the full-list
 * lookup used to decorate ids with name/code/village, not a paginated
 * directory view). Several contexts on the weaver portal — BatchContext,
 * WeaverPaymentsContext, useCurrentWeaver — each need this same roster
 * purely as a lookup table; routing all of them through
 * queryClient.fetchQuery(WEAVERS_LIST_QUERY_KEY, ...) lets React Query
 * dedupe concurrent requests and share one cached result instead of each
 * firing its own independent GET /weavers on every portal load.
 */
export const WEAVERS_LIST_QUERY_KEY = ["weavers", "list"] as const;

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
  /**
   * Sarees handed in and received but not yet inspected. This is the signal
   * behind the "Submitted — Waiting Quality Check" state; without it a weaver
   * could only ever read as active or idle.
   */
  awaitingQcCount: number;
  materialIssueCount: number;
  /** Most recent QC inspection or saree receipt (ISO), null if never. */
  lastActivityAt: string | null;
}

/** One month of firm-wide output, oldest first. */
export interface BackendWeaverProductionSeriesPoint {
  /** "YYYY-MM" */
  month: string;
  produced: number;
  passed: number;
}

/** Optional window for the production/QC aggregates; omit for all-time. */
export interface WeaverStatsRange {
  from?: string;
  to?: string;
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

function statsQuery(range?: WeaverStatsRange): string {
  if (!range?.from && !range?.to) return "";
  const q = new URLSearchParams();
  if (range.from) q.set("from", range.from);
  if (range.to) q.set("to", range.to);
  return `?${q.toString()}`;
}

export const weaversApi = {
  // Same class of bug as batchesApi.list/materialIssuesApi.list: a single
  // capped page (server max 500) silently dropped weavers past it, which
  // could make useCurrentWeaver.ts fail to resolve a real weaver (e.g. by
  // name/code) purely because their record fell on a later page. Walk every
  // page and merge.
  list: async (pageSize = 500): Promise<PaginatedResponse<BackendWeaver>> => {
    const first = await apiClient.get<PaginatedResponse<BackendWeaver>>(`/weavers?page=1&pageSize=${pageSize}`);
    const items = [...first.items];
    let page = 1;
    while (items.length < first.total) {
      page += 1;
      const next = await apiClient.get<PaginatedResponse<BackendWeaver>>(`/weavers?page=${page}&pageSize=${pageSize}`);
      if (next.items.length === 0) break;
      items.push(...next.items);
    }
    return { items, total: first.total, page: 1, pageSize: items.length };
  },

  findOne: (id: string) => apiClient.get<BackendWeaver>(`/weavers/${id}`),

  create: (payload: CreateWeaverPayload) => apiClient.post<BackendWeaver>("/weavers", payload),

  update: (id: string, payload: UpdateWeaverPayload) =>
    apiClient.patch<BackendWeaver>(`/weavers/${id}`, payload),

  remove: (id: string) => apiClient.delete<void>(`/weavers/${id}`),

  /** Live stats: QC pass rate, active batch row count, material issue count, total sarees woven. */
  getStats: (id: string, range?: WeaverStatsRange) =>
    apiClient.get<BackendWeaverStats>(`/weavers/${id}/stats${statsQuery(range)}`),

  /**
   * Every weaver's stats in ONE request. Prefer this over mapping getStats
   * across the roster — that fired a request per weaver on every directory,
   * analytics and dashboard mount, and the two go out of sync whenever one
   * caller forgets a parameter.
   */
  getAllStats: (range?: WeaverStatsRange) =>
    apiClient.get<BackendWeaverStats[]>(`/weavers/stats${statsQuery(range)}`),

  /** Firm-wide monthly output for the trailing window (default 12 months). */
  getProductionSeries: (months?: number) =>
    apiClient.get<BackendWeaverProductionSeriesPoint[]>(
      `/weavers/production-series${months ? `?months=${months}` : ""}`,
    ),

  /** Top-10 leaderboard of active weavers ranked by QC pass rate. */
  getLeaderboard: () =>
    apiClient.get<BackendWeaverLeaderboardEntry[]>(`/weavers/leaderboard`),

  /** Top-5 leaderboard of weavers ranked by production volume within a trailing window (default 6 months). */
  getProductionLeaderboard: (months?: number) =>
    apiClient.get<BackendWeaverProductionLeaderboardEntry[]>(
      `/weavers/production-leaderboard${months ? `?months=${months}` : ""}`,
    ),
};
