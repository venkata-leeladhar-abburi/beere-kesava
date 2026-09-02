import { apiClient } from "./client";

export interface BackendDesignDispatch {
  id: string;
  recipientType: "WEAVER" | "FACTORY_LOOM";
  recipientId: string;
  recipientName: string;
  instructions: string;
  colorSlipImageUrl: string | null;
  designGraphImageUrl: string | null;
  batches: string[];
  sentAt: string;
}

export const designDispatchesApi = {
  create: (data: {
    recipientType: "WEAVER" | "FACTORY_LOOM";
    recipientId: string;
    recipientName: string;
    instructions: string;
    colorSlipImageUrl?: string | null;
    designGraphImageUrl?: string | null;
    batches: string[];
  }) => apiClient.post<BackendDesignDispatch>("/design-dispatches", data),

  list: (params?: { page?: number; pageSize?: number }) => {
    const qs = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : "";
    return apiClient.get<{ items: BackendDesignDispatch[]; total: number; page: number; pageSize: number }>(`/design-dispatches${qs}`);
  },

  listByWeaver: (weaverId: string) =>
    apiClient.get<BackendDesignDispatch[]>(`/design-dispatches/weaver/${weaverId}`),

  update: (
    id: string,
    data: {
      instructions?: string;
      colorSlipImageUrl?: string | null;
      designGraphImageUrl?: string | null;
    },
  ) => apiClient.patch<BackendDesignDispatch>(`/design-dispatches/${id}`, data),

  delete: (id: string) => apiClient.delete(`/design-dispatches/${id}`),
};
