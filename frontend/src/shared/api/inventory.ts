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
  loomNumber: string | null;
  designCode: string | null;
  sareeTypeCode: string | null;
  sareeTypeLabel: string | null;
  qcDate: string; // ISO 8601
  saleRef: string | null;
  customer: string | null;
}

export const inventoryApi = {
  /** GET /inventory — all QC-passed woven sarees with full detail. */
  list: () => apiClient.get<BackendStockItem[]>("/inventory"),
};
