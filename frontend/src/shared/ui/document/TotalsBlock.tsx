/**
 * TotalsBlock — design-system/07-DOCUMENTS.md Part G.1 ⑤.
 * Right-aligned card; the grand-total row is a brand gradient band.
 * All amounts arrive pre-formatted (from lib/gst's formatPaise) — this
 * component never does money arithmetic.
 */
import * as React from "react";

export interface TotalsRow {
  label: string;
  amount: string;
  /** Marks the grand-total row: larger, brand-filled band. */
  grand?: boolean;
}

export function TotalsBlock({ rows }: { rows: TotalsRow[] }) {
  return (
    <div className="bk-doc__totals" style={{ marginTop: "6mm", display: "flex", justifyContent: "flex-end" }}>
      <div className="bk-doc__totals-card">
        {rows.map((r, i) =>
          r.grand ? (
            <div
              key={i}
              className="bk-doc__totals-grand"
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3.2mm 4mm" }}
            >
              <span style={{ fontSize: "var(--doc-body)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.10em" }}>
                {r.label}
              </span>
              <span style={{ fontSize: "var(--doc-total)", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{r.amount}</span>
            </div>
          ) : (
            <div
              key={i}
              style={{
                display: "flex", justifyContent: "space-between", padding: "2.2mm 4mm",
                borderBottom: "0.25mm solid var(--doc-rule-soft)",
              }}
            >
              <span style={{ fontSize: "var(--doc-body)", color: "var(--doc-muted)" }}>{r.label}</span>
              <span style={{ fontSize: "var(--doc-body)", color: "var(--doc-ink)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                {r.amount}
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
