/**
 * TermsBlock — design-system/07-DOCUMENTS.md Part G.1 ⑧.
 * Bank details (left) + terms & conditions (right), or just terms alone.
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
}

export function TermsBlock({ bank, terms }: TermsBlockProps) {
  if (!bank && !terms?.length) return null;
  return (
    <div className="bk-doc__terms" style={{ display: "grid", gridTemplateColumns: bank ? "1fr 1fr" : "1fr", gap: "6mm", marginTop: "6mm", paddingTop: "3mm", borderTop: "0.25pt solid var(--print-rule-light)" }}>
      {bank && (
        <div>
          <div style={{ fontSize: "var(--doc-table-head)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--print-ink-muted)", marginBottom: "1.5mm" }}>Bank Details</div>
          {bank.accountNo && <div style={{ fontSize: "var(--doc-small)", color: "var(--print-ink)" }}>A/c {bank.accountNo}</div>}
          {bank.ifsc && <div style={{ fontSize: "var(--doc-small)", color: "var(--print-ink)" }}>IFSC {bank.ifsc}</div>}
          {bank.bankName && <div style={{ fontSize: "var(--doc-small)", color: "var(--print-ink)" }}>{bank.bankName}</div>}
        </div>
      )}
      {terms && terms.length > 0 && (
        <div>
          <div style={{ fontSize: "var(--doc-table-head)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--print-ink-muted)", marginBottom: "1.5mm" }}>Terms &amp; Conditions</div>
          <ol style={{ margin: 0, paddingLeft: "4mm", display: "flex", flexDirection: "column", gap: "0.5mm" }}>
            {terms.map((t, i) => (
              <li key={i} style={{ fontSize: "var(--doc-small)", color: "var(--print-ink-muted)" }}>{t}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
