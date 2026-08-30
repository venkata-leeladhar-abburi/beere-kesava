// Client-side export helpers for the Reports page. The Download buttons were
// previously decorative — every one of them rendered without an onClick.

/** Serialises rows to CSV (Excel-openable) and triggers a browser download. */
export function downloadCsv(filename: string, headers: string[], rows: (string | number | null | undefined)[][]): void {
  const escape = (v: string | number | null | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map(r => r.map(escape).join(",")).join("\n");
  // Leading BOM so Excel opens UTF-8 (₹, names) correctly.
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * PDF export goes through the browser's own print-to-PDF dialog — there is no
 * server-side renderer to call, and a real one is a backend job.
 */
export function printReport(): void {
  window.print();
}

/** "Retail Sales Report" + "August 2026" -> "Retail_Sales_Report_August_2026". */
export function exportFilename(reportName: string, periodLabel: string): string {
  return `${reportName}_${periodLabel}`.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "");
}
