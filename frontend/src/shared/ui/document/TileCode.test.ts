import { describe, expect, test } from "vitest";
import { code128Modules, innerWidthMm, needsQrFallback, MIN_MODULE_MM } from "./TileCode";
import { DEFAULT_LABEL_STOCK, type LabelStock } from "./LabelSheet";

/**
 * Which code a printed label carries is not cosmetic — get it wrong and the
 * sticker on the saree simply cannot be scanned, which is the bug this whole
 * module exists to close.
 *
 * The 0.21mm threshold was measured, not guessed: the real bwip-js output was
 * stretched to the real tile geometry, hard-thresholded to 203dpi thermal
 * dots and decoded with the same ZXing the scanner uses. A 14-character id at
 * 1.8 dots per module decoded; an 18-character one at 1.5 did not. The cases
 * below are the id shapes the system actually generates, and each was checked
 * against that simulation.
 */
describe("needsQrFallback — on the 50x25mm roll the shop runs", () => {
  const stock = DEFAULT_LABEL_STOCK;

  test("the tile's inner width is the sticker less its padding", () => {
    expect(innerWidthMm(stock)).toBeCloseTo(47.6, 5);
  });

  test.each([
    // A factory-loom saree and a short weaver id still fit real bars.
    ["3-B12-001", false],
    ["RAVI-L2-B12-001", false],
    ["JJSI-OS-001-01", false],
    // Past ~17 characters the bars thin out below one and a half printer
    // dots and stop decoding, so these have to print as a QR.
    ["RAMARAO-L1-B12-001", true],
    ["VENKATESWARLU-L2-B7-014", true],
    ["RAVI-INV-2026-118-07", true],
    // Every GRN item code embeds the vendor's whole business name, so in
    // practice they are all QR — they were never scannable as Code128.
    ["GRN-Ravi-001-002-1", true],
    ["GRN-SreeVignesh-004-002-1", true],
    ["GRN-SreeLakshmiSilkHouse-001-003-12", true],
  ])("%s -> %s", (code, expected) => {
    expect(needsQrFallback(code, stock)).toBe(expected);
  });

  test("the switch happens exactly where the modules get too thin", () => {
    const widest = (code: string) => innerWidthMm(stock) / code128Modules(code);
    expect(widest("RAVI-L2-B12-001")).toBeGreaterThanOrEqual(MIN_MODULE_MM);
    expect(widest("RAMARAO-L1-B12-001")).toBeLessThan(MIN_MODULE_MM);
  });
});

describe("needsQrFallback — a bigger sticker earns bars back", () => {
  // Label Settings offers larger stock, and a wider tile prints wider
  // modules. The decision has to follow the roll actually loaded rather than
  // a hardcoded character count.
  const wide: LabelStock = { widthMm: 100, heightMm: 50 };

  test("a code that needs a QR at 50mm prints as bars at 100mm", () => {
    expect(needsQrFallback("GRN-SreeVignesh-004-002-1", DEFAULT_LABEL_STOCK)).toBe(true);
    expect(needsQrFallback("GRN-SreeVignesh-004-002-1", wide)).toBe(false);
  });

  test("even the longest GRN code the system generates fits that roll", () => {
    // 95.2mm of inner width across 420 modules is 0.227mm each — comfortably
    // over the threshold, so the biggest stock prints every real code as
    // bars. The rule follows the geometry rather than a character count, so
    // this needs no special-casing.
    expect(needsQrFallback("GRN-SreeLakshmiSilkHouse-001-003-12", wide)).toBe(false);
  });

  test("a code long enough still falls back on any stock", () => {
    const absurd = "GRN-" + "VeryLongVendorNameIndeed".repeat(3) + "-001-003-12";
    expect(needsQrFallback(absurd, wide)).toBe(true);
  });
});

describe("code128Modules", () => {
  test("counts start, data, check and stop, 11 modules each bar the stop", () => {
    // 14 data characters: 11*(14+2)+13 = 189, which is exactly what bwip-js
    // emits for JJSI-OS-001-01 at scale 1.
    expect(code128Modules("JJSI-OS-001-01")).toBe(189);
  });
});
