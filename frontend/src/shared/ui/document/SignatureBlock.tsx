/**
 * SignatureBlock — design-system/07-DOCUMENTS.md Part G.1 ⑨.
 * `break-before: avoid` (print.css) keeps this from being orphaned onto its
 * own page.
 */
import * as React from "react";

export interface SignatureBlockProps {
  firmName: string;
  /** e.g. "Prepared by" / "Approved by" for a PO — defaults to the single "Authorised Signatory". */
  roleLabel?: string;
}

export function SignatureBlock({ firmName, roleLabel = "Authorised Signatory" }: SignatureBlockProps) {
  return (
    <div
      className="bk-doc__signature"
      style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-end",
        marginTop: "9mm", paddingTop: "4mm", borderTop: "0.3mm solid var(--doc-rule)",
      }}
    >
      <div style={{ maxWidth: "80mm" }}>
        <div style={{ fontSize: "var(--doc-small)", color: "var(--doc-muted)", fontStyle: "italic" }}>
          This is a computer-generated document.
        </div>
        <div style={{ fontSize: "var(--doc-small)", color: "var(--doc-gold-text)", marginTop: "1.5mm", letterSpacing: "0.10em", textTransform: "uppercase", fontWeight: 600 }}>
          Tradition · Trust · Timeless Quality
        </div>
      </div>
      <div style={{ textAlign: "center", minWidth: "52mm" }}>
        <div style={{ fontSize: "var(--doc-body)", fontWeight: 600, color: "var(--doc-burgundy)", marginBottom: "11mm" }}>
          For {firmName}
        </div>
        <div style={{ borderTop: "0.4mm solid var(--doc-rule)", paddingTop: "1.5mm" }}>
          <span style={{ fontSize: "var(--doc-small)", color: "var(--doc-muted)", letterSpacing: "0.04em" }}>{roleLabel}</span>
        </div>
      </div>
    </div>
  );
}
