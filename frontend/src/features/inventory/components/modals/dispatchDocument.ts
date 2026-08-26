import type { DispatchRecord } from "@/features/finishing";
import { formatDate } from "@/shared/ui/date/format";

/**
 * Reference printed on a shop dispatch's Delivery Challan.
 *
 * Normally the server-allocated `challanNumber` — a sequential, collision-free
 * DC-<FY>-NNN issued at dispatch time, the same way invoice numbers are.
 *
 * Shop dispatches raised before that column existed have none, so those fall
 * back to a reference derived from what already identifies the dispatch: its
 * date and its id. Stable for a given dispatch, so an old challan reprints
 * identically rather than changing number under the operator.
 */
export function challanReference(
  dispatch: Pick<DispatchRecord, "id" | "dispatchDate"> & { challanNumber?: string },
): string {
  if (dispatch.challanNumber) return dispatch.challanNumber;
  return derivedChallanReference(dispatch);
}

/** Legacy fallback — see challanReference. */
function derivedChallanReference(dispatch: Pick<DispatchRecord, "id" | "dispatchDate">): string {
  const d = new Date(dispatch.dispatchDate);
  const datePart = isNaN(d.getTime())
    ? "00000000"
    : `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const idPart = dispatch.id.replace(/-/g, "").slice(0, 6).toUpperCase();
  return `DC-${datePart}-${idPart}`;
}

/**
 * Document-facing date. The record's dates are ISO strings, and passing one
 * through untouched printed "2026-08-26T00:00:00.000Z" in the Date field of
 * both the invoice and the challan.
 */
export function documentDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? String(iso) : formatDate(d, "long");
}
