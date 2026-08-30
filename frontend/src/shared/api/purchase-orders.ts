import { apiClient } from "./client";

export interface BackendPurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  vendor: { id: string; code: string | null; name: string; city: string | null; contactName: string | null };
  firmId: string | null;
  firm?: { id: string; firmName: string } | null;
  deliveryDate: string | null;
  totalValue: string;
  urgency: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "RECEIVED";
  grnId: string | null;
  rejectionReason: string | null;
  createdAt: string;
  createdBy?: { firstName: string; lastName: string } | null;
  items?: {
    id: string;
    materialType: string;
    name: string;
    /** Color/grade/quality notes entered when the PO was raised. */
    description: string | null;
    quantity: number;
    unit: string;
    unitPrice: string | null;
    totalPrice: string | null;
    /** Set once the vendor's real bill splits an amount to this material line. */
    invoicedAmount: string | null;
  }[];
  /** Real FK to the GrnReceipt this order was received against — `grnId` is a
   *  display string that may predate the link. Null until goods arrive. */
  grnReceiptId?: string | null;
  grnReceipt?: {
    /** The receipt's own human-facing id, e.g. "GRN-SreeVignesh-004-002". */
    id: string;
    receivedDate?: string | null;
    receivedBy?: { id: string; firstName: string; lastName: string } | null;
    /** The firm the goods were actually received for — previously hardcoded
     *  to "Beere Kesava Silks (Head Firm)" on the vendor screen. */
    firm?: { id: string; firmName: string } | null;
    /** Real prices actually paid at receipt — the fallback source when a PO
     *  line was raised without a price entered. */
    items?: {
      id: string;
      /** Per-line receipt id, e.g. "GRN-SreeVignesh-004-002-1" — the id printed
       *  on this material's barcode label. Null on pre-per-line-code rows. */
      itemCode?: string | null;
      /** The ordered line this arrived against — the exact link, recorded at the
       *  receiving desk. Null for ad-hoc receipts and rows predating the column. */
      poItemId?: string | null;
      materialType: string;
      name: string;
      quantity: number;
      unit?: string | null;
      unitPrice: string;
      totalPrice: string;
    }[];
  } | null;
}

export interface CreatePurchaseOrderPayload {
  actorId?: string;
  vendorId: string;
  /** Purchasing firm this order is raised under — carried onto the GRN when the goods arrive. */
  firmId?: string;
  deliveryDate?: string;
  totalValue?: number;
  urgency?: string;
  items?: {
    materialType: string;
    name: string;
    description?: string;
    quantity: number;
    unit?: string;
    unitPrice?: number;
  }[];
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const purchaseOrdersApi = {
  list: (pageSize = 100) =>
    apiClient.get<PaginatedResponse<BackendPurchaseOrder>>(`/purchase-orders?pageSize=${pageSize}`),
  create: (payload: CreatePurchaseOrderPayload) =>
    apiClient.post<BackendPurchaseOrder>("/purchase-orders", payload),
  approve: (id: string, actorId?: string) =>
    apiClient.post<BackendPurchaseOrder>(`/purchase-orders/${id}/approve`, { actorId }),
  reject: (id: string, reason?: string, actorId?: string) =>
    apiClient.post<BackendPurchaseOrder>(`/purchase-orders/${id}/reject`, { reason, actorId }),
  receiveGrn: (id: string, payload: { grnReceiptId?: string; actorId?: string } = {}) =>
    apiClient.post<BackendPurchaseOrder>(`/purchase-orders/${id}/grn`, payload),
  remove: (id: string) => apiClient.delete<void>(`/purchase-orders/${id}`),
};
