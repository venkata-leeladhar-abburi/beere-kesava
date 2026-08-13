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
  receivedAt: string;
  signatureMethod: BackendSignatureMethod | null;
  signatureCaptured: boolean;
  signatureTimestamp: string | null;
  signatureUrl: string | null;
  status: BackendMaterialReturnStatus;
  deductionAmount: string | null;
  deductionReason: string | null;
  notes: string | null;
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
  issuedGrams: number;
  returnedGrams: number;
  outstandingGrams: number;
}

export const materialReturnsApi = {
  list: (pageSize = 100) =>
    apiClient.get<PaginatedResponse<BackendMaterialReturnRecord>>(
      `/material-returns?pageSize=${pageSize}`,
    ),

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

  getOutstanding: (params: { weaverId?: string; factoryLoomId?: string }) => {
    const query = new URLSearchParams();
    if (params.weaverId) query.set("weaverId", params.weaverId);
    if (params.factoryLoomId) query.set("factoryLoomId", params.factoryLoomId);
    return apiClient.get<OutstandingMaterialGroup[]>(`/material-returns/outstanding?${query.toString()}`);
  },
};
