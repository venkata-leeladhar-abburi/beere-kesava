import { apiClient } from "./client";

export type PurchasePaymentStatus = "PAID" | "PENDING" | "PARTIAL";

export interface BackendPurchaseSupplier {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  gstCode: string | null;
}

export interface BackendPurchaseSareeLine {
  id: string;
  purchaseId: string;
  code: string;
  weight: string | null;
  sareeDate: string | null;
  sareeType: string | null;
  color: string | null;
  price: string;
  sellPercent: string;
  quantity: number;
  finalAmount: string;
  notes: string | null;
  imageUrl: string | null;
  pieceImageUrls: string[];
  returnedQuantity: number;
}

export interface BackendPurchase {
  id: string;
  supplierId: string | null;
  supplier: BackendPurchaseSupplier | null;
  supplierName: string | null;
  location: string | null;
  date: string;
  sareeCount: number;
  gstNumber: string | null;
  invoiceNumber: string | null;
  billAmount: string;
  status: PurchasePaymentStatus;
  notes: string | null;
  invoiceFileName: string | null;
  addedById: string | null;
  sareeLines: BackendPurchaseSareeLine[];
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreatePurchaseSareeLinePayload {
  code?: string;
  weight?: string;
  date?: string;
  sareeType?: string;
  color?: string;
  price: number;
  sellPercent?: number;
  quantity?: number;
  finalAmount?: number;
  notes?: string;
  imageUrl?: string;
  pieceImageUrls?: string[];
  returnedQuantity?: number;
}

export interface CreatePurchasePayload {
  supplierId?: string;
  supplierName?: string;
  location?: string;
  date?: string;
  sareeCount?: number;
  gstNumber?: string;
  invoiceNumber?: string;
  billAmount: number;
  status?: PurchasePaymentStatus;
  notes?: string;
  invoiceFileName?: string;
  addedById?: string;
  sarees: CreatePurchaseSareeLinePayload[];
}

export type UpdatePurchasePayload = Partial<Omit<CreatePurchasePayload, "sarees" | "billAmount">> & {
  billAmount?: number;
  sarees?: CreatePurchaseSareeLinePayload[];
};

export const purchasesApi = {
  list: (pageSize = 100, page = 1, supplierId?: string, status?: PurchasePaymentStatus) => {
    const params = new URLSearchParams({ pageSize: String(pageSize), page: String(page) });
    if (supplierId) params.set("supplierId", supplierId);
    if (status) params.set("status", status);
    return apiClient.get<PaginatedResponse<BackendPurchase>>(`/purchases?${params.toString()}`);
  },

  create: (payload: CreatePurchasePayload) => apiClient.post<BackendPurchase>("/purchases", payload),

  update: (id: string, payload: UpdatePurchasePayload) =>
    apiClient.patch<BackendPurchase>(`/purchases/${id}`, payload),

  remove: (id: string) => apiClient.delete<void>(`/purchases/${id}`),
};
