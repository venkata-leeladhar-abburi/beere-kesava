import { describe, expect, it } from "vitest";
import {
  BarcodeFormat,
  BinaryBitmap,
  DecodeHintType,
  HybridBinarizer,
  MultiFormatReader,
  RGBLuminanceSource,
} from "@zxing/library";
import { encodeToPath, QR_QUIET_ZONE } from "@/shared/ui/domain/ScannableCode";
import {
  DEFAULT_LABEL_STOCK,
  parseLabelSize,
  LABEL_SIZE_OPTIONS,
} from "@/shared/ui/document/LabelSheet";
import { tagColumnEm, tagFigureEm, tagIdFit, tagQrEm } from "./SareeTagPrint";

/** Saree id shapes the system actually prints on a tag. */
const SAREE_IDS = [
  "SABO-3850-001-01",
  "SRIS-626-007-56",
  "JJSI-OS-001-01",
  "3-B12-001",
  "RAVI-L2-B12-001",
  "RAMARAO-L1-B12-001",
  "VENKATESWARLU-L2-B7-014",
  "RAMOJI RAO-L1-B001-010",
  "RAVI-INV-2026-118-07",
];

/** Rasterises the QR exactly as <ScannableCode> draws it, `scale` pixels per
 *  module, and reads it with the reader the camera scanner uses. */
function decodeAt(value: string, scale: number): string {
  const encoded = encodeToPath(value)!;
  const extent = encoded.modules + QR_QUIET_ZONE * 2;
  const px = extent * scale;
  const luma = new Uint8ClampedArray(px * px).fill(255);
  for (const [, x, y] of encoded.path.matchAll(/M(\d+) (\d+)h1v1h-1z/g)) {
    const mx = (Number(x) + QR_QUIET_ZONE) * scale;
    const my = (Number(y) + QR_QUIET_ZONE) * scale;
    for (let dy = 0; dy < scale; dy++)
      for (let dx = 0; dx < scale; dx++) luma[(my + dy) * px + mx + dx] = 0;
  }
  // Hints go to decode() itself: decode(image) with none resets the reader to
  // every format, which is not what the scanner's QR pass runs.
  const hints = new Map<DecodeHintType, unknown>([
    [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]],
    [DecodeHintType.TRY_HARDER, true],
  ]);
  const bitmap = new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(luma, px, px)));
  return new MultiFormatReader().decode(bitmap, hints).getText();
}

describe("saree tag QR", () => {
  it.each(SAREE_IDS)("%s reads back, down to 3 camera pixels per module", (id) => {
    for (const scale of [3, 4, 6, 10]) expect(decodeAt(id, scale)).toBe(id);
  });

  it.each(SAREE_IDS)("%s prints modules a 203dpi thermal head resolves several dots wide", (id) => {
    const encoded = encodeToPath(id)!;
    const moduleMm = tagQrEm(DEFAULT_LABEL_STOCK) / (encoded.modules + QR_QUIET_ZONE * 2);
    // 0.45mm is over three and a half printer dots — twice the old Code128's bars.
    expect(moduleMm).toBeGreaterThanOrEqual(0.45);
  });

  it("is the smallest QR there is for a typical id", () => {
    expect(encodeToPath("SABO-3850-001-01")!.modules).toBe(21);
  });
});

describe("saree tag layout", () => {
  it("gives the QR 20mm of the 50x25mm sticker and the text the rest", () => {
    expect(tagQrEm(DEFAULT_LABEL_STOCK)).toBeCloseTo(20, 1);
    expect(tagColumnEm(DEFAULT_LABEL_STOCK)).toBeCloseTo(26.4, 1);
  });

  it.each(LABEL_SIZE_OPTIONS)("leaves a usable text column on %s", (size) => {
    const stock = parseLabelSize(size);
    expect(tagQrEm(stock)).toBeGreaterThanOrEqual(11);
    expect(tagColumnEm(stock)).toBeGreaterThanOrEqual(13);
    // The QR and the column never exceed the tile's inner height or width.
    expect(tagQrEm(stock)).toBeLessThanOrEqual(22);
  });

  it("prints a normal id on one line and breaks a long one over two, never clipping", () => {
    const column = tagColumnEm(DEFAULT_LABEL_STOCK);
    expect(tagIdFit("SABO-3850-001-01".length, column)).toMatchObject({ lines: 1 });
    const long = tagIdFit("EXT-SREELAKSHMISILKHOUSE-INV-2026-118-07".length, column);
    expect(long.lines).toBe(2);
    // Two lines at that size hold every character.
    const perLine = Math.floor(column / (0.64 * long.em));
    expect(perLine * 2).toBeGreaterThanOrEqual("EXT-SREELAKSHMISILKHOUSE-INV-2026-118-07".length);
  });

  it("shrinks a long price to the column instead of letting it overflow", () => {
    const column = tagColumnEm(DEFAULT_LABEL_STOCK);
    expect(tagFigureEm("₹4,400", column, 6.4)).toBeCloseTo(6.4);
    const big = tagFigureEm("₹1,24,400", column, 6.4);
    expect(big).toBeLessThan(6.4);
    expect(big * 0.66 * "₹1,24,400".length).toBeLessThanOrEqual(column + 1e-9);
    expect(tagFigureEm("", column, 6.4)).toBe(6.4);
  });
});
