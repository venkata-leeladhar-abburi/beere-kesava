/**
 * Which pieces of a purchase line have gone back to the supplier.
 *
 * `returnedPieceNos` names them when a debit note picked specific pieces.
 * Lines returned before that only carry a count, and the long-standing
 * convention for those is "the first N pieces" — so any count not covered
 * by named pieces is filled from the lowest positions not already named.
 * The frontend's expandSareePieces applies the same rule.
 */
export function returnedPieceSet(
  quantity: number,
  returnedQuantity: number,
  returnedPieceNos: readonly number[] = [],
): Set<number> {
  const count = Math.min(Math.max(returnedQuantity, 0), quantity);
  const set = new Set<number>();
  for (const n of returnedPieceNos) {
    if (set.size >= count) break;
    if (n >= 1 && n <= quantity) set.add(n);
  }
  for (let n = 1; set.size < count && n <= quantity; n++) set.add(n);
  return set;
}
