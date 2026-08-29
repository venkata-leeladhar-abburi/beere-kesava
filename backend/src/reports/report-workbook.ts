import * as ExcelJS from "exceljs";

export const XLSX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Excel refuses these in a sheet name, and caps the name at 31 characters. */
function safeSheetName(name: string): string {
  return name.replace(/[\\/*?:[\]]/g, "-").slice(0, 31) || "Report";
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Date);
}

/** Anything that isn't a scalar becomes JSON — a cell cannot hold a structure. */
function toCell(value: unknown): string | number | boolean | Date | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  if (typeof value === "object") return JSON.stringify(value);
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  return String(value);
}

/** "totalOutstanding" → "Total Outstanding" */
function humanise(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
}

function styleHeader(row: ExcelJS.Row): void {
  row.font = { bold: true, color: { argb: "FFFFFDF9" } };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF6E0F2D" } };
  row.alignment = { vertical: "middle" };
  row.height = 20;
}

/** Widen every column to its longest value, within sane bounds. */
function autoFitColumns(sheet: ExcelJS.Worksheet): void {
  sheet.columns.forEach((column) => {
    let widest = 10;
    column.eachCell?.({ includeEmpty: false }, (cell) => {
      widest = Math.max(widest, String(cell.value ?? "").length + 2);
    });
    column.width = Math.min(widest, 60);
  });
}

/** A list of records becomes a header row plus one row per record. */
function addTableSheet(workbook: ExcelJS.Workbook, name: string, rows: Record<string, unknown>[]): void {
  const sheet = workbook.addWorksheet(safeSheetName(name));
  // A union of every row's keys, not just the first row's — a sparse record
  // set would otherwise silently drop columns.
  const keys = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  if (keys.length === 0) {
    sheet.addRow(["No data"]);
    return;
  }
  styleHeader(sheet.addRow(keys.map(humanise)));
  for (const row of rows) {
    sheet.addRow(keys.map((key) => toCell(row[key])));
  }
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  autoFitColumns(sheet);
}

/** A flat object becomes a two-column Metric/Value sheet. */
function addSummarySheet(workbook: ExcelJS.Workbook, name: string, data: Record<string, unknown>): void {
  const sheet = workbook.addWorksheet(safeSheetName(name));
  styleHeader(sheet.addRow(["Metric", "Value"]));
  for (const [key, value] of Object.entries(data)) {
    sheet.addRow([humanise(key), toCell(value)]);
  }
  autoFitColumns(sheet);
}

/**
 * Turns whatever a ReportsService method returned into an .xlsx workbook.
 *
 * The three report handlers have three unrelated shapes — a flat summary
 * object, a list of records, and an object whose values are lists — and new
 * ones will differ again. Rather than a per-report writer that silently
 * omits fields the day a shape changes, this walks the value: lists become
 * tables, nested lists become their own sheets, and leftover scalars are
 * collected into a Summary sheet. Nothing in the report can fall out
 * unnoticed.
 */
export async function buildReportWorkbook(reportName: string, data: unknown): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Beere Kesava & Brothers Silks ERP";
  workbook.created = new Date();

  if (Array.isArray(data)) {
    const rows = data.filter(isPlainObject);
    if (rows.length === data.length && rows.length > 0) {
      addTableSheet(workbook, reportName, rows);
    } else {
      // A list of scalars still deserves a column rather than a JSON blob.
      const sheet = workbook.addWorksheet(safeSheetName(reportName));
      styleHeader(sheet.addRow(["Value"]));
      data.forEach((value) => sheet.addRow([toCell(value)]));
      autoFitColumns(sheet);
    }
  } else if (isPlainObject(data)) {
    const scalars: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      const records = Array.isArray(value) ? value.filter(isPlainObject) : [];
      if (Array.isArray(value) && records.length === value.length && records.length > 0) {
        addTableSheet(workbook, humanise(key), records);
      } else {
        scalars[key] = value;
      }
    }
    if (Object.keys(scalars).length > 0) {
      addSummarySheet(workbook, "Summary", scalars);
    }
  } else {
    const sheet = workbook.addWorksheet(safeSheetName(reportName));
    sheet.addRow([toCell(data)]);
  }

  // A workbook with no sheet at all is an invalid file Excel refuses to open —
  // an empty report must still produce something openable.
  if (workbook.worksheets.length === 0) {
    workbook.addWorksheet(safeSheetName(reportName)).addRow(["No data for this period"]);
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
