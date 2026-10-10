import { apiClient } from "./client";

export type PurchasePaymentStatus = "PAID" | "PENDING" | "PARTIAL";
export type PurchaseDiscountType = "PERCENT" | "AMOUNT";

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
  /** Which pieces were returned, when known — see returnedPieceSet. */
  returnedPieceNos?: number[];
}

export interface BackendPurchase {
  id: string;
  supplierId: string | null;
  supplier: BackendPurchaseSupplier | null;
  supplierName: string | null;
  location: string | null;
  /** Firm.id this purchase is booked to; null on purchases older than the column. */
  firmId: string | null;
  firm: { id: string; firmName: string } | null;
  date: string;
  sareeCount: number;
  gstNumber: string | null;
  invoiceNumber: string | null;
  /** subtotal - discountAmount + gstAmount, calculated server-side. */
  billAmount: string;
  /** Null on purchases recorded before the bill was calculated (hand-typed bill). */
  subtotal: string | null;
  discountType: PurchaseDiscountType | null;
  discountValue: string;
  discountAmount: string;
  gstPercent: string;
  gstAmount: string;
  /** Follows the supplier payments linked to the purchase — never set by the form. */
  status: PurchasePaymentStatus;
  notes: string | null;
  invoiceFileName: string | null;
  /** Server-relative path in cloud storage ("/uploads/receipts/<uuid>.jpg"). */
  invoiceFileUrl: string | null;
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
  /** The stored line's id — sent on edits so the line is updated in place, not recreated. */
  id?: string;
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
  returnedPieceNos?: number[];
}

export interface CreatePurchasePayload {
  supplierId?: string;
  supplierName?: string;
  location?: string;
  /** Firm.id buying this purchase — required by the server on create. */
  firmId: string;
  date?: string;
  sareeCount?: number;
  gstNumber?: string;
  invoiceNumber?: string;
  // The bill is calculated server-side from the lines and these inputs.
  discountType?: PurchaseDiscountType | null;
  discountValue?: number;
  gstPercent?: number;
  notes?: string;
  invoiceFileName?: string;
  invoiceFileUrl?: string;
  addedById?: string;
  sarees: CreatePurchaseSareeLinePayload[];
}

export type UpdatePurchasePayload = Partial<Omit<CreatePurchasePayload, "sarees">> & {
  sarees?: CreatePurchaseSareeLinePayload[];
};

export const purchasesApi = {
  list: (
    pageSize = 100,
    page = 1,
    supplierId?: string,
    status?: PurchasePaymentStatus,
    view?: "full" | "summary"
  ) => {
    const params = new URLSearchParams({ pageSize: String(pageSize), page: String(page) });
    if (supplierId) params.set("supplierId", supplierId);
    if (status) params.set("status", status);
    if (view) params.set("view", view);
    return apiClient.get<PaginatedResponse<BackendPurchase>>(`/purchases?${params.toString()}`);
  },

  /** Always "full" — includes every sareeLine's photos, unlike list()'s "summary" view. */
  getOne: (id: string) => apiClient.get<BackendPurchase>(`/purchases/${id}`),

  create: (payload: CreatePurchasePayload) =>
    apiClient.post<BackendPurchase>("/purchases", payload),

  update: (id: string, payload: UpdatePurchasePayload) =>
    apiClient.patch<BackendPurchase>(`/purchases/${id}`, payload),

  remove: (id: string) => apiClient.delete<void>(`/purchases/${id}`),
};
