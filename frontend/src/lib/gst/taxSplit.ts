/**
 * Intra-state vs inter-state GST split — design-system/07-DOCUMENTS.md Part I.1.
 * ═══════════════════════════════════════════════════════════════════════════
 * Determined by comparing the first two digits of the supplier's GSTIN (the
 * state code) against the place of supply's state code.
 */
export type TaxKind = "intra" | "inter";

export function taxSplitKind(supplierGstin: string | undefined | null, placeOfSupplyCode: string | undefined | null): TaxKind {
  const supplierState = (supplierGstin ?? "").slice(0, 2);
  if (!supplierState || !placeOfSupplyCode) return "intra"; // default, e.g. no GSTIN on file yet
  return supplierState === placeOfSupplyCode ? "intra" : "inter";
}

export interface TaxLine {
  label: string;
  ratePct: number;
  amountPaise: number;
}

/**
 * Given a taxable value (in paise) and a GST rate, returns the tax lines to
 * display — CGST+SGST split in half for intra-state, one IGST line for
 * inter-state. Rounded to the nearest paise per line (Part I.5).
 */
export function taxLines(taxableValuePaise: number, ratePct: number, kind: TaxKind): TaxLine[] {
  if (kind === "inter") {
    return [{ label: "IGST", ratePct, amountPaise: Math.round((taxableValuePaise * ratePct) / 100) }];
  }
  const halfRate = ratePct / 2;
  const cgst = Math.round((taxableValuePaise * halfRate) / 100);
  const sgst = Math.round((taxableValuePaise * halfRate) / 100);
  return [
    { label: "CGST", ratePct: halfRate, amountPaise: cgst },
    { label: "SGST", ratePct: halfRate, amountPaise: sgst },
  ];
}
