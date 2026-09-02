import type { QcResult } from "@/features/qc";
import type { UnifiedSaree } from "@/features/customers";

export type FinishingStatus = "completed" | "in-finishing" | "pending" | "none" | "rejected";

export interface WeaverSareeRow {
  sareeId: string;
  batchId: string | null;
  loomNumber: number | null;
  sareeTypeCode: string | null;
  sareeTypeName: string | null;
  bulkOrderLabel: string | null;
  designCode: string | null;
  /** Body colour, as entered by Worker Staff at Receive Sarees (BatchSareeRow.receivedColor). */
  color: string | null;
  /** Photo captured by Worker Staff at Receive Sarees — same source as the worker portal's Received History. */
  receivedPhotoUrl: string | null;

  /** true when the saree comes from a production batch assigned to this weaver */
  isAssigned: boolean;
  assignedDate: string | null;

  qcStatus: QcResult | "pending";
  receivedDate: string | null;
  qcDate: string | null;
  defects: string[];
  makingCharge: number | null;
  deduction: number | null;
  payable: number | null;

  finishingStatus: FinishingStatus;
  finishingAssignedDate: string | null;
  finishingCompletedDate: string | null;
  /** true once this saree appears in a real DispatchRecord — already dispatched, including via a raised quotation. */
  dispatched: boolean;
  /** true once a sale has been recorded against it. Independent of `dispatched`:
   *  a wholesale counter sale marks a saree SOLD without any dispatch record,
   *  and the server refuses to dispatch it either way. */
  sold: boolean;

  /** present when the saree exists in the sales / stock ledger */
  stock: UnifiedSaree | null;

  /** Only set on externally purchased pieces (see useExternalPurchaseRows) —
   *  the per-piece facts the stock ledger has no place for. */
  external?: ExternalPieceInfo;

  /** Who wove/produced this saree — only populated in "all" (cross-weaver) mode. */
  ownerKind: "weaver" | "loom" | null;
  ownerId: string | null;
  ownerLabel: string | null;
}

/** Per-piece detail carried by an externally purchased saree row. */
export interface ExternalPieceInfo {
  /** Code of the purchase line this physical piece belongs to. */
  lineCode: string;
  pieceNo: number;
  lineQuantity: number;
  /** Sent back to the supplier — no longer sellable stock. */
  returned: boolean;
  /** Payment status of the parent purchase, as shown on External Purchases. */
  paymentStatus: "Paid" | "Pending" | "Partial";
  /** The line's own photo, used when the piece has none of its own. */
  linePhotoUrl: string | null;
  gstNumber: string | null;
}

export type TabKey =
  | "assigned" | "produced" | "qcpassed" | "semi"
  | "defective" | "finishing" | "sold" | "outstanding" | "shortage" | "external" | "dispatched";

/** Which date each tab filters and sorts on. */
export function tabDate(row: WeaverSareeRow, tab: TabKey): string | null {
  switch (tab) {
    case "assigned": return row.assignedDate;
    case "produced": return row.receivedDate ?? row.stock?.qcDate ?? null;
    case "qcpassed":
    case "semi":
    case "defective": return row.qcDate;
    case "finishing": return row.finishingCompletedDate;
    case "sold": return row.stock?.sale?.date ?? null;
    case "outstanding": return row.stock?.qcDate ?? null;
    case "shortage": return row.finishingCompletedDate ?? row.qcDate ?? null;
    case "external": return row.stock?.purchaseDate ?? row.stock?.qcDate ?? null;
    case "dispatched": return row.stock?.sale?.date ?? row.finishingCompletedDate ?? null;
  }
}
