import { describe, it, expect } from "vitest";
import {
  BarcodeFormat, BinaryBitmap, DecodeHintType, HybridBinarizer,
  MultiFormatReader, RGBLuminanceSource,
} from "@zxing/library";
import { encodeToPath, QR_QUIET_ZONE } from "./ScannableCode";

/**
 * Rasterises exactly what <ScannableCode> draws — the same module path, the
 * same quiet zone — and reads it back with the same MultiFormatReader the
 * app's camera scanner uses. This is the guarantee that matters: the tag that
 * comes off the printer must decode to the GRN line code, or the scan-a-label
 * workflow silently does nothing. The previous placeholder ("||| | || ||| ||")
 * would fail this outright.
 */
function decodeRendered(value: string, scale = 8): string {
  const encoded = encodeToPath(value);
  if (!encoded) throw new Error(`could not encode ${value}`);

  const extent = encoded.modules + QR_QUIET_ZONE * 2;
  const px = extent * scale;

  // The path is a run of `M{x} {y}h1v1h-1z` module rects — replay it onto a
  // pixel grid the way the SVG renderer would.
  const dark = new Set<string>();
  for (const [, x, y] of encoded.path.matchAll(/M(\d+) (\d+)h1v1h-1z/g)) {
    dark.add(`${Number(x) + QR_QUIET_ZONE},${Number(y) + QR_QUIET_ZONE}`);
  }

  const luma = new Uint8ClampedArray(px * px);
  for (let py = 0; py < px; py++) {
    for (let pxi = 0; pxi < px; pxi++) {
      const on = dark.has(`${Math.floor(pxi / scale)},${Math.floor(py / scale)}`);
      luma[py * px + pxi] = on ? 0 : 255;
    }
  }

  const source = new RGBLuminanceSource(luma, px, px);
  const bitmap = new BinaryBitmap(new HybridBinarizer(source));
  const reader = new MultiFormatReader();
  reader.setHints(new Map([[DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]]]));
  return reader.decode(bitmap).getText();
}

/** Every code shape the app actually prints on a tag. */
const REAL_CODES = [
  "GRN-SreeVignesh-004-002-1",
  "GRN-RajaSilks-003-002-1",
  "GRN-RajaSilks-003-002-3",
  "GRN-LakshmisSilks-002-001-12",
  "GRN-2026-001-1",
  "SR-00042",
];

describe("ScannableCode", () => {
  // The encoder's error-correction level is chosen for detectability, not
  // robustness — some levels produce codes this very reader cannot find.
  // Sweeping render scales stands in for the range of camera distances a
  // tag gets scanned at.
  it.each(REAL_CODES)("round-trips %s at every render scale", code => {
    for (const scale of [4, 6, 8, 12, 16]) {
      expect(decodeRendered(code, scale)).toBe(code);
    }
  });

  it("prints a GRN line code that scans back to itself", () => {
    const code = "GRN-SreeVignesh-004-002-1";
    expect(decodeRendered(code)).toBe(code);
  });

  it("scans back a saree id", () => {
    expect(decodeRendered("SR-00042")).toBe("SR-00042");
  });

  it("handles the longest realistic vendor-scoped code", () => {
    const code = "GRN-LakshmisSilks-002-001-12";
    expect(decodeRendered(code)).toBe(code);
  });

  it("surrounds the code with a real quiet zone", () => {
    const encoded = encodeToPath("GRN-A-001-1");
    expect(encoded).not.toBeNull();
    // Every module must sit inside the grid, so the translate() that applies
    // the quiet zone can never push part of the code off the viewBox.
    for (const [, x, y] of encoded!.path.matchAll(/M(\d+) (\d+)h1v1h-1z/g)) {
      expect(Number(x)).toBeLessThan(encoded!.modules);
      expect(Number(y)).toBeLessThan(encoded!.modules);
    }
    expect(QR_QUIET_ZONE).toBeGreaterThanOrEqual(4);
  });

  it("reports failure instead of drawing an undecodable placeholder", () => {
    // An empty value has no valid encoding; the component renders a "code
    // unavailable" box for this rather than fake stripes.
    expect(encodeToPath("")).toBeNull();
  });
});
