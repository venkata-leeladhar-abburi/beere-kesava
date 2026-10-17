import { describe, expect, it } from "vitest";
import { buildWorkbook, buildXlsx, columnName, excelDateSerial, safeSheetName } from "./xlsx";

const decoder = new TextDecoder();

/** Pulls one stored (method 0) entry back out of the archive, by name. */
function readEntry(bytes: Uint8Array, name: string): string {
  const text = decoder.decode(bytes);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 0;
  while (offset + 30 <= bytes.length && view.getUint32(offset, true) === 0x04034b50) {
    const size = view.getUint32(offset + 18, true);
    const nameLen = view.getUint16(offset + 26, true);
    const extraLen = view.getUint16(offset + 28, true);
    const entryName = decoder.decode(bytes.subarray(offset + 30, offset + 30 + nameLen));
    const start = offset + 30 + nameLen + extraLen;
    if (entryName === name) return decoder.decode(bytes.subarray(start, start + size));
    offset = start + size;
  }
  throw new Error(`entry ${name} not found in ${text.slice(0, 0)}archive`);
}

describe("columnName", () => {
  it("maps indexes to spreadsheet columns", () => {
    expect(columnName(0)).toBe("A");
    expect(columnName(25)).toBe("Z");
    expect(columnName(26)).toBe("AA");
    expect(columnName(51)).toBe("AZ");
    expect(columnName(52)).toBe("BA");
  });
});

describe("safeSheetName", () => {
  it("strips characters Excel rejects and caps the length", () => {
    expect(safeSheetName("Profit / Loss [2026]")).toBe("Profit Loss 2026");
    expect(safeSheetName("").length).toBeGreaterThan(0);
    expect(safeSheetName("x".repeat(60))).toHaveLength(31);
  });
});

describe("buildXlsx", () => {
  const bytes = buildXlsx(
    "Retail Sales Report",
    ["Date", "Customer", "Amount"],
    [
      ["2026-08-01", 'A "quoted" & <odd> name', 12500.5],
      ["2026-08-02", "Ravi Kumar", 300],
      ["2026-08-03", null, undefined],
    ]
  );

  it("produces a ZIP archive", () => {
    expect(Array.from(bytes.subarray(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
  });

  it("carries every part Excel requires", () => {
    for (const part of [
      "[Content_Types].xml",
      "_rels/.rels",
      "xl/workbook.xml",
      "xl/_rels/workbook.xml.rels",
      "xl/styles.xml",
      "xl/worksheets/sheet1.xml",
    ]) {
      expect(readEntry(bytes, part).length).toBeGreaterThan(0);
    }
  });

  it("writes numbers as numbers and escapes text", () => {
    const sheet = readEntry(bytes, "xl/worksheets/sheet1.xml");
    expect(sheet).toContain('<c r="C2"><v>12500.5</v></c>');
    expect(sheet).toContain("A &quot;quoted&quot; &amp; &lt;odd&gt; name");
    // Blank cells are omitted rather than written as empty strings.
    expect(sheet).not.toContain('r="B4"');
    expect(sheet).toContain('<row r="4">');
  });

  it("freezes the header row and adds a filter over the used range", () => {
    const sheet = readEntry(bytes, "xl/worksheets/sheet1.xml");
    expect(sheet).toContain('state="frozen"');
    expect(sheet).toContain('<autoFilter ref="A1:C4"/>');
  });

  it("names the sheet after the report", () => {
    expect(readEntry(bytes, "xl/workbook.xml")).toContain('name="Retail Sales Report"');
  });
});

describe("buildWorkbook", () => {
  const bytes = buildWorkbook([
    {
      name: "Summary",
      preamble: [["Retail Sales Report"], ["Period", "October 2026"]],
      headers: ["Measure", "Value"],
      rows: [
        ["Net revenue", { value: 125000, kind: "money" }],
        ["Sarees sold", { value: 42, kind: "number" }],
      ],
    },
    {
      name: "Retail Sales",
      headers: ["Sale", "Date", "Amount"],
      columns: ["text", "date", "money"],
      totals: true,
      rows: [
        ["S-1", "2026-10-01", 1000],
        ["S-2", "2026-10-02T10:30:00", 2500.5],
      ],
    },
    { name: "Retail Sales", headers: ["Duplicate name"], rows: [] },
  ]);

  it("writes one worksheet part per sheet, with unique names", () => {
    const wb = readEntry(bytes, "xl/workbook.xml");
    expect(wb).toContain('name="Summary"');
    expect(wb).toContain('name="Retail Sales"');
    expect(wb).toContain('name="Retail Sales (2)"');
    expect(readEntry(bytes, "[Content_Types].xml")).toContain("/xl/worksheets/sheet3.xml");
    expect(readEntry(bytes, "xl/_rels/workbook.xml.rels")).toContain('Target="styles.xml"');
  });

  it("puts the title block above the table and freezes below the header", () => {
    const sheet = readEntry(bytes, "xl/worksheets/sheet1.xml");
    expect(sheet).toContain("Retail Sales Report");
    // Title, period, a blank line, then the header on row 4.
    expect(sheet).toContain('<pane ySplit="4" topLeftCell="A5"');
    expect(sheet).toContain('<c r="B5" s="2"><v>125000</v></c>'); // money format
    expect(sheet).toContain('<c r="B6" s="10"><v>42</v></c>'); // whole number
  });

  it("writes ISO dates as real Excel dates on the calendar day given", () => {
    const sheet = readEntry(bytes, "xl/worksheets/sheet2.xml");
    // 1 Oct 2026 is serial 46296; a bare date must not drift to 30 Sep.
    expect(sheet).toContain('<c r="B2" s="3"><v>46296</v></c>');
    expect(sheet).toMatch(/<c r="B3" s="3"><v>46297\.4375<\/v><\/c>/);
  });

  it("adds a totals row with SUM formulas and cached values", () => {
    const sheet = readEntry(bytes, "xl/worksheets/sheet2.xml");
    expect(sheet).toContain('<c r="A4" s="5"');
    expect(sheet).toContain('<c r="C4" s="6"><f>SUM(C2:C3)</f><v>3500.5</v></c>');
    // The filter covers the data only, not the totals row.
    expect(sheet).toContain('<autoFilter ref="A1:C3"/>');
    expect(readEntry(bytes, "xl/workbook.xml")).toContain('fullCalcOnLoad="1"');
  });
});

describe("excelDateSerial", () => {
  it("counts days from 30 Dec 1899", () => {
    expect(excelDateSerial(new Date(1900, 0, 1))).toBe(2);
    expect(excelDateSerial(new Date(2026, 9, 17, 12))).toBe(46312.5);
  });
});
