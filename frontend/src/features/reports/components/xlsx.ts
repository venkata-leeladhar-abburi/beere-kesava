// Minimal, dependency-free XLSX writer for the Reports page exports.
//
// The reports used to export CSV under a "Download Excel" button; Excel opened
// it, but every number arrived as text and the sheet had no header formatting.
// This builds a real (small) SpreadsheetML workbook instead: a stored
// (uncompressed) ZIP containing the parts Excel needs. Uncompressed entries are
// valid ZIP — Excel, LibreOffice and Numbers all accept them — which keeps this
// to a CRC-32 table and some XML rather than a deflate implementation.

/** A value with its own format, for tables whose rows mix units (a summary). */
export interface TypedCell {
  value: string | number | Date | null;
  kind: ColumnKind;
}

export type CellValue = string | number | Date | TypedCell | null | undefined;

/**
 * How a column's values are written. Numbers stay numbers either way; the kind
 * only picks the display format (₹ amounts get thousands separators, dates
 * become real Excel dates that sort and filter by date, not as text).
 * "figure" is a number that is never totalled — a rate, a day count.
 */
export type ColumnKind = "text" | "number" | "figure" | "money" | "percent" | "date";

export interface SheetSpec {
  name: string;
  headers: string[];
  rows: CellValue[][];
  /** Per-column format, by index. Missing entries are inferred from the value. */
  columns?: ColumnKind[];
  /** Appends a "Total" row summing every "number" and "money" column. */
  totals?: boolean;
  /** Label/value lines written above the table (report name, period, …). */
  preamble?: CellValue[][];
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]!) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Escapes text for XML content, and strips the control chars XML forbids. */
function esc(value: string): string {
  return (
    value
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
  );
}

/** 0 -> A, 25 -> Z, 26 -> AA. */
export function columnName(index: number): string {
  let n = index;
  let name = "";
  do {
    name = String.fromCharCode(65 + (n % 26)) + name;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return name;
}

/** Excel caps sheet names at 31 chars and forbids : \ / ? * [ ]. */
export function safeSheetName(name: string): string {
  const cleaned = name
    .replace(/[:\\/?*[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return (cleaned || "Report").slice(0, 31);
}

/** Local calendar date/time as an Excel serial (days since 30 Dec 1899). */
export function excelDateSerial(d: Date): number {
  const utc = Date.UTC(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    d.getHours(),
    d.getMinutes(),
    d.getSeconds()
  );
  return (utc - Date.UTC(1899, 11, 30)) / 86_400_000;
}

const ENCODER = new TextEncoder();

// Cell formats, by index into <cellXfs> in STYLES below.
const S = {
  plain: 0,
  header: 1,
  money: 2,
  date: 3,
  percent: 4,
  totalLabel: 5,
  totalMoney: 6,
  totalNumber: 7,
  title: 8,
  label: 9,
  integer: 10,
} as const;

type PlainValue = Exclude<CellValue, TypedCell>;

const isTyped = (v: CellValue): v is TypedCell =>
  typeof v === "object" && v !== null && !(v instanceof Date);

function cellXml(ref: string, value: PlainValue, style: number, formula?: string): string {
  const s = style ? ` s="${style}"` : "";
  if (formula) {
    const cached = typeof value === "number" && Number.isFinite(value) ? `<v>${value}</v>` : "";
    return `<c r="${ref}"${s}><f>${esc(formula)}</f>${cached}</c>`;
  }
  if (value === null || value === undefined || value === "") return `<c r="${ref}"${s}/>`;
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return `<c r="${ref}"${s}/>`;
    return `<c r="${ref}"${s}><v>${excelDateSerial(value)}</v></c>`;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return `<c r="${ref}"${s}><v>${value}</v></c>`;
  }
  return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${esc(String(value))}</t></is></c>`;
}

/** Turns an ISO date string in a date column into a real Date; anything else passes through. */
function coerceDate(value: CellValue): CellValue {
  if (isTyped(value)) return value.kind === "date" ? coerceDate(value.value) : value;
  if (typeof value !== "string" || !value) return value;
  if (!/^\d{4}-\d{2}-\d{2}/.test(value)) return value;
  // A bare yyyy-mm-dd is a calendar date, not UTC midnight (which would show
  // as the previous day west of Greenwich, or carry a stray 05:30 here).
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(value);
  return isNaN(d.getTime()) ? value : d;
}

function bodyStyle(kind: ColumnKind | undefined, value: PlainValue): number {
  if (value instanceof Date) return S.date;
  if (typeof value !== "number") return S.plain;
  if (kind === "money") return S.money;
  if (kind === "percent") return S.percent;
  if (kind === "number" && Number.isInteger(value)) return S.integer;
  return S.plain;
}

function displayLength(cell: CellValue, columnKind: ColumnKind | undefined): number {
  const value = isTyped(cell) ? cell.value : cell;
  const kind = isTyped(cell) ? cell.kind : columnKind;
  if (value instanceof Date) return 11;
  if (typeof value === "number") {
    const digits = Math.round(Math.abs(value)).toString().length;
    // Thousands separators + two decimals on money columns.
    return kind === "money" ? digits + Math.floor((digits - 1) / 3) + 3 : String(value).length;
  }
  return String(value ?? "").length;
}

function sheetXml(spec: SheetSpec): string {
  const { headers, columns = [], totals = false, preamble = [] } = spec;
  const rows = spec.rows.map((row) =>
    row.map((v, c) => (columns[c] === "date" ? coerceDate(v) : v))
  );
  const colCount = Math.max(headers.length, ...rows.map((r) => r.length), 1);

  // Column widths sized to the widest value seen, within sane bounds. The
  // preamble's first column is a short label, so it only widens column A.
  const widths: number[] = [];
  for (let c = 0; c < colCount; c++) {
    let max = String(headers[c] ?? "").length;
    for (const row of rows) max = Math.max(max, displayLength(row[c], columns[c]));
    if (c === 0) for (const line of preamble) max = Math.max(max, String(line[0] ?? "").length);
    widths.push(Math.min(60, Math.max(10, max + 2)));
  }
  const cols = `<cols>${widths
    .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
    .join("")}</cols>`;

  const out: string[] = [];
  let r = 0;

  // Preamble: first line is the title, the rest are "Label | value" pairs.
  preamble.forEach((line, i) => {
    r += 1;
    const cells = line
      .map((cell, c) => {
        const v = isTyped(cell) ? cell.value : cell;
        if (v === null || v === undefined || v === "") return "";
        const style = i === 0 ? S.title : c === 0 ? S.label : v instanceof Date ? S.date : S.plain;
        return cellXml(`${columnName(c)}${r}`, v, style);
      })
      .join("");
    out.push(`<row r="${r}">${cells}</row>`);
  });
  if (preamble.length) r += 1; // one blank line between the title block and the table

  r += 1;
  const headerRow = r;
  out.push(
    `<row r="${r}">${Array.from({ length: colCount }, (_, c) =>
      cellXml(`${columnName(c)}${r}`, headers[c] ?? "", S.header)
    ).join("")}</row>`
  );

  for (const row of rows) {
    r += 1;
    const cells: string[] = [];
    for (let c = 0; c < colCount; c++) {
      const value = row[c];
      const kind = isTyped(value) ? value.kind : columns[c];
      const plain = isTyped(value) ? value.value : value;
      // Empty cells are simply omitted — the row still lines up by ref.
      if (plain === null || plain === undefined || plain === "") continue;
      cells.push(cellXml(`${columnName(c)}${r}`, plain, bodyStyle(kind, plain)));
    }
    out.push(`<row r="${r}">${cells.join("")}</row>`);
  }
  const lastDataRow = r;

  if (totals && rows.length > 0) {
    r += 1;
    const cells: string[] = [cellXml(`A${r}`, "Total", S.totalLabel)];
    for (let c = 1; c < colCount; c++) {
      const kind = columns[c];
      const numeric = kind === "money" || kind === "number";
      if (!numeric) continue;
      const sum = rows.reduce(
        (s, row) => (typeof row[c] === "number" ? s + (row[c] as number) : s),
        0
      );
      const col = columnName(c);
      cells.push(
        cellXml(
          `${col}${r}`,
          Math.round(sum * 100) / 100,
          kind === "money" ? S.totalMoney : S.totalNumber,
          `SUM(${col}${headerRow + 1}:${col}${lastDataRow})`
        )
      );
    }
    out.push(`<row r="${r}">${cells.join("")}</row>`);
  }

  const filterRef = `A${headerRow}:${columnName(colCount - 1)}${Math.max(lastDataRow, headerRow)}`;
  const pane = `<pane ySplit="${headerRow}" topLeftCell="A${headerRow + 1}" activePane="bottomLeft" state="frozen"/>`;

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0">${pane}</sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/>${cols}<sheetData>${out.join("")}</sheetData><autoFilter ref="${filterRef}"/></worksheet>`;
}

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;

// numFmt 4 is Excel's built-in "#,##0.00"; 164/165 are custom.
const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="2"><numFmt numFmtId="164" formatCode="dd\\-mmm\\-yyyy"/><numFmt numFmtId="165" formatCode="0.0&quot;%&quot;"/></numFmts><fonts count="4"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FF4A061B"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="14"/><color rgb="FF4A061B"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF3E7D3"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left/><right/><top style="thin"><color rgb="FF4A061B"/></top><bottom style="double"><color rgb="FF4A061B"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="11"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="4" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="2" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1"/><xf numFmtId="4" fontId="2" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1"/><xf numFmtId="0" fontId="2" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1"/><xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;

/** Sheet names must be unique within a workbook (case-insensitively). */
function uniqueSheetNames(names: string[]): string[] {
  const seen = new Set<string>();
  return names.map((raw) => {
    const base = safeSheetName(raw);
    let name = base;
    for (let n = 2; seen.has(name.toLowerCase()); n++) {
      const suffix = ` (${n})`;
      name = base.slice(0, 31 - suffix.length) + suffix;
    }
    seen.add(name.toLowerCase());
    return name;
  });
}

function contentTypes(sheetCount: number): string {
  const sheets = Array.from(
    { length: sheetCount },
    (_, i) =>
      `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
  ).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${sheets}<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`;
}

function workbookRels(sheetCount: number): string {
  const sheets = Array.from(
    { length: sheetCount },
    (_, i) =>
      `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`
  ).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets}<Relationship Id="rId${sheetCount + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
}

function workbookXml(names: string[]): string {
  const sheets = names
    .map((n, i) => `<sheet name="${esc(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
    .join("");
  // fullCalcOnLoad: the totals row carries SUM formulas, recomputed on open
  // (each also has a cached value for viewers that never recalculate).
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets}</sheets><calcPr calcId="0" fullCalcOnLoad="1"/></workbook>`;
}

interface ZipEntry {
  name: string;
  data: Uint8Array;
}

/** Builds a store-only (method 0) ZIP archive. */
function zip(entries: ZipEntry[]): Uint8Array {
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = ENCODER.encode(entry.name);
    const crc = crc32(entry.data);
    const size = entry.data.length;

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true); // version needed to extract
    local.setUint16(6, 0x0800, true); // UTF-8 file names
    local.setUint16(8, 0, true); // compression: stored
    local.setUint16(10, 0, true); // mod time
    local.setUint16(12, 0x21, true); // mod date (1980-01-01)
    local.setUint32(14, crc, true);
    local.setUint32(18, size, true);
    local.setUint32(22, size, true);
    local.setUint16(26, nameBytes.length, true);
    local.setUint16(28, 0, true); // extra field length
    chunks.push(new Uint8Array(local.buffer), nameBytes, entry.data);

    const dir = new DataView(new ArrayBuffer(46));
    dir.setUint32(0, 0x02014b50, true);
    dir.setUint16(4, 20, true); // version made by
    dir.setUint16(6, 20, true); // version needed
    dir.setUint16(8, 0x0800, true);
    dir.setUint16(10, 0, true);
    dir.setUint16(12, 0, true);
    dir.setUint16(14, 0x21, true);
    dir.setUint32(16, crc, true);
    dir.setUint32(20, size, true);
    dir.setUint32(24, size, true);
    dir.setUint16(28, nameBytes.length, true);
    dir.setUint32(42, offset, true);
    central.push(new Uint8Array(dir.buffer), nameBytes);

    offset += 30 + nameBytes.length + size;
  }

  const centralSize = central.reduce((sum, c) => sum + c.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, entries.length, true);
  end.setUint16(10, entries.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);

  const all = [...chunks, ...central, new Uint8Array(end.buffer)];
  const out = new Uint8Array(all.reduce((sum, c) => sum + c.length, 0));
  let pos = 0;
  for (const chunk of all) {
    out.set(chunk, pos);
    pos += chunk.length;
  }
  return out;
}

/** Builds a workbook with one sheet per spec, in order, as raw bytes. */
export function buildWorkbook(sheets: SheetSpec[]): Uint8Array {
  const list = sheets.length ? sheets : [{ name: "Report", headers: [], rows: [] }];
  const names = uniqueSheetNames(list.map((s) => s.name));
  return zip([
    { name: "[Content_Types].xml", data: ENCODER.encode(contentTypes(list.length)) },
    { name: "_rels/.rels", data: ENCODER.encode(ROOT_RELS) },
    { name: "xl/workbook.xml", data: ENCODER.encode(workbookXml(names)) },
    { name: "xl/_rels/workbook.xml.rels", data: ENCODER.encode(workbookRels(list.length)) },
    { name: "xl/styles.xml", data: ENCODER.encode(STYLES) },
    ...list.map((spec, i) => ({
      name: `xl/worksheets/sheet${i + 1}.xml`,
      data: ENCODER.encode(sheetXml(spec)),
    })),
  ]);
}

/** Builds a single-sheet .xlsx workbook as raw bytes. */
export function buildXlsx(sheetName: string, headers: string[], rows: CellValue[][]): Uint8Array {
  return buildWorkbook([{ name: sheetName, headers, rows }]);
}
