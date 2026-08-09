/**
 * TotalsBlock — design-system/07-DOCUMENTS.md Part G.1 ⑤.
 * Right-aligned, 70mm wide. All amounts pre-formatted strings (from
 * lib/gst's formatPaise) — this component never does money arithmetic.
 */
import * as React from "react";

export interface TotalsRow {
  label: string;
  amount: string;
  /** Marks the grand-total row: larger, bold, top rule, filled band (Part G.1 ⑤). */
  grand?: boolean;
}

export function TotalsBlock({ rows }: { rows: TotalsRow[] }) {
  return (
    <div className="bk-doc__totals" style={{ marginTop: "6mm", display: "flex", justifyContent: "flex-end" }}>
      <div style={{ width: "70mm" }}>
        {rows.map((r, i) =>
          r.grand ? (
            <div
              key={i}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                marginTop: "2mm", paddingTop: "2mm", borderTop: "0.5pt solid var(--print-rule)",
                background: "var(--print-fill)", padding: "2mm 2mm",
              }}
            >
              <span style={{ fontSize: "var(--doc-total)", fontWeight: 600, color: "var(--print-ink)" }}>{r.label}</span>
              <span style={{ fontSize: "var(--doc-total)", fontWeight: 600, color: "var(--print-ink)", fontVariantNumeric: "tabular-nums" }}>{r.amount}</span>
            </div>
          ) : (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "0.8mm 2mm" }}>
              <span style={{ fontSize: "var(--doc-body)", color: "var(--print-ink-muted)" }}>{r.label}</span>
              <span style={{ fontSize: "var(--doc-body)", color: "var(--print-ink)", fontVariantNumeric: "tabular-nums" }}>{r.amount}</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
