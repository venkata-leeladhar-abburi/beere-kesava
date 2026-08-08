/**
 * Default cell renderers per ColumnType — design-system/04-DATA-DISPLAY.md
 * Part C. Callers only reach for `cell` when the default isn't enough
 * (e.g. a StatusPill needing a taxonomy lookup from Phase 6).
 *
 * `code` is the ONLY type that renders in the mono font — every other
 * numeric/date type uses Inter with tabular figures, which does the same
 * column-alignment job mono was being misused for app-wide (Phase 6 audit).
 */
import type { CSSProperties, ReactNode } from "react";
import type { ColumnDef } from "./columns";

const tabular: CSSProperties = {
  fontVariantNumeric: "tabular-nums lining-nums",
};

function formatDate(value: unknown, withTime = false): string {
  if (!(value instanceof Date) && typeof value !== "string" && typeof value !== "number") return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const datePart = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  if (!withTime) return datePart;
  const timePart = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  return `${datePart}, ${timePart}`;
}

export function defaultCell<T>(col: ColumnDef<T>, value: unknown): ReactNode {
  if (value == null || value === "") {
    return <span style={{ color: "var(--text-tertiary)" }}>—</span>;
  }

  switch (col.type) {
    case "currency": {
      const n = Number(value);
      if (Number.isNaN(n)) return String(value);
      return (
        <span style={tabular}>
          {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n)}
        </span>
      );
    }
    case "number":
      return <span style={tabular}>{new Intl.NumberFormat("en-IN").format(Number(value))}</span>;
    case "percent":
      return <span style={tabular}>{Number(value).toFixed(1)}%</span>;
    case "date":
      return <span style={tabular}>{formatDate(value)}</span>;
    case "datetime":
      return <span style={tabular}>{formatDate(value, true)}</span>;
    case "code":
      return (
        <span
          style={{
            fontFamily: "var(--font-code)",
            fontSize: "var(--text-code-md)",
            background: "var(--surface-sunken)",
            borderRadius: "var(--radius-xs)",
            padding: "2px 6px",
            whiteSpace: "nowrap",
          }}
        >
          {String(value)}
        </span>
      );
    case "boolean":
      return (
        <span aria-label={value ? "Yes" : "No"} style={{ color: value ? "var(--text-success)" : "var(--text-tertiary)" }}>
          {value ? "✓" : "–"}
        </span>
      );
    default:
      return String(value);
  }
}
