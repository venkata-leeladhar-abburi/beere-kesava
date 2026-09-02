import { serialFromPieceCode } from "@/features/suppliers";
import { T } from "./theme";
import type { QcResult } from "@/features/qc";
import { FinishingStatus, WeaverSareeRow } from "./types";
import { formatMoney, rupees } from "../../../../lib/domain/money";

export const inr = (n: number): string => formatMoney(rupees(n));

/** External saree IDs are piece codes built by SupplierContext:
 *  `PREFIX-INVOICE-SERIAL-PIECE`. Pulls out the serial so it reads as its own
 *  field rather than being buried inside the compound saree ID. */
export function externalSerialOf(sareeId: string): string | null {
  return serialFromPieceCode(sareeId);
}

/** Whether a saree may be ticked for a quotation or a dispatch.
 *
 *  Mirrors DispatchService.create's rejection rule exactly — not already
 *  DISPATCHED / SOLD / DAMAGED_REVIEW_NEEDED. QC/finishing status is no
 *  longer a precondition (product decision): whatever is selected in
 *  Inventory must be dispatchable to Shop or Wholesale regardless of
 *  whether it has passed QC or finished, since a saree already off the
 *  shelf (dispatched/sold) or flagged for damage review is the only thing
 *  that genuinely can't be dispatched again.
 *
 *  Exported so the inventory page resolves its selection through the very same
 *  rule the table's checkboxes use: what you can tick is exactly what the
 *  dispatch/quotation modals receive, and exactly what the server accepts. */
export const isSareePickable = (r: WeaverSareeRow): boolean =>
  !r.dispatched
  && !r.sold
  && r.finishingStatus !== "rejected";

/** Why a saree cannot be ticked — shown on the disabled checkbox so the row
 *  explains itself instead of just being unclickable. */
export function pickBlockedReason(r: WeaverSareeRow): string | undefined {
  if (r.sold) return "Already sold — it is no longer in stock";
  if (r.dispatched) return "Already dispatched";
  if (r.finishingStatus === "rejected") return "Came back damaged from finishing — needs review before it can be dispatched";
  return undefined;
}

export const AGE_COLOR: Record<string, string> = {
  "0-30": T.green, "31-60": T.antiqueGold, "61-90": T.orange, "90+": T.crimson,
};

/** Renders a date string in a compact, consistent form. */
export function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return d;
  return parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export const QC_CFG: Record<QcResult | "pending", { label: string; color: string }> = {
  passed: { label: "QC Passed", color: T.green },
  semi: { label: "Semi-Approved", color: T.antiqueGold },
  defective: { label: "Defective", color: T.crimson },
  pending: { label: "In Production", color: T.taupe },
};

export const FIN_CFG: Record<FinishingStatus, { label: string; color: string }> = {
  completed: { label: "Completed", color: T.green },
  "in-finishing": { label: "In Finishing", color: T.antiqueGold },
  pending: { label: "Not Assigned", color: T.taupe },
  none: { label: "—", color: T.taupe },
  rejected: { label: "Rejected", color: T.crimson },
};

export const DISPATCH_CFG: Record<"dispatched" | "inStock", { label: string; color: string }> = {
  dispatched: { label: "Dispatched", color: T.taupe },
  inStock: { label: "In Stock", color: T.green },
};
