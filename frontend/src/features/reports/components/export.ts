// Client-side export helpers for the Reports page. The Download buttons were
// previously decorative — every one of them rendered without an onClick.

import { buildXlsx, type CellValue } from "./xlsx";

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

/**
 * Writes the rows out as a real .xlsx workbook. Values that are already
 * numbers land in Excel as numbers (so totals and sorting work); everything
 * else goes in as text.
 */
export function downloadXlsx(
  filename: string,
  sheetName: string,
  headers: string[],
  rows: CellValue[][],
): void {
  const bytes = buildXlsx(sheetName, headers, rows);
  // Copy into a fresh ArrayBuffer so the Blob never sees a SharedArrayBuffer view.
  const blob = new Blob([bytes.slice().buffer as ArrayBuffer], { type: XLSX_MIME });
  saveBlob(blob, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}

/** "Retail Sales Report" + "August 2026" -> "Retail_Sales_Report_August_2026". */
export function exportFilename(reportName: string, periodLabel: string): string {
  return `${reportName}_${periodLabel}`.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "");
}
