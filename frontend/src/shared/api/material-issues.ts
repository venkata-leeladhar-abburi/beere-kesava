import { apiClient } from "./client";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

/** signatureUrl comes back as a server-relative path (e.g. "/uploads/signatures/xxx.png"); resolve it against the API origin for <img src>. */
export function resolveSignatureUrl(signatureUrl: string | null): string | null {
  return signatureUrl ? `${API_BASE_URL}${signatureUrl}` : null;
}

export type BackendMaterialType = "WARP" | "RESHAM" | "JARI";
export type BackendWarpSubtype = "RESHAM_WARP" | "JARI_WARP";
export type BackendJariGrade = "G1" | "G2" | "G3" | "G4" | "G5";
export type BackendSignatureMethod = "HERE" | "REMOTE";
export type BackendMaterialIssueStatus = "PENDING_SIGNATURE" | "SIGNED" | "CANCELLED";

export interface BackendMaterialIssueItem {
  id: string;
  issueId: string;
  materialType: BackendMaterialType;
  warpSubtype: BackendWarpSubtype | null;
  quantity: string;
  unit: string;
  jariType: string | null;
  jariGrade: BackendJariGrade | null;
  jariColor: string | null;
  grnBatchId: string | null;
  grnItemId: string | null;
  /** The GRN line this was drawn from — its `itemCode` is the same id Receive Stock shows. Null for issuances recorded before per-line tracking existed. */
  grnItem?: {
    id: string;
    itemCode: string | null;
    name: string;
    description: string | null;
    quantity: string;
    unit: string;
  } | null;
}

export interface BackendMaterialIssueRecord {
  id: string;
  weaverId: string | null;
  /** `code` is the human-facing weaver ID (e.g. "Wea-003") — show this, not `weaverId` (a UUID). */
  weaver?: { code: string; name: string } | null;
  factoryLoomId: string | null;
  loomNumber: string | null;
  batchId: string | null;
  issuedById: string;
  issuedBy?: { firstName: string; lastName: string } | null;
  issuedAt: string;
  signatureMethod: BackendSignatureMethod | null;
  signatureCaptured: boolean;
  signatureTimestamp: string | null;
  signatureUrl: string | null;
  status: BackendMaterialIssueStatus;
  notes: string | null;
  warpRequestId: string | null;
  items: BackendMaterialIssueItem[];
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateMaterialIssueItemPayload {
  materialType: BackendMaterialType;
  warpSubtype?: BackendWarpSubtype;
  quantity: number;
  unit: string;
  jariType?: string;
  jariGrade?: BackendJariGrade;
  jariColor?: string;
  grnBatchId?: string;
  /** GrnItem.id of the exact received line this is drawn from. */
  grnItemId?: string;
}

export interface CreateMaterialIssuePayload {
  weaverId?: string;
  factoryLoomId?: string;
  loomNumber?: number;
  batchId?: string;
  issuedById: string;
  signatureMethod?: BackendSignatureMethod;
  notes?: string;
  warpRequestId?: string;
  items: CreateMaterialIssueItemPayload[];
}

export const materialIssuesApi = {
  list: (pageSize = 100) =>
    apiClient.get<PaginatedResponse<BackendMaterialIssueRecord>>(
      `/material-issues?pageSize=${pageSize}`,
    ),

  create: (payload: CreateMaterialIssuePayload) =>
    apiClient.post<BackendMaterialIssueRecord>("/material-issues", payload),

  // Signature is captured as a PNG blob from the on-screen canvas and
  // uploaded as multipart form data — the backend stores it on local disk
  // and returns a signatureUrl pointing at /uploads/signatures/....
  sign: (id: string, signature: Blob) => {
    const formData = new FormData();
    formData.append("signature", signature, "signature.png");
    return apiClient.postForm<BackendMaterialIssueRecord>(
      `/material-issues/${id}/sign`,
      formData,
    );
  },

  cancel: (id: string) => apiClient.post<BackendMaterialIssueRecord>(`/material-issues/${id}/cancel`, {}),

  remove: (id: string) => apiClient.delete<void>(`/material-issues/${id}`),
};
