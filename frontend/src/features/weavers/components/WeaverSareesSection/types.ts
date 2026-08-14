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
  /** Body colour, resolved from the design library via designCode. */
  color: string | null;

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

  /** present when the saree exists in the sales / stock ledger */
  stock: UnifiedSaree | null;

  /** Who wove/produced this saree — only populated in "all" (cross-weaver) mode. */
  ownerKind: "weaver" | "loom" | null;
  ownerId: string | null;
  ownerLabel: string | null;
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
