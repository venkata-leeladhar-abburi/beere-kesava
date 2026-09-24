/**
 * One line of a counter sale. A retail sale is now a basket — the customer
 * walks up with however many sarees they are buying, and each one carries its
 * own price (the per-saree price Worker Staff entered at receipt, overridable
 * at the counter). The backend still records one SaleRecord per saree, so a
 * basket is submitted as one create call per line.
 */
export interface SaleLine {
  id: string;
  batchId: string;
  design: string;
  name: string;
  type: string;
  typeCode: string;
  weight: string;
  weaver: string;
  /** Catalogue/receipt price, kept so a discount can be shown against it. */
  originalPrice: number;
  /** How the counter discount on this saree is expressed. */
  discountMode: DiscountMode;
  /** Rupees off (amount mode) or percent off (percent mode). */
  discountValue: number;
  /** What it is actually selling for — always derived from the retail price
   *  and the discount via `applyDiscount`, never typed directly. */
  soldPrice: number;
  /** Where the saree came from — printed on the admin copy of the bill only,
   *  never on the customer's. */
  source?: SaleSource;
}

export interface SaleSource {
  kind: "weaver" | "factory" | "external";
  /** Weaver, factory loom or supplier name. */
  name: string;
  /** Loom number, or the supplier's invoice number. */
  detail?: string;
}

export type DiscountMode = "amount" | "percent";

/** Retail price less the discount, clamped so it never goes below zero or
 *  above retail, and rounded to whole rupees. */
export function discountedPrice(original: number, mode: DiscountMode, value: number): number {
  const v = Number.isFinite(value) && value > 0 ? value : 0;
  const off = mode === "percent" ? (original * Math.min(v, 100)) / 100 : Math.min(v, original);
  return Math.max(0, Math.round(original - off));
}

/** Returns the line with a new discount and its sold price recomputed. */
export const applyDiscount = (line: SaleLine, mode: DiscountMode, value: number): SaleLine => ({
  ...line,
  discountMode: mode,
  discountValue: value,
  soldPrice: discountedPrice(line.originalPrice, mode, value),
});

export const cartTotal = (lines: SaleLine[]) =>
  lines.reduce((sum, l) => sum + l.soldPrice, 0);

export const cartOriginalTotal = (lines: SaleLine[]) =>
  lines.reduce((sum, l) => sum + l.originalPrice, 0);

/** "10%" or "₹500" — what the counter typed, for the bill's Discount column. */
export function discountLabel(line: Pick<SaleLine, "discountMode" | "discountValue">): string | undefined {
  if (!line.discountValue) return undefined;
  return line.discountMode === "percent" ? `${line.discountValue}%` : undefined;
}

/** A basket line in the shape RetailBillDocument prints. */
export const toBillLine = (l: SaleLine) => ({
  sareeId: l.id,
  name: l.name,
  type: l.type,
  design: l.design,
  soldPrice: l.soldPrice,
  originalPrice: l.originalPrice,
  discountNote: discountLabel(l),
  source: l.source,
});
