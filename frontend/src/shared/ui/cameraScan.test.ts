import { describe, it, expect } from "vitest";
import {
  CENTER_CROP,
  DECODE_LONG_SIDE,
  QR_CROPS,
  QR_LONG_SIDE,
  ROTATED_LONG_SIDE,
  TILTS,
  canvasSize,
  extractScannedId,
  qrRegion,
  scanRegion,
  shouldMirror,
} from "./cameraScan";

describe("scanRegion", () => {
  const cycle = Array.from({ length: TILTS.length * 4 }, (_, i) => scanRegion(i, 1920, 1080));
  const isWhole = (r: ReturnType<typeof scanRegion>) =>
    r.x === 0 && r.y === 0 && r.w === 1920 && r.h === 1080;

  it("reads the upright whole frame every fourth attempt, so a tag anywhere in view is found fast", () => {
    for (let i = 0; i < 24; i += 4)
      expect(scanRegion(i, 1920, 1080)).toMatchObject({ x: 0, y: 0, w: 1920, h: 1080, rotate: 0 });
  });

  it("zooms into the centre on the even attempts in between", () => {
    const r = scanRegion(2, 1920, 1080);
    expect(r.rotate).toBe(0);
    expect(r.w).toBeCloseTo(1920 * CENTER_CROP);
    expect(r.h).toBeCloseTo(1080 * CENTER_CROP);
    expect(r.x + r.w / 2).toBeCloseTo(960);
    expect(r.y + r.h / 2).toBeCloseTo(540);
    expect(r.longSide).toBe(DECODE_LONG_SIDE);
  });

  it("straightens the whole frame, then the centre crop, through every tilt once per cycle", () => {
    const sorted = (xs: number[]) => [...xs].sort((a, b) => a - b);
    const tilted = cycle.filter((r) => r.rotate !== 0);
    expect(tilted).toHaveLength(TILTS.length * 2);
    const whole = tilted.slice(0, TILTS.length);
    const centre = tilted.slice(TILTS.length);
    expect(whole.every(isWhole)).toBe(true);
    expect(centre.some(isWhole)).toBe(false);
    expect(sorted(whole.map((r) => r.rotate))).toEqual(sorted([...TILTS]));
    expect(sorted(centre.map((r) => r.rotate))).toEqual(sorted([...TILTS]));
    expect(tilted.every((r) => r.longSide === ROTATED_LONG_SIDE)).toBe(true);
  });

  it("tries the mildest tilts first", () => {
    expect([1, 3].map((i) => Math.abs(scanRegion(i, 1920, 1080).rotate))).toEqual([10, 10]);
  });

  it("leaves no tilt gap wider than ZXing tolerates on a tag barcode (~±5°) out to 45°", () => {
    const angles = [0, ...TILTS].sort((a, b) => a - b);
    for (let i = 1; i < angles.length; i++)
      expect(angles[i] - angles[i - 1]).toBeLessThanOrEqual(10);
    expect(Math.max(...angles) + 5).toBeGreaterThanOrEqual(45);
    expect(Math.min(...angles) - 5).toBeLessThanOrEqual(-45);
  });

  it("works for a portrait phone frame", () => {
    expect(canvasSize(scanRegion(0, 1080, 1920))).toMatchObject({ width: 720, height: 1280 });
  });
});

describe("canvasSize", () => {
  it("downscales a large full frame to the decode size, keeping aspect", () => {
    expect(canvasSize(scanRegion(0, 1920, 1080))).toMatchObject({ width: 1280, height: 720 });
  });

  it("never upscales a small full frame", () => {
    expect(canvasSize(scanRegion(0, 640, 480))).toMatchObject({
      width: 640,
      height: 480,
      scale: 1,
    });
  });

  it("upscales a centre crop so thin bars get enough samples", () => {
    const { width } = canvasSize(scanRegion(2, 640, 480));
    expect(width).toBe(DECODE_LONG_SIDE);
  });

  it("sizes a rotated frame to its bounding box so no corner is clipped", () => {
    const r = scanRegion(1, 1280, 720);
    const { width, height, scale } = canvasSize(r);
    const rad = (Math.abs(r.rotate) * Math.PI) / 180;
    expect(width).toBe(ROTATED_LONG_SIDE);
    expect(width / scale).toBeGreaterThanOrEqual(1280 * Math.cos(rad) + 720 * Math.sin(rad) - 1);
    expect(height / scale).toBeGreaterThanOrEqual(1280 * Math.sin(rad) + 720 * Math.cos(rad) - 1);
  });
});

describe("extractScannedId", () => {
  it("unwraps the QR's /scan?id= link to the bare id", () => {
    expect(extractScannedId("https://app.example.com/scan?id=SAB0-3850-001-02")).toBe(
      "SAB0-3850-001-02"
    );
  });

  it("returns a Code128 / typed id unchanged apart from whitespace", () => {
    expect(extractScannedId("  SAB0-3850-001-02\n")).toBe("SAB0-3850-001-02");
  });

  it("keeps a URL without an id as-is", () => {
    expect(extractScannedId("https://example.com/other")).toBe("https://example.com/other");
  });
});

describe("shouldMirror", () => {
  it("mirrors a selfie camera and never a rear camera", () => {
    expect(shouldMirror("user", false)).toBe(true);
    expect(shouldMirror("environment", true)).toBe(false);
  });

  it("mirrors an unlabelled desktop webcam but not an unlabelled phone camera", () => {
    expect(shouldMirror(undefined, true)).toBe(true);
    expect(shouldMirror(undefined, false)).toBe(false);
  });
});

describe("qrRegion", () => {
  it("reads the whole frame on every even attempt, so a tag anywhere in view is found at once", () => {
    for (let i = 0; i < 12; i += 2) {
      expect(qrRegion(i, 1920, 1080)).toMatchObject({
        x: 0,
        y: 0,
        w: 1920,
        h: 1080,
        rotate: 0,
        longSide: QR_LONG_SIDE,
      });
    }
  });

  it("cycles through the centre crops on the odd attempts", () => {
    const crops = [1, 3, 5, 7].map((i) => qrRegion(i, 1920, 1080).w / 1920);
    crops.forEach((c, i) => expect(c).toBeCloseTo(QR_CROPS[i % QR_CROPS.length]));
    const r = qrRegion(1, 1920, 1080);
    expect(r.x + r.w / 2).toBeCloseTo(960);
    expect(r.y + r.h / 2).toBeCloseTo(540);
  });

  it("never rotates — a QR reads at any angle", () => {
    for (let i = 0; i < 16; i++) expect(qrRegion(i, 1920, 1080).rotate).toBe(0);
  });

  it("never upscales a crop past the camera's own pixels", () => {
    const r = qrRegion(3, 1920, 1080);
    expect(r.longSide).toBeCloseTo(1920 * QR_CROPS[1]);
    expect(canvasSize(r).scale).toBeCloseTo(1);
  });

  it("gives a 4K webcam's centre crops the full decode size", () => {
    expect(qrRegion(1, 3840, 2160).longSide).toBe(QR_LONG_SIDE);
    expect(qrRegion(3, 3840, 2160).longSide).toBe(QR_LONG_SIDE);
  });

  it("works for a portrait phone frame", () => {
    expect(canvasSize(qrRegion(0, 1080, 1920))).toMatchObject({ width: 720, height: 1280 });
  });
});
