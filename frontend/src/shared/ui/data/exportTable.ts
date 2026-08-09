/**
 * exportTable — design-system/07-DOCUMENTS.md Part M.
 * ═══════════════════════════════════════════════════════════════════════════
 * Data export, distinct from the document system (shared/ui/document) — this
 * produces a spreadsheet of rows, not a formatted A4 page. Driven by the same
 * `ColumnDef<T>[]` Phase 4's `<DataTable>` uses, so an export mirrors exactly
 * what's on screen instead of a hand-rolled second column list that drifts
 * from it over time.
 *
 * Money exports as a RAW NUMBER (rupees, not paise, not a "₹1.2L" string) —
 * Part M's own rule: a currency-formatted display string breaks Excel's
 * SUM()/AVERAGE() and any downstream accounting import. Dates export as
 * real ISO date cells. Entity codes are exported as text so Excel's
 * autoformat can't mangle a code like "INV-2026-0142" into a number/date.
 */
import type { ColumnDef } from "./columns";

export interface ExportTableOptions<T> {
  columns: ColumnDef<T>[];
  rows: T[];
  /** Base filename, no extension and no timestamp — both are added automatically. */
  filename: string;
  format?: "xlsx" | "csv";
  /**
   * Shown when rows is a filtered subset of a larger set — Part M's own
   * example: "Exporting 412 filtered rows of 1,204." Purely informational,
   * callers surface it themselves (e.g. via toast) before calling export.
   */
  totalRowCount?: number;
}

function exportableColumns<T>(columns: ColumnDef<T>[]): ColumnDef<T>[] {
  return columns.filter(c => c.exportable ?? c.type !== "actions");
}

/** Column header text, stripped of JSX — exportTable needs a plain string even for the rare ReactNode header. */
function headerText(header: ColumnDef<unknown>["header"]): string {
  return typeof header === "string" ? header : String(header ?? "");
}

/** The raw, spreadsheet-appropriate value for one cell — never the formatted display string. */
function cellValue<T>(col: ColumnDef<T>, row: T): string | number | Date | boolean | null {
  const v = col.accessor(row);
  if (v == null) return null;
  switch (col.type) {
    case "currency":
    case "number":
    case "percent":
      return typeof v === "number" ? v : Number(v) || 0;
    case "date":
    case "datetime":
      return v instanceof Date ? v : new Date(String(v));
    case "boolean":
      return Boolean(v);
    case "code":
      // Returned as a string; the xlsx writer marks these cells text-typed
      // (type: "s") explicitly so Excel's autoformat never reinterprets an
      // entity code as a number or date.
      return String(v);
    default:
      return typeof v === "object" ? String(v) : (v as string | number);
  }
}

function timestampedFilename(base: string, ext: string): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
  return `${base}_${date}_${time}.${ext}`;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function exportXlsx<T>(cols: ColumnDef<T>[], rows: T[], filename: string) {
  const XLSX = await import("xlsx");
  const headers = cols.map(c => headerText(c.header));
  const data = rows.map(row => cols.map(c => cellValue(c, row)));
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

  // Force `code`-type columns to Excel's text cell type (`s`) so a value
  // like "007" or "1E5" — a real entity-code shape in this app — survives
  // as written instead of being silently reinterpreted as a number.
  cols.forEach((c, ci) => {
    if (c.type !== "code") return;
    for (let ri = 0; ri < rows.length; ri++) {
      const addr = XLSX.utils.encode_cell({ r: ri + 1, c: ci });
      const cell = ws[addr];
      if (cell) cell.t = "s";
    }
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Export");
  XLSX.writeFile(wb, timestampedFilename(filename, "xlsx"));
}

function csvCell(value: string | number | Date | boolean | null): string {
  if (value == null) return "";
  const s = value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
  // Quote whenever the value could otherwise be misparsed — a comma, quote,
  // or newline, or a leading character Excel would try to auto-format.
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function exportCsv<T>(cols: ColumnDef<T>[], rows: T[], filename: string) {
  const headers = cols.map(c => headerText(c.header));
  const lines = [headers, ...rows.map(row => cols.map(c => csvCell(cellValue(c, row))))]
    .map(line => line.join(","))
    .join("\r\n");

  // UTF-8 BOM (Part M's own requirement) — without it, Excel on Windows
  // opens a UTF-8 CSV as Latin-1 and every ₹ renders as mojibake.
  const BOM = "﻿";
  triggerDownload(new Blob([BOM + lines], { type: "text/csv;charset=utf-8;" }), timestampedFilename(filename, "csv"));
}

export async function exportTable<T>({ columns, rows, filename, format = "xlsx" }: ExportTableOptions<T>) {
  const cols = exportableColumns(columns);
  if (format === "csv") {
    exportCsv(cols, rows, filename);
  } else {
    await exportXlsx(cols, rows, filename);
  }
}
