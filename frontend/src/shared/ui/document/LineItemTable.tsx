/**
 * LineItemTable — design-system/07-DOCUMENTS.md Part G.1 ④ / Part J.
 * ═══════════════════════════════════════════════════════════════════════════
 * Deliberately a different component from Phase 4's DataTable — no sorting,
 * no hover, no pagination. It exists to be page-break-aware in print
 * (`table-header-group` repeats columns on every page, `break-inside: avoid`
 * on each row) — see .bk-doc__table in print.css.
 */
import * as React from "react";

export interface LineItemColumn<T> {
  header: string;
  /** "start" (default) or "end" — end-aligned columns get tabular-nums via [data-num]. */
  align?: "start" | "end" | "center";
  width?: string;
  cell: (row: T, index: number) => React.ReactNode;
}

export interface LineItemTableProps<T> {
  columns: LineItemColumn<T>[];
  rows: T[];
}

export function LineItemTable<T>({ columns, rows }: LineItemTableProps<T>) {
  return (
    <table className="bk-doc__table" style={{ marginTop: "6mm" }}>
      <colgroup>
        {columns.map((c, i) => (
          <col key={i} style={c.width ? { width: c.width } : undefined} />
        ))}
      </colgroup>
      <thead>
        <tr>
          {columns.map((c, i) => (
            <th key={i} style={{ textAlign: c.align === "end" ? "end" : c.align === "center" ? "center" : "start" }}>
              {c.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri}>
            {columns.map((c, ci) => (
              <td key={ci} data-num={c.align === "end" || undefined} style={{ textAlign: c.align === "end" ? "end" : c.align === "center" ? "center" : "start" }}>
                {c.cell(row, ri)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
