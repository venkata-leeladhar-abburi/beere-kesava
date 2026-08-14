/**
 * TermsBlock — design-system/07-DOCUMENTS.md Part G.1 ⑧.
 * Bank details and/or terms, each in its own card.
 */
import * as React from "react";

export interface BankDetails {
  accountNo?: string;
  ifsc?: string;
  bankName?: string;
}

export interface TermsBlockProps {
  bank?: BankDetails;
  terms?: string[];
  /** Heading for the terms column — e.g. "Dispatch Details" when reused for transport info. */
  termsLabel?: string;
}

export function TermsBlock({ bank, terms, termsLabel = "Terms & Conditions" }: TermsBlockProps) {
  const hasBank = !!bank && (bank.accountNo || bank.ifsc || bank.bankName);
  const hasTerms = !!terms?.length;
  if (!hasBank && !hasTerms) return null;

  return (
    <div
      className="bk-doc__terms"
      style={{
        display: "grid",
        // auto-fit rather than a hard "1fr 1fr": this block is also rendered
        // inside narrower columns, where two ~40mm cells would shred the bank
        // name over five lines. Below ~110mm it collapses to a single column.
        gridTemplateColumns: hasBank && hasTerms ? "repeat(auto-fit, minmax(52mm, 1fr))" : "1fr",
        gap: "4mm",
        marginTop: "4mm",
      }}
    >
      {hasBank && (
        <div className="bk-doc__card">
          <div className="bk-doc__eyebrow">Bank Details</div>
          <div style={{ marginTop: "1.5mm", display: "flex", flexDirection: "column", gap: "0.6mm" }}>
            {bank!.bankName && <div style={{ fontSize: "var(--doc-body)", color: "var(--doc-ink)", fontWeight: 600 }}>{bank!.bankName}</div>}
            {bank!.accountNo && (
              <div style={{ fontFamily: "var(--font-code)", fontSize: "var(--doc-code)", color: "var(--doc-muted)" }}>A/c {bank!.accountNo}</div>
            )}
            {bank!.ifsc && (
              <div style={{ fontFamily: "var(--font-code)", fontSize: "var(--doc-code)", color: "var(--doc-muted)" }}>IFSC {bank!.ifsc}</div>
            )}
          </div>
        </div>
      )}
      {hasTerms && (
        <div className="bk-doc__card">
          <div className="bk-doc__eyebrow">{termsLabel}</div>
          <div style={{ marginTop: "1.5mm", display: "flex", flexDirection: "column", gap: "0.8mm" }}>
            {terms!.map((t, i) => (
              // Terms are free-text strings and could repeat verbatim, so the text is
              // paired with its index for a guaranteed-unique key.
              // eslint-disable-next-line react/no-array-index-key
              <div key={`${t}-${i}`} style={{ fontSize: "var(--doc-small)", color: "var(--doc-muted)", lineHeight: 1.5 }}>{t}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
