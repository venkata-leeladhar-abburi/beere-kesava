/**
 * Paise-integer money arithmetic — design-system/07-DOCUMENTS.md Part I.5 /
 * Part X5. `parseFloat` never touches money; every document computes on
 * integer paise and formats for display only at the last step.
 */

/** Rupees (possibly fractional, e.g. from a form input) → integer paise. */
export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/** Integer paise → rupees, for display math only (never for further arithmetic). */
export function fromPaise(paise: number): number {
  return paise / 100;
}

/** Line amount: rate (rupees) x qty, rounded to the nearest paise. */
export function lineAmountPaise(rateRupees: number, qty: number): number {
  return Math.round(rateRupees * qty * 100);
}

/**
 * Round-off line: the grand total rounded to the nearest whole rupee, and
 * the signed adjustment needed to get there — displayed explicitly on the
 * document rather than silently absorbed (Part I.5's own warning: silent
 * rounding is what makes an invoice fail reconciliation).
 */
export function roundOff(grandTotalPaise: number): { roundedPaise: number; adjustmentPaise: number } {
  const roundedPaise = Math.round(grandTotalPaise / 100) * 100;
  return { roundedPaise, adjustmentPaise: roundedPaise - grandTotalPaise };
}

/** Formats integer paise as ₹ with 2 decimals and Indian digit grouping. */
export function formatPaise(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(fromPaise(paise));
}
