// Record-matching rules the report sections share, kept apart from the
// components so they can be tested on their own.

import type { BackendQcRecord } from "../../../shared/api/qc";
import type { BackendSaleRecord, BackendSaleReturn } from "../../../shared/api/sales";

/**
 * Pairs every return with the sale it undoes: the latest sale of that saree
 * on or before the return. Matching on the saree alone marked *every* sale of
 * a piece that was returned, restocked and sold again as returned.
 */
export function matchReturnsToSales(
  sales: readonly BackendSaleRecord[],
  returns: readonly BackendSaleReturn[]
): Map<string, BackendSaleReturn> {
  const salesBySaree = new Map<string, BackendSaleRecord[]>();
  for (const s of sales) {
    const list = salesBySaree.get(s.sareeId);
    if (list) list.push(s);
    else salesBySaree.set(s.sareeId, [s]);
  }
  for (const list of salesBySaree.values())
    list.sort((a, b) => a.saleDate.localeCompare(b.saleDate));

  const bySaleRef = new Map<string, BackendSaleReturn>();
  for (const r of [...returns].sort((a, b) => a.returnDate.localeCompare(b.returnDate))) {
    const list = salesBySaree.get(r.sareeId);
    if (!list) continue;
    const open = list.filter((s) => !bySaleRef.has(s.saleRef));
    const before = open.filter((s) => s.saleDate <= r.returnDate);
    // A sale back-dated after its return would otherwise drop the refund
    // from every total; fall back to the latest unmatched sale.
    const sale = before[before.length - 1] ?? open[open.length - 1];
    if (sale) bySaleRef.set(sale.saleRef, r);
  }
  return bySaleRef;
}

/**
 * One verdict per saree: the newest. A saree re-inspected after SEMI rework
 * carries several QC records, and counting records counted it once per round
 * (SEMI *and* PASSED). Records arrive newest first, but this does not rely on
 * that.
 */
export function latestVerdicts(records: readonly BackendQcRecord[]): BackendQcRecord[] {
  const bySaree = new Map<string, BackendQcRecord>();
  for (const q of records) {
    const key = q.sareeId || q.id;
    const seen = bySaree.get(key);
    if (!seen || q.qcDate > seen.qcDate) bySaree.set(key, q);
  }
  return Array.from(bySaree.values());
}
