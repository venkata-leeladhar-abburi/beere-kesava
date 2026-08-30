/**
 * Joining a vendor's ordered lines to the goods-receipt lines they arrived on.
 * Extracted from VendorProfile so the matching rules can be tested directly.
 */
import type { BackendPurchaseOrder } from "@/shared/api/purchase-orders";

/**
 * Pairs each ordered PO line with the goods-receipt line it actually arrived
 * on, so the vendor's order history can show that material's own receipt id
 * (`GRN-SreeVignesh-004-002-1`) rather than only the parent receipt's.
 *
 * Receipts recorded since GrnItem.poItemId exists carry the pairing outright —
 * the receiving clerk establishes it line by line, so it is exact. Older
 * receipts have to be matched on content instead: material type plus name
 * first, then material type alone, because the receiving screen rewrites a
 * line's name to its subtype. Matched receipt lines are consumed, so two
 * ordered lines can't both claim one receipt line — an ambiguous leftover
 * yields no code rather than a wrong one.
 */
export function matchGrnItemCodes(
  poItems: NonNullable<BackendPurchaseOrder["items"]>,
  grnItems: NonNullable<NonNullable<BackendPurchaseOrder["grnReceipt"]>["items"]>,
): (string | undefined)[] {
  const taken = new Set<number>();
  const norm = (v: string | null | undefined) => (v ?? "").trim().toLowerCase();

  /** Index of the first unclaimed receipt line satisfying `predicate`, or -1. */
  const claim = (predicate: (g: (typeof grnItems)[number]) => boolean): number => {
    const i = grnItems.findIndex((g, idx) => !taken.has(idx) && predicate(g));
    if (i >= 0) taken.add(i);
    return i;
  };

  // Exact links are resolved for every ordered line before any guessing
  // starts, so a heuristic match can never consume a line that a later
  // ordered line owns outright.
  const exact = poItems.map(item => (item.id ? claim(g => g.poItemId === item.id) : -1));

  return poItems.map((item, n) => {
    let i = exact[n]!;
    if (i < 0) i = claim(g => g.materialType === item.materialType && norm(g.name) === norm(item.name));
    if (i < 0) i = claim(g => g.materialType === item.materialType);
    // Claiming is separate from reading the code: a legacy receipt line with a
    // null itemCode is still *matched* and must stay consumed, or the fallback
    // above would hand a second, unrelated line's code to this material.
    return i < 0 ? undefined : (grnItems[i]!.itemCode ?? undefined);
  });
}
