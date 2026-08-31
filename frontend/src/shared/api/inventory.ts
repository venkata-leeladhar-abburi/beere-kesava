import { apiClient } from "./client";

export type StockSource = "factory" | "outsourced" | "external";
export type StockStatus = "available" | "sold" | "wholesale";

/**
 * Shape returned by GET /inventory — mirrors InventoryService.StockItem on
 * the backend. Weight and assignedBy/assignedAt are not yet in the DB, so the
 * frontend shows "—" for those fields.
 */
export interface BackendStockItem {
  sareeId: string;
  source: StockSource;
  status: StockStatus;
  weaverName: string | null;
  weaverId: string | null;
  /** Human-facing weaver code ("Ramarao-001") — the only weaver id the UI shows. */
  weaverCode: string | null;
  loomNumber: string | null;
  designCode: string | null;
  sareeTypeCode: string | null;
  sareeTypeLabel: string | null;
  qcDate: string; // ISO 8601
  saleRef: string | null;
  customer: string | null;
}

/** The SHOP dispatch that delivered a saree to the shop floor. */
export interface ShopDispatchInfo {
  dispatchId: string;
  dispatchDate: string;
  lrNumber: string | null;
  transportCompany: string | null;
  vehicleNumber: string | null;
  driverName: string | null;
  notes: string | null;
  pendingTransport: boolean;
  pendingReceipt: boolean;
}

/** One saree standing in the shop — same detail as the factory list, plus the
 *  consignment that delivered it, which the shop groups and filters by. */
export interface ShopStockItem extends BackendStockItem {
  retailPrice: number | null;
  /** What it actually sold for, and when. Null until the saree is sold —
   *  shown next to retailPrice so the counter can see the discount given. */
  soldPrice: number | null;
  soldDate: string | null;
  dispatch: ShopDispatchInfo;
  /** How the saree came to be standing in the shop — a lorry, or a return. */
  stockOrigin: "dispatch" | "retail-return" | "wholesale-return";
  returnRef: string | null;
  returnReason: string | null;
  returnDate: string | null;
  returnedFrom: string | null;
  photoUrl: string | null;
  color: string | null;
  weightG: number | null;
}

export const inventoryApi = {
  /** GET /inventory — all QC-passed woven sarees still in the factory. */
  list: () => apiClient.get<BackendStockItem[]>("/inventory"),

  /** GET /inventory/shop — what is physically in the shop: every saree an
   *  admin dispatched to it that has not since been sold. This is the shop
   *  portal's stock, deliberately not the factory list. */
  shopStock: (dispatchId?: string) =>
    apiClient.get<ShopStockItem[]>(
      `/inventory/shop${dispatchId ? `?dispatchId=${encodeURIComponent(dispatchId)}` : ""}`,
    ),
};
