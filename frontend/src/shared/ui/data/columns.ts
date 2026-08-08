/**
 * ColumnDef — design-system/04-DATA-DISPLAY.md Part C.
 * ═══════════════════════════════════════════════════════════════════════════
 * One column definition drives the desktop <DataTable>. Callers declare data
 * shape and intent (type) once; alignment, font and formatting follow from
 * `type` automatically instead of being hand-set per table (the root cause
 * of the app's 10 different <th> font sizes and the mono-everywhere problem —
 * see Part A of the same doc).
 */
import type * as React from "react";

export type ColumnType =
  | "text" | "number" | "currency" | "percent" | "date" | "datetime"
  | "code" | "status" | "badge" | "avatar" | "actions" | "boolean";

export type ColumnAlign = "start" | "center" | "end";

const DEFAULT_ALIGN: Partial<Record<ColumnType, ColumnAlign>> = {
  number: "end",
  currency: "end",
  percent: "end",
  boolean: "center",
  actions: "end",
};

export interface ColumnDef<T> {
  id: string;
  /** Usually a string; a ReactNode is accepted for the rare header that
   *  needs interactive content (e.g. a select-all checkbox). */
  header: React.ReactNode;
  accessor: (row: T) => unknown;

  type?: ColumnType;
  align?: ColumnAlign;

  sortable?: boolean;
  sortFn?: (a: T, b: T) => number;

  /** Render override — receives the accessor's raw value and the full row. */
  cell?: (value: unknown, row: T) => React.ReactNode;

  headerTooltip?: string;
  width?: number | "auto";

  /** Card-mode field importance (Part H.2): 1 = card title, 2 = card body
   *  pairs, 3 = hidden behind "Details". Only used when DataTable's
   *  `responsive` prop is set. Columns without a priority default to 2. */
  priority?: 1 | 2 | 3;
}

export function columnAlign<T>(col: ColumnDef<T>): ColumnAlign {
  return col.align ?? DEFAULT_ALIGN[col.type ?? "text"] ?? "start";
}

/** Default comparator for sortable columns without an explicit sortFn. */
export function defaultSort<T>(col: ColumnDef<T>): (a: T, b: T) => number {
  return (a, b) => {
    const av = col.accessor(a);
    const bv = col.accessor(b);
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === "number" && typeof bv === "number") return av - bv;
    if (av instanceof Date && bv instanceof Date) return av.getTime() - bv.getTime();
    return String(av).localeCompare(String(bv));
  };
}

export type SortDirection = "asc" | "desc" | "none";
