/**
 * Rupee amounts as whole paise, for comparisons and running totals.
 *
 * Money columns are Decimal(12, 2), but arrive here as JS numbers, and float
 * sums drift: 100.10 + 200.20 is 300.29999999999995, which is less than
 * 300.30. Compared as floats, that leaves a fully paid invoice PARTIAL (and
 * later OVERDUE) with no way to settle it, or rejects an exact final payment
 * as "exceeds the balance". Integers in paise compare exactly.
 */
export function toPaise(rupees: unknown): number {
  return Math.round(Number(rupees ?? 0) * 100);
}

export function fromPaise(paise: number): number {
  return paise / 100;
}
