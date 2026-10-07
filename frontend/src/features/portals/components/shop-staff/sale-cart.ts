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

export const cartTotal = (lines: SaleLine[]) => lines.reduce((sum, l) => sum + l.soldPrice, 0);

export const cartOriginalTotal = (lines: SaleLine[]) =>
  lines.reduce((sum, l) => sum + l.originalPrice, 0);

/** "10%" or "₹500" — what the counter typed, for the bill's Discount column. */
export function discountLabel(
  line: Pick<SaleLine, "discountMode" | "discountValue">
): string | undefined {
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

/**
 * A discount on the whole bill, on top of any per-saree discounts — given at
 * the counter as ₹ off or % off the basket's final amount.
 */
export interface BillDiscount {
  mode: DiscountMode;
  value: number;
}

export const NO_BILL_DISCOUNT: BillDiscount = { mode: "amount", value: 0 };

/** Rupees the bill discount takes off `subtotal` (the basket after per-saree
 *  discounts) — clamped to the subtotal and rounded to whole rupees, the same
 *  way a line discount is. */
export function billDiscountAmount(subtotal: number, d: BillDiscount): number {
  return subtotal - discountedPrice(subtotal, d.mode, d.value);
}

/** "5%" when the bill discount was given as a percentage. */
export const billDiscountLabel = (d: BillDiscount): string | undefined =>
  d.value && d.mode === "percent" ? `${d.value}%` : undefined;

/** What the customer pays: the basket after per-saree discounts, less the bill discount. */
export const billTotal = (lines: SaleLine[], d: BillDiscount): number => {
  const subtotal = cartTotal(lines);
  return subtotal - billDiscountAmount(subtotal, d);
};

/**
 * Spreads a bill discount across the lines in proportion to each line's
 * price, in whole rupees, so the shares add up to exactly `amount`. The
 * backend records one SaleRecord per saree, so this is what makes each saree's
 * recorded amount — the figure refunds, firm income and customer spend all
 * read — sum to what the customer actually paid. Rounding leftovers go to the
 * lines with the largest remainders; no line is pushed below zero.
 */
export function allocateBillDiscount(
  lines: Pick<SaleLine, "soldPrice">[],
  amount: number
): number[] {
  const subtotal = lines.reduce((sum, l) => sum + l.soldPrice, 0);
  if (amount <= 0 || subtotal <= 0) return lines.map(() => 0);
  const off = Math.min(amount, subtotal);
  const exact = lines.map((l) => (l.soldPrice * off) / subtotal);
  const shares = exact.map(Math.floor);
  let left = off - shares.reduce((a, b) => a + b, 0);
  const byRemainder = exact.map((x, i) => ({ i, r: x - Math.floor(x) })).sort((a, b) => b.r - a.r);
  for (const { i } of byRemainder) {
    if (left <= 0) break;
    if (shares[i] < lines[i].soldPrice) {
      shares[i] += 1;
      left -= 1;
    }
  }
  return shares;
}

// ── GST ─────────────────────────────────────────────────────────────────────

/**
 * GST on a counter bill — off unless the shop chooses to charge it. The rate
 * applies to the whole bill, on the amount left after every discount, and is
 * added on top: a ₹1,000 bill at 5% is ₹1,050. Retail is always intra-state,
 * so the tax prints as CGST + SGST, half the rate each.
 */
export interface BillGst {
  enabled: boolean;
  /** Percent, e.g. 5 for 5%. */
  rate: number;
  /** Buyer's GSTIN — optional, for a registered customer who asks for it. */
  gstin: string;
}

export const NO_GST: BillGst = { enabled: false, rate: 0, gstin: "" };

/** The slabs a saree counter actually uses, offered as one-tap presets. */
export const GST_RATE_PRESETS = [5, 12, 18] as const;

/** Highest slab accepted — the server enforces the same ceiling. */
export const GST_MAX_RATE = 28;

/** 2-digit state code, 10-char PAN, entity number, "Z", check character. */
const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

/** Upper-cased and stripped of spaces — how a GSTIN is typed vs. stored. */
export const normalizeGstin = (v: string) => v.replace(/\s+/g, "").toUpperCase();

export const isValidGstin = (v: string) => GSTIN_PATTERN.test(normalizeGstin(v));

/** Why the GST entry can't be used yet, or null when it is ready (or off). */
export function gstIssue(g: BillGst): string | null {
  if (!g.enabled) return null;
  if (!Number.isFinite(g.rate) || g.rate <= 0) return "Enter the GST percentage";
  if (g.rate > GST_MAX_RATE) return `GST can't be more than ${GST_MAX_RATE}%`;
  // Tolerance, not equality: 2.55 * 100 is 254.99999999999997 in floating point.
  if (Math.abs(Math.round(g.rate * 100) - g.rate * 100) > 1e-6)
    return "GST percentage can have at most 2 decimals";
  if (g.gstin.trim() && !isValidGstin(g.gstin))
    return "GST number must be a valid 15-character GSTIN";
  return null;
}

/** A bill's GST worked out, in whole rupees. */
export interface GstBreakdown {
  rate: number;
  /** What the GST is charged on — the bill after every discount. */
  taxable: number;
  cgst: number;
  sgst: number;
  /** cgst + sgst. */
  gst: number;
  /** taxable + gst — what the customer pays. */
  total: number;
}

/**
 * The GST on `taxable` rupees, or null when GST is off or not yet valid.
 * CGST and SGST are each half the rate, each rounded to the nearest whole
 * rupee (as CGST Act s.170 allows) — the counter works in whole rupees, like
 * the discounts above, so the bill, the history and every report show exact
 * figures with no stray paise. The epsilon keeps a true half-rupee (₹2.50)
 * from rounding down on floating-point noise.
 */
export function gstBreakdown(taxable: number, g: BillGst): GstBreakdown | null {
  if (!g.enabled || gstIssue({ ...g, gstin: "" })) return null;
  const half = Math.round((taxable * g.rate) / 200 + 1e-9);
  return {
    rate: g.rate,
    taxable,
    cgst: half,
    sgst: half,
    gst: half * 2,
    total: taxable + half * 2,
  };
}

/**
 * Splits a whole number of rupees across weights in proportion, so the
 * shares add up to exactly `total`. Leftovers from rounding go to the largest
 * remainders. Used to spread a bill's GST over its sarees, since each saree
 * is its own SaleRecord.
 */
export function allocateByWeight(weights: number[], total: number): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (total <= 0 || sum <= 0) return weights.map(() => 0);
  const exact = weights.map((w) => (w * total) / sum);
  const shares = exact.map(Math.floor);
  let left = total - shares.reduce((a, b) => a + b, 0);
  const byRemainder = exact.map((x, i) => ({ i, r: x - Math.floor(x) })).sort((a, b) => b.r - a.r);
  for (const { i } of byRemainder) {
    if (left <= 0) break;
    shares[i] += 1;
    left -= 1;
  }
  return shares;
}

/** The GST figures RetailBillDocument prints. */
export const toBillGst = (b: GstBreakdown, customerGstin?: string, sellerGstin?: string) => ({
  rate: b.rate,
  amount: b.gst,
  customerGstin: customerGstin?.trim() ? normalizeGstin(customerGstin) : undefined,
  sellerGstin: sellerGstin || undefined,
});
