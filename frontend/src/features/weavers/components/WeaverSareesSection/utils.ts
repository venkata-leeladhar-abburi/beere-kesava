import { T } from "./theme";
import type { QcResult } from "@/features/qc";
import { FinishingStatus, WeaverSareeRow } from "./types";
import { formatMoney, rupees } from "../../../../lib/domain/money";

export const inr = (n: number): string => formatMoney(rupees(n));

/** External saree IDs follow SupplierContext.buildSareeCode: PREFIX-###-INVOICE.
 *  Pulls out the 3-digit serial so it reads as its own field rather than being
 *  buried inside the compound saree ID. */
export function externalSerialOf(sareeId: string): string | null {
  const m = sareeId.match(/^[A-Za-z]+-(d{3,4})-/);
  return m ? m[1] : null;
}

/** Whether a saree may be ticked for a quotation or a dispatch.
 *
 *  A clean QC pass is the real precondition: DispatchService.create rejects
 *  anything else outright ("Saree(s) have not passed QC and cannot be
 *  dispatched"), so allowing sarees still in production or awaiting QC to be
 *  ticked only walked the operator into a server error they could do nothing
 *  about. Semi-approved and defective sarees need a QC decision first, and a
 *  saree already on a dispatch record is off the shelf.
 *
 *  Exported so the inventory page resolves its selection through the very same
 *  rule the table's checkboxes use: what you can tick is exactly what the
 *  dispatch/quotation modals receive, and exactly what the server accepts. */
export const isSareePickable = (r: WeaverSareeRow): boolean =>
  r.qcStatus === "passed" && !r.dispatched;

/** Why a saree cannot be ticked — shown on the disabled checkbox so the row
 *  explains itself instead of just being unclickable. */
export function pickBlockedReason(r: WeaverSareeRow): string | undefined {
  if (r.dispatched) return "Already dispatched";
  if (r.qcStatus === "defective") return "Failed QC — needs a decision before it can be dispatched";
  if (r.qcStatus === "semi") return "Semi-approved — needs a QC decision before it can be dispatched";
  if (r.qcStatus !== "passed") return "Not QC-passed yet — it cannot be dispatched or quoted";
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
