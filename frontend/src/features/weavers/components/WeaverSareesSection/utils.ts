import { T } from "./theme";
import type { QcResult } from "../../../qc/contexts/QcContext";
import { FinishingStatus } from "./types";

export const inr = (n: number): string => "₹" + Math.round(n).toLocaleString("en-IN");

/** External saree IDs follow SupplierContext.buildSareeCode: PREFIX-###-INVOICE.
 *  Pulls out the 3-digit serial so it reads as its own field rather than being
 *  buried inside the compound saree ID. */
export function externalSerialOf(sareeId: string): string | null {
  const m = sareeId.match(/^[A-Za-z]+-(d{3,4})-/);
  return m ? m[1] : null;
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
