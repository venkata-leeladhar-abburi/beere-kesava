/**
 * One line of a counter sale. A retail sale is now a basket — the customer
 * walks up with however many sarees they are buying, and each one carries its
 * own price (the per-saree price Worker Staff entered at receipt, overridable
 * at the counter). The backend still records one SaleRecord per saree, so a
 * basket is submitted as one create call per line.
 */
export interface SaleLine {
  id: string;
  design: string;
  name: string;
  type: string;
  typeCode: string;
  weight: string;
  weaver: string;
  /** Catalogue/receipt price, kept so a discount can be shown against it. */
  originalPrice: number;
  /** What it is actually selling for — editable at the Payment step. */
  soldPrice: number;
}

export const cartTotal = (lines: SaleLine[]) =>
  lines.reduce((sum, l) => sum + l.soldPrice, 0);

export const cartOriginalTotal = (lines: SaleLine[]) =>
  lines.reduce((sum, l) => sum + l.originalPrice, 0);
