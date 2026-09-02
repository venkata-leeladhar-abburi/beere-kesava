import { apiClient } from "./client";
import type { BackendDispatchSaree } from "./dispatch";

/** Verdict recorded against one saree when the consignment is received. */
export type ShopReceiptItemStatus = "RECEIVED" | "DAMAGED" | "MISSING";

/** How far a SHOP dispatch has got through receiving at the counter. */
export type DispatchReceiptStatus = "PENDING" | "PARTIALLY_RECEIVED" | "RECEIVED";

interface Actor {
  id: string;
  firstName: string;
  lastName: string;
}

export interface ShopReceiptItem {
  id: string;
  receiptId: string;
  sareeId: string;
  status: ShopReceiptItemStatus;
  remarks: string | null;
}

/** One shop goods-receipt note (SGR-<FY>-NNN) — a single receiving session. */
export interface ShopReceipt {
  id: string;
  code: string;
  dispatchId: string;
  receivedAt: string;
  receivedBy: Actor | null;
  notes: string | null;
  items: ShopReceiptItem[];
  dispatch: {
    id: string;
    dispatchDate: string;
    challanNumber: string | null;
    lrNumber: string | null;
    transportCompany: string | null;
    vehicleNumber: string | null;
    driverName: string | null;
    receiptStatus: DispatchReceiptStatus;
    dispatchedBy: Actor | null;
  };
}

/** A consignment sitting in the Incoming list, waiting to be received. */
export interface PendingShopDispatch {
  id: string;
  dispatchDate: string;
  challanNumber: string | null;
  lrNumber: string | null;
  transportCompany: string | null;
  vehicleNumber: string | null;
  driverName: string | null;
  notes: string | null;
  receiptStatus: DispatchReceiptStatus;
  dispatchedBy: Actor | null;
  /** Every piece on the lorry, each carrying the verdict it already has —
   *  null while it is still awaiting one. */
  sarees: Array<
    BackendDispatchSaree & {
      id: string;
      receiptStatus: ShopReceiptItemStatus | null;
      receivedAt: string | null;
    }
  >;
  /** Receipts already raised against this consignment (a short one is
   *  received more than once). */
  receipts: Array<{ id: string; code: string; receivedAt: string }>;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateShopReceiptPayload {
  dispatchId: string;
  items: Array<{ sareeId: string; status: ShopReceiptItemStatus; remarks?: string }>;
  notes?: string;
}

export const shopReceiptsApi = {
  /** Consignments still to be received. */
  listPending: () => apiClient.get<PendingShopDispatch[]>("/shop-receipts/pending"),

  list: (pageSize = 100) =>
    apiClient.get<PaginatedResponse<ShopReceipt>>(`/shop-receipts?pageSize=${pageSize}`),

  findOne: (id: string) => apiClient.get<ShopReceipt>(`/shop-receipts/${id}`),

  // The receiver is taken from the caller's token — never sent from here.
  create: (payload: CreateShopReceiptPayload) =>
    apiClient.post<ShopReceipt>("/shop-receipts", payload),
};

/** Query keys, shared so the receive mutation can invalidate every view that
 *  changes when a consignment lands: the incoming list, the receipt history and
 *  the shop's own stock (received pieces become sellable). */
export const shopReceiptKeys = {
  pending: ["shop-receipts", "pending"] as const,
  history: ["shop-receipts", "history"] as const,
};
