import { apiClient } from "./client";

export interface RawMaterialStockItem {
  id: string;
  materialType: "WARP" | "RESHAM" | "JARI";
  name: string;
  grade?: string | null;
  color?: string | null;
  unit: string;
  currentStock: number;
  reorderLevel: number;
  vendorId?: string | null;
  vendor?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface GrnItemInput {
  materialType: "WARP" | "RESHAM" | "JARI";
  name: string;
  /** Color/grade/quality notes — carried over from the PurchaseOrderItem this is received against, if any. */
  description?: string;
  grade?: string;
  color?: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  rejectedQuantity?: number;
  /** PurchaseOrderItem.id this line is received against — the receiving screen
   *  walks the PO line by line, so the pairing is exact here. Omit for an
   *  ad-hoc receipt with no PO behind it. */
  poItemId?: string;
}

export interface CreateGrnPayload {
  vendorId?: string;
  /** Which of the company's legal firms this purchase belongs to. Optional. */
  firmId?: string;
  supplierName: string;
  invoiceNo?: string;
  invoiceDate?: string;
  notes?: string;
  /** Who physically received this delivery — stored as GrnReceipt.receivedById so it shows up in Goods Receipt History instead of a blank "Received By". */
  actorId?: string;
  items: GrnItemInput[];
}

export interface GrnReceiptItem {
  id: string;
  vendorId?: string | null;
  firmId?: string | null;
  firm?: { id: string; firmName: string } | null;
  supplierName: string;
  invoiceNo?: string | null;
  invoiceDate?: string | null;
  receivedDate: string;
  receivedBy?: { firstName: string; lastName: string } | null;
  notes?: string | null;
  /** Purchase order(s) this receipt was received against, if any — a GRN created ad hoc (not from a PO) has none. */
  purchaseOrders: { id: string; poNumber: string }[];
  items: {
    id: string;
    /** Structured per-line id (e.g. "GRN-SreeVignesh-004-002-1") — print this on barcode labels and show it in receipt history, not `id`. Null on rows received before this field existed. */
    itemCode?: string | null;
    /** The exact PurchaseOrderItem this line was received against. Null for ad-hoc receipts and pre-existing rows. */
    poItemId?: string | null;
    materialType: string;
    name: string;
    description?: string | null;
    grade?: string | null;
    color?: string | null;
    quantity: number;
    unit?: string | null;
    unitPrice: number;
    totalPrice: number;
    rejectedQuantity: number;
    /** `quantity - rejectedQuantity` — what actually entered stock. */
    receivedQuantity: number;
    /** Already issued out of this specific line, converted back into `unit`. */
    issuedQuantity: number;
    /** `receivedQuantity - issuedQuantity`, converted back into `unit`. This is the true remaining stock — use it, not `quantity`, wherever "available" is shown. */
    availableQuantity: number;
  }[];
}

export const rawMaterialsApi = {
  listStock: () => apiClient.get<{ items: RawMaterialStockItem[] }>("/materials/stock"),
  /**
   * GET /materials/grn. `limit` takes the newest N receipts; `from`/`to` scope
   * by receipt date. Passing neither returns every receipt — bound it to what
   * the screen actually renders.
   */
  listGrns: (opts?: { limit?: number; from?: string; to?: string }) => {
    const q = new URLSearchParams();
    if (opts?.limit) q.set("limit", String(opts.limit));
    if (opts?.from) q.set("from", opts.from);
    if (opts?.to) q.set("to", opts.to);
    const qs = q.toString();
    return apiClient.get<{ items: GrnReceiptItem[] }>(`/materials/grn${qs ? `?${qs}` : ""}`);
  },
  createGrn: (payload: CreateGrnPayload) => apiClient.post<GrnReceiptItem>("/materials/grn", payload),
  updateReorderLevels: (payload: { thresholds: { id: string; reorderLevel: number }[] }) =>
    apiClient.patch<{ success: boolean }>("/materials/reorder-levels", payload),
};

