import { apiClient } from "./client";

export type BackendSupplierReturnStatus = "PENDING" | "APPROVED" | "PARTIALLY_APPROVED" | "REJECTED" | "CANCELLED";

export interface BackendSupplierReturnRequest {
  id: string;
  purchaseId: string;
  purchase: { id: string; supplierName: string | null; invoiceNumber: string | null };
  supplierId: string;
  supplier: { id: string; name: string; code: string | null };
  sareeLineId: string;
  sareeLine: BackendReturnSareeLine;
  quantity: number;
  /** Set when the request was raised under a debit note — decide it there. */
  debitNoteId: string | null;
  /** 1-based piece positions picked for return; empty on legacy requests. */
  pieceNos: number[];
  approvedPieceNos: number[];
  /** Null while PENDING. */
  approvedQuantity: number | null;
  reason: string | null;
  status: BackendSupplierReturnStatus;
  requestedById: string;
  requestedBy: { id: string; firstName: string; lastName: string };
  decidedById: string | null;
  decidedBy: { id: string; firstName: string; lastName: string } | null;
  decidedAt: string | null;
  decisionNote: string | null;
  createdAt: string;
}

export interface BackendReturnSareeLine {
  id: string;
  code: string;
  sareeType: string | null;
  color: string | null;
  weight?: string | null;
  /** Decimal — arrives as a string. Buying price per piece. */
  price?: string | number;
  quantity: number;
  returnedQuantity: number;
  imageUrl: string | null;
}

type BackendUserRef = { id: string; firstName: string; lastName: string };

export interface BackendSupplierDebitNote {
  id: string;
  purchaseId: string;
  purchase: { id: string; supplierName: string | null; invoiceNumber: string | null; gstNumber: string | null; date: string };
  supplierId: string;
  supplier: { id: string; name: string; code: string | null; city: string | null; address: string | null; phone: string | null; gstCode: string | null };
  reason: string | null;
  status: BackendSupplierReturnStatus;
  requestedById: string;
  requestedBy: BackendUserRef;
  decidedById: string | null;
  decidedBy: BackendUserRef | null;
  decidedAt: string | null;
  decisionNote: string | null;
  createdAt: string;
  requests: (Omit<BackendSupplierReturnRequest, "purchase" | "supplier" | "requestedBy" | "decidedBy">)[];
}

export interface CreateSupplierDebitNotePayload {
  purchaseId: string;
  lines: { sareeLineId: string; pieceNos: number[] }[];
  reason?: string;
}

export interface DecideSupplierDebitNotePayload {
  /** One entry per line; a line left out, or with no pieces, is rejected. */
  lines: { requestId: string; approvedPieceNos: number[] }[];
  decisionNote?: string;
}

export interface CreateSupplierReturnRequestPayload {
  purchaseId: string;
  sareeLineId: string;
  quantity: number;
  reason?: string;
}

export interface DecideSupplierReturnRequestPayload {
  decision: "APPROVED" | "REJECTED";
  decisionNote?: string;
}

export type ReturnablePieceStatus = "AVAILABLE" | "PENDING" | "RETURNED";

/** One purchase line found by GET /supplier-debit-notes/lookup, with every piece's return status. */
export interface ReturnableLine {
  lineId: string;
  lineCode: string;
  sareeType: string | null;
  color: string | null;
  weight: string | null;
  /** Buying price per piece, in rupees. */
  price: number;
  quantity: number;
  imageUrl: string | null;
  sareeDate: string | null;
  purchase: { id: string; invoiceNumber: string | null; gstNumber: string | null; date: string };
  /** Null for a purchase from an unregistered supplier — those can't be returned. */
  supplier: { id: string; name: string; code: string | null; city: string | null; phone: string | null } | null;
  supplierName: string | null;
  pieces: { pieceNo: number; code: string; status: ReturnablePieceStatus; debitNoteId: string | null; imageUrl: string | null }[];
  /** Set when the query was one exact piece tag. */
  matchedPieceNo: number | null;
  match: "PIECE" | "LINE" | "SEARCH";
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const supplierReturnsApi = {
  list: (params: { status?: BackendSupplierReturnStatus; pageSize?: number } = {}) => {
    const query = new URLSearchParams();
    query.set("pageSize", String(params.pageSize ?? 100));
    if (params.status) query.set("status", params.status);
    return apiClient.get<PaginatedResponse<BackendSupplierReturnRequest>>(`/supplier-returns?${query.toString()}`);
  },

  create: (payload: CreateSupplierReturnRequestPayload, requestedById: string) =>
    apiClient.post<BackendSupplierReturnRequest>("/supplier-returns", { ...payload, requestedById }),

  decide: (id: string, payload: DecideSupplierReturnRequestPayload, decidedById: string) =>
    apiClient.post<BackendSupplierReturnRequest>(`/supplier-returns/${id}/decide`, { ...payload, decidedById }),
};

export const supplierDebitNotesApi = {
  list: (params: { status?: BackendSupplierReturnStatus; purchaseId?: string; pageSize?: number } = {}) => {
    const query = new URLSearchParams();
    query.set("pageSize", String(params.pageSize ?? 100));
    if (params.status) query.set("status", params.status);
    if (params.purchaseId) query.set("purchaseId", params.purchaseId);
    return apiClient.get<PaginatedResponse<BackendSupplierDebitNote>>(`/supplier-debit-notes?${query.toString()}`);
  },

  /** Scanned tag, line code, or free text (invoice, supplier, type, colour) → matching lines. */
  lookup: (q: string) =>
    apiClient.get<ReturnableLine[]>(`/supplier-debit-notes/lookup?q=${encodeURIComponent(q)}`),

  get: (id: string) => apiClient.get<BackendSupplierDebitNote>(`/supplier-debit-notes/${encodeURIComponent(id)}`),

  create: (payload: CreateSupplierDebitNotePayload, requestedById: string) =>
    apiClient.post<BackendSupplierDebitNote>("/supplier-debit-notes", { ...payload, requestedById }),

  decide: (id: string, payload: DecideSupplierDebitNotePayload, decidedById: string) =>
    apiClient.post<BackendSupplierDebitNote>(`/supplier-debit-notes/${encodeURIComponent(id)}/decide`, { ...payload, decidedById }),

  /** Withdraw a pending note — its raiser or an admin. Frees the reserved pieces; moves no stock. */
  cancel: (id: string, cancelledById: string, note?: string) =>
    apiClient.post<BackendSupplierDebitNote>(`/supplier-debit-notes/${encodeURIComponent(id)}/cancel`, { cancelledById, note }),
};
