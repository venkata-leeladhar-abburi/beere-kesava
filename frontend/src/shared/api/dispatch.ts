import { apiClient } from "./client";
import type { DispatchReceiptStatus } from "./shop-receipts";

export type BackendDispatchType = "SHOP" | "WHOLESALE";

export interface BackendDispatchSaree {
  dispatchId: string;
  sareeId: string;
}

export interface BackendDispatchRecord {
  id: string;
  type: BackendDispatchType;
  dispatchDate: string;
  lrNumber: string | null;
  transportCompany: string | null;
  vehicleNumber: string | null;
  driverName: string | null;
  customerId: string | null;
  customer: { id: string; name: string; phone: string | null; address: string | null; city: string | null } | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  /** Delivery challan number for SHOP dispatches (DC-<FY>-NNN). Null for
   *  wholesale, and for shop dispatches raised before it was allocated. */
  challanNumber: string | null;
  pricePerSaree: string | null;
  totalAmount: string;
  gstPct: string | null;
  grandTotal: string;
  firmId: string | null;
  /** Firm the dispatch was billed under — needed for the history table's Firm
   *  column, which otherwise has only an id to show. */
  firm: { id: string; firmName: string } | null;
  paymentDueDate: string | null;
  bulkOrderRef: string | null;
  quotationRef: string | null;
  pendingTransport: boolean;
  pendingReceipt: boolean;
  receiptUrl: string | null;
  notes: string | null;
  expectedDelivery: string | null;
  specialInstructions: string | null;
  /** How far the shop counter has got through receiving this consignment.
   *  Always PENDING for wholesale — nobody here receives those goods. */
  receiptStatus: DispatchReceiptStatus;
  /** Who actually raised this dispatch — null for records predating this attribution. */
  dispatchedBy: { id: string; firstName: string; lastName: string } | null;
  sarees: BackendDispatchSaree[];
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateDispatchPayload {
  type: BackendDispatchType;
  sareeIds: string[];
  /** Date the goods physically left, as entered on the dispatch form. Without
   *  it every record was stamped with the server's clock instead. */
  dispatchDate?: string;
  lrNumber?: string;
  transportCompany?: string;
  vehicleNumber?: string;
  driverName?: string;
  pendingTransport?: boolean;
  pendingReceipt?: boolean;
  receiptUrl?: string;
  notes?: string;
  expectedDelivery?: string;
  specialInstructions?: string;
  bulkOrderRef?: string;
  quotationRef?: string;
  // Wholesale only
  customerId?: string;
  // Asks the backend to raise a tax invoice for this dispatch. The invoice
  // number itself is allocated server-side and returned on the created record —
  // it is never sent from here.
  raiseInvoice?: boolean;
  pricePerSaree?: number;
  gstPct?: number;
  firmId?: string;
  paymentDueDate?: string;
  /** User who performed this — recorded on the action log so the history
   *  names the real person, including an admin working inside a staff portal. */
  actorId?: string;
}

export interface UpdateDispatchPayload {
  lrNumber?: string;
  transportCompany?: string;
  vehicleNumber?: string;
  driverName?: string;
  dispatchDate?: string;
  notes?: string;
  expectedDelivery?: string;
  specialInstructions?: string;
  pendingTransport?: boolean;
  pendingReceipt?: boolean;
  receiptUrl?: string;
}

export const dispatchApi = {
  list: (pageSize = 100) =>
    apiClient.get<PaginatedResponse<BackendDispatchRecord>>(`/dispatch?pageSize=${pageSize}`),

  findOne: (id: string) => apiClient.get<BackendDispatchRecord>(`/dispatch/${id}`),

  create: (payload: CreateDispatchPayload) => apiClient.post<BackendDispatchRecord>("/dispatch", payload),

  update: (id: string, payload: UpdateDispatchPayload) =>
    apiClient.patch<BackendDispatchRecord>(`/dispatch/${id}`, payload),

  delete: (id: string, actorId: string) => apiClient.delete(`/dispatch/${id}?actorId=${actorId}`),
};
