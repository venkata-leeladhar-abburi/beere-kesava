/**
 * SignatureBlock — design-system/07-DOCUMENTS.md Part G.1 ⑨.
 * The one other place brand text appears ("For {Firm Name}") — Part X6.
 * Left side carries the computer-generated declaration; right side the
 * signature line. `break-before: avoid` (print.css) keeps this from being
 * orphaned onto its own page.
 */
import * as React from "react";

export interface SignatureBlockProps {
  firmName: string;
  /** e.g. "Prepared by" / "Approved by" for a PO — omit for the default single "Authorised Signatory". */
  roleLabel?: string;
}

export function SignatureBlock({ firmName, roleLabel = "Authorised Signatory" }: SignatureBlockProps) {
  return (
    <div className="bk-doc__signature" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "10mm", paddingTop: "4mm" }}>
      <div style={{ fontSize: "var(--doc-small)", color: "var(--print-ink-faint)", maxWidth: "80mm" }}>
        This is a computer-generated document.
      </div>
      <div style={{ textAlign: "center", minWidth: "50mm" }}>
        <div style={{ fontSize: "var(--doc-body)", color: "var(--print-ink)", marginBottom: "10mm" }}>For {firmName}</div>
        <div style={{ borderTop: "0.5pt solid var(--print-rule)", paddingTop: "1.5mm" }}>
          <span style={{ fontSize: "var(--doc-small)", color: "var(--print-ink-muted)" }}>{roleLabel}</span>
        </div>
      </div>
    </div>
  );
}
