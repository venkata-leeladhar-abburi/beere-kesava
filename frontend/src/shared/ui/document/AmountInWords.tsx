/**
 * AmountInWords — design-system/07-DOCUMENTS.md Part G.1 ⑦ / Part I.4.
 */
import * as React from "react";

export function AmountInWords({ words }: { words: string }) {
  return (
    <div style={{ marginTop: "5mm", paddingTop: "3mm", borderTop: "0.25pt solid var(--print-rule-light)" }}>
      <span style={{ fontSize: "var(--doc-amount-words)", fontWeight: 500, color: "var(--print-ink-muted)" }}>Amount in words: </span>
      <span style={{ fontSize: "var(--doc-amount-words)", fontWeight: 500, color: "var(--print-ink)" }}>{words}</span>
    </div>
  );
}
