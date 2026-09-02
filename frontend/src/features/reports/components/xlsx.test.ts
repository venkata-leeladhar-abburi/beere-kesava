import { describe, expect, it } from "vitest";
import { buildXlsx, columnName, safeSheetName } from "./xlsx";

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
  const bytes = buildXlsx("Retail Sales Report", ["Date", "Customer", "Amount"], [
    ["2026-08-01", 'A "quoted" & <odd> name', 12500.5],
    ["2026-08-02", "Ravi Kumar", 300],
    ["2026-08-03", null, undefined],
  ]);

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
