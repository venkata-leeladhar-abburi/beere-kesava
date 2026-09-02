import { apiClient } from "./client";
import { BackendJariGrade, BackendMaterialType, BackendSignatureMethod, BackendWarpSubtype } from "./material-issues";

export type BackendMaterialReturnStatus = "PENDING_SIGNATURE" | "APPROVED" | "CANCELLED";

export interface BackendMaterialReturnItem {
  id: string;
  returnId: string;
  materialType: BackendMaterialType;
  warpSubtype: BackendWarpSubtype | null;
  quantity: string;
  unit: string;
  jariType: string | null;
  jariGrade: BackendJariGrade | null;
  jariColor: string | null;
}

export interface BackendMaterialReturnRecord {
  id: string;
  weaverId: string | null;
  factoryLoomId: string | null;
  loomNumber: string | null;
  batchId: string | null;
  receivedById: string;
  receivedBy: { id: string; firstName: string; lastName: string } | null;
  receivedAt: string;
  signatureMethod: BackendSignatureMethod | null;
  signatureCaptured: boolean;
  signatureTimestamp: string | null;
  signatureUrl: string | null;
  status: BackendMaterialReturnStatus;
  deductionAmount: string | null;
  deductionReason: string | null;
  notes: string | null;
  // True only for the synthetic records the backend creates when a saree is
  // received (material never physically left the saree) — no weaver returned
  // anything, so these must never be shown as a real "weaver return".
  isAutoRecorded: boolean;
  items: BackendMaterialReturnItem[];
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateMaterialReturnItemPayload {
  materialType: BackendMaterialType;
  warpSubtype?: BackendWarpSubtype;
  quantity: number;
  unit: string;
  jariType?: string;
  jariGrade?: BackendJariGrade;
  jariColor?: string;
}

export interface CreateMaterialReturnPayload {
  weaverId?: string;
  factoryLoomId?: string;
  loomNumber?: number;
  batchId?: string;
  receivedById: string;
  signatureMethod?: BackendSignatureMethod;
  deductionAmount?: number;
  deductionReason?: string;
  notes?: string;
  items: CreateMaterialReturnItemPayload[];
}

export interface OutstandingMaterialGroup {
  materialType: BackendMaterialType;
  warpSubtype: BackendWarpSubtype | null;
  jariType: string | null;
  jariGrade: BackendJariGrade | null;
  jariColor: string | null;
  grnBatchId: string | null;
  grnItemCode: string | null;
  description: string | null;
  unit: string;
  issueIds: string[];
  issuedGrams: number;
  returnedGrams: number;
  outstandingGrams: number;
}

export const materialReturnsApi = {
  // Same class of bug as batchesApi.list/materialIssuesApi.list: server caps
  // pageSize at 100, and this now directly backs every weaver's "Material
  // Still With You" outstanding balance (MaterialIssueContext.tsx) — a
  // dropped page here would silently understate how much material has come
  // back. Walk every page and merge.
  list: async (pageSize = 100): Promise<PaginatedResponse<BackendMaterialReturnRecord>> => {
    const first = await apiClient.get<PaginatedResponse<BackendMaterialReturnRecord>>(
      `/material-returns?page=1&pageSize=${pageSize}`,
    );
    const items = [...first.items];
    let page = 1;
    while (items.length < first.total) {
      page += 1;
      const next = await apiClient.get<PaginatedResponse<BackendMaterialReturnRecord>>(
        `/material-returns?page=${page}&pageSize=${pageSize}`,
      );
      if (next.items.length === 0) break;
      items.push(...next.items);
    }
    return { items, total: first.total, page: 1, pageSize: items.length };
  },

  create: (payload: CreateMaterialReturnPayload) =>
    apiClient.post<BackendMaterialReturnRecord>("/material-returns", payload),

  // Same on-screen-canvas-to-multipart pattern as materialIssuesApi.sign.
  sign: (id: string, signature: Blob) => {
    const formData = new FormData();
    formData.append("signature", signature, "signature.png");
    return apiClient.postForm<BackendMaterialReturnRecord>(
      `/material-returns/${id}/sign`,
      formData,
    );
  },

  cancel: (id: string) => apiClient.post<BackendMaterialReturnRecord>(`/material-returns/${id}/cancel`, {}),

  remove: (id: string) => apiClient.delete<void>(`/material-returns/${id}`),

  // loomNumber/batchId narrow the balance to one loom or one batch of the
  // selected recipient — both sides (issued and returned) are scoped, so the
  // figures stay internally consistent at every zoom level.
  getOutstanding: (params: { weaverId?: string; factoryLoomId?: string; loomNumber?: string; batchId?: string }) => {
    const query = new URLSearchParams();
    if (params.weaverId) query.set("weaverId", params.weaverId);
    if (params.factoryLoomId) query.set("factoryLoomId", params.factoryLoomId);
    if (params.loomNumber) query.set("loomNumber", params.loomNumber);
    if (params.batchId) query.set("batchId", params.batchId);
    return apiClient.get<OutstandingMaterialGroup[]>(`/material-returns/outstanding?${query.toString()}`);
  },
};
