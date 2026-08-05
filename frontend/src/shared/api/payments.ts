import { apiClient } from "./client";

export interface ImportRowError {
  row: number;
  message: string;
}

export interface ImportResult {
  created: number;
  failed: number;
  errors: ImportRowError[];
}

export interface StartImportResponse {
  jobId: string;
}

export interface ImportStatusResponse {
  jobId: string;
  state: "waiting" | "active" | "completed" | "failed" | "delayed" | "unknown";
  result?: ImportResult;
  failedReason?: string;
}

export const weaverPaymentsApi = {
  importExcel: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.postForm<StartImportResponse>("/payments/weavers/import", formData);
  },
  getImportStatus: (jobId: string) =>
    apiClient.get<ImportStatusResponse>(`/payments/weavers/import/${jobId}/status`),
};
