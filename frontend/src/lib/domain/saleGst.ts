/**
 * GST as stored on SaleRecords — read back for history, reports and reprinted
 * bills.
 * ═══════════════════════════════════════════════════════════════════════════
 * GST is charged once on a counter bill and shared across its sarees, so each
 * SaleRecord carries the bill's rate and its own slice of the tax. `amount` is
 * what the customer paid for the piece and already INCLUDES that slice; the
 * taxable value is `amount - gstAmount`. Decimals arrive as strings (Prisma
 * Decimal), so everything is summed on integer paise.
 */
export interface SaleGstFields {
  amount: string | number;
  gstRate?: string | number | null;
  gstAmount?: string | number | null;
  customerGstin?: string | null;
  sellerGstin?: string | null;
}

const toPaise = (v: string | number | null | undefined) => Math.round((Number(v ?? 0) || 0) * 100);

/** The GST rate (%) on this sale, or null when none was charged. */
export function saleGstRate(s: Pick<SaleGstFields, "gstRate">): number | null {
  const r = Number(s.gstRate ?? NaN);
  return Number.isFinite(r) && r > 0 ? r : null;
}

/** This sale's GST in rupees (0 when none was charged). */
export const saleGstAmount = (s: Pick<SaleGstFields, "gstAmount">): number =>
  toPaise(s.gstAmount) / 100;

/** What GST was charged on — the price of the piece before tax. */
export const saleTaxable = (s: Pick<SaleGstFields, "amount" | "gstAmount">): number =>
  (toPaise(s.amount) - toPaise(s.gstAmount)) / 100;

/**
 * The GST block for a bill made of these sales — rate, total tax, and the two
 * GSTINs — in the shape RetailBillDocument prints. Undefined when none of the
 * sales charged GST.
 */
export function billGstFromSales(
  sales: SaleGstFields[]
): { rate: number; amount: number; customerGstin?: string; sellerGstin?: string } | undefined {
  const taxed = sales.filter((s) => saleGstRate(s) !== null);
  if (taxed.length === 0) return undefined;
  return {
    rate: saleGstRate(taxed[0])!,
    amount: taxed.reduce((sum, s) => sum + toPaise(s.gstAmount), 0) / 100,
    customerGstin: taxed.find((s) => s.customerGstin)?.customerGstin ?? undefined,
    sellerGstin: taxed.find((s) => s.sellerGstin)?.sellerGstin ?? undefined,
  };
}
