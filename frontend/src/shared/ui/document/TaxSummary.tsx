/**
 * TaxSummary — design-system/07-DOCUMENTS.md Part G.1 ⑥ / Part I.3.
 * Mandatory when a document contains more than one tax rate — render
 * unconditionally and let the caller decide whether to include it (Part
 * I.3 says "mandatory when >1 rate", not "always").
 */
import * as React from "react";

export interface TaxSummaryRow {
  hsn: string;
  taxableLabel: string;
  cgstLabel?: string;
  sgstLabel?: string;
  igstLabel?: string;
  totalTaxLabel: string;
}

export interface TaxSummaryProps {
  rows: TaxSummaryRow[];
  totalRow: TaxSummaryRow;
  /** True for inter-state (IGST only); false/undefined for intra-state (CGST+SGST). */
  interState?: boolean;
}

export function TaxSummary({ rows, totalRow, interState }: TaxSummaryProps) {
  return (
    <table className="bk-doc__table bk-doc__tax-summary" style={{ marginTop: "5mm" }}>
      <thead>
        <tr>
          <th style={{ textAlign: "start" }}>HSN</th>
          <th data-num style={{ textAlign: "end" }}>Taxable</th>
          {interState ? (
            <th data-num style={{ textAlign: "end" }}>IGST</th>
          ) : (
            <>
              <th data-num style={{ textAlign: "end" }}>CGST</th>
              <th data-num style={{ textAlign: "end" }}>SGST</th>
            </>
          )}
          <th data-num style={{ textAlign: "end" }}>Total Tax</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td style={{ fontFamily: "var(--font-code)" }}>{r.hsn}</td>
            <td data-num>{r.taxableLabel}</td>
            {interState ? <td data-num>{r.igstLabel}</td> : (
              <>
                <td data-num>{r.cgstLabel}</td>
                <td data-num>{r.sgstLabel}</td>
              </>
            )}
            <td data-num>{r.totalTaxLabel}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr style={{ fontWeight: 600 }}>
          <td></td>
          <td data-num>{totalRow.taxableLabel}</td>
          {interState ? <td data-num>{totalRow.igstLabel}</td> : (
            <>
              <td data-num>{totalRow.cgstLabel}</td>
              <td data-num>{totalRow.sgstLabel}</td>
            </>
          )}
          <td data-num>{totalRow.totalTaxLabel}</td>
        </tr>
      </tfoot>
    </table>
  );
}
