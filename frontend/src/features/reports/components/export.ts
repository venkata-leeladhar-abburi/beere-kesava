// Client-side export helpers for the Reports page. The Download buttons were
// previously decorative — every one of them rendered without an onClick.

import { buildWorkbook, buildXlsx, type CellValue, type SheetSpec } from "./xlsx";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Triggers a browser download for an in-memory blob. */
function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoking synchronously can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function saveXlsxBytes(bytes: Uint8Array, filename: string): void {
  // Copy into a fresh ArrayBuffer so the Blob never sees a SharedArrayBuffer view.
  const blob = new Blob([bytes.slice().buffer as ArrayBuffer], { type: XLSX_MIME });
  saveBlob(blob, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}

/**
 * Writes the rows out as a real .xlsx workbook. Values that are already
 * numbers land in Excel as numbers (so totals and sorting work); everything
 * else goes in as text.
 */
export function downloadXlsx(
  filename: string,
  sheetName: string,
  headers: string[],
  rows: CellValue[][]
): void {
  saveXlsxBytes(buildXlsx(sheetName, headers, rows), filename);
}

/** Writes a multi-sheet workbook. */
export function downloadWorkbook(filename: string, sheets: SheetSpec[]): void {
  saveXlsxBytes(buildWorkbook(sheets), filename);
}

/** "Retail Sales Report" + "August 2026" -> "Retail_Sales_Report_August_2026". */
export function exportFilename(
  reportName: string,
  ...parts: (string | null | undefined)[]
): string {
  return [reportName, ...parts.filter(Boolean)]
    .join("_")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}
