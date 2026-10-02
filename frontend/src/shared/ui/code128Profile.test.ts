import { describe, it, expect } from "vitest";
import { Code128Reader } from "@zxing/library";
import {
  CODE128_PATTERNS, classifyCharacter, decodeProfile, decodeStraightCrop, symbolsToText,
} from "./code128Profile";

/** Code Set B encoding of `text` as element widths in modules, stop bar included. */
function encodeB(text: string): number[] {
  const values = [104, ...[...text].map(c => c.charCodeAt(0) - 32)];
  let sum = values[0];
  for (let i = 1; i < values.length; i++) sum += values[i] * i;
  values.push(sum % 103, 106);
  const widths = values.flatMap(v => [...CODE128_PATTERNS[v]].map(Number));
  widths.push(2); // the stop's final bar
  return widths;
}

/** Deterministic pseudo-random noise so a failing case is reproducible. */
function rng(seed: number) {
  let s = seed;
  return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
}

/**
 * A camera's view of the barcode along one scanline: `modPx` pixels per
 * module, Gaussian blur of `sigma` pixels, additive noise, bars at ~45 and
 * paper at ~215 like a printed tag under indoor light.
 */
function renderProfile(widths: number[], modPx: number, sigma: number, noise: number, seed = 1): Float32Array {
  const quiet = 14;
  const totalMods = widths.reduce((a, b) => a + b, 0) + quiet * 2;
  const n = Math.ceil(totalMods * modPx);
  const sharp = new Float32Array(n).fill(215);
  // Area-sample the ideal bars into pixels.
  let x = quiet;
  widths.forEach((w, i) => {
    if (i % 2 === 0) {
      const a = x * modPx;
      const b = (x + w) * modPx;
      for (let p = Math.floor(a); p < Math.ceil(b) && p < n; p++) {
        const cover = Math.min(b, p + 1) - Math.max(a, p);
        sharp[p] -= (215 - 45) * Math.max(0, cover);
      }
    }
    x += w;
  });
  const r = Math.ceil(sigma * 3);
  const kernel = Array.from({ length: r * 2 + 1 }, (_, i) => Math.exp(-((i - r) ** 2) / (2 * sigma * sigma)));
  const ksum = kernel.reduce((a, b) => a + b, 0);
  const out = new Float32Array(n);
  const rand = rng(seed);
  for (let p = 0; p < n; p++) {
    let acc = 0;
    for (let k = -r; k <= r; k++) acc += sharp[Math.min(n - 1, Math.max(0, p + k))] * kernel[k + r];
    out[p] = acc / ksum + (rand() + rand() + rand() - 1.5) * noise;
  }
  return out;
}

describe("CODE128_PATTERNS", () => {
  it("matches ZXing's Code128 table exactly", () => {
    const zx = (Code128Reader as unknown as { CODE_PATTERNS: Int32Array[] }).CODE_PATTERNS;
    for (let v = 0; v < 106; v++) expect(CODE128_PATTERNS[v]).toBe(Array.from(zx[v]).join(""));
    expect(Array.from(zx[106]).join("").startsWith(CODE128_PATTERNS[106])).toBe(true);
  });

  it("every character is 11 modules with an even bar count", () => {
    for (const p of CODE128_PATTERNS) {
      const w = [...p].map(Number);
      expect(w.reduce((a, b) => a + b, 0)).toBe(11);
      expect((w[0] + w[2] + w[4]) % 2).toBe(0);
    }
  });

  it("classifies every character from its own widths, at any scale", () => {
    CODE128_PATTERNS.forEach((p, v) => {
      expect(classifyCharacter([...p].map(c => Number(c) * 3.7))).toBe(v);
    });
  });
});

describe("symbolsToText", () => {
  it("handles code set C digit pairs and a switch back to B", () => {
    // Start C, "12", "34", CODE B, "A"
    expect(symbolsToText([105, 12, 34, 100, 33])).toBe("1234A");
  });
});

describe("decodeProfile", () => {
  const ids = ["JJSI-NOINV-001-02", "SAB0-3850-001-02", "RAVI-001-04"];

  it("reads a clean profile", () => {
    for (const id of ids) expect(decodeProfile(renderProfile(encodeB(id), 4, 0.3, 0))).toBe(id);
  });

  it("reads a blurry, noisy webcam-grade profile at ~2.2 px per module", () => {
    // Noise of 2 is what's left after averaging ~50 rows of a webcam crop.
    for (const id of ids) {
      for (const seed of [1, 2, 3]) {
        expect(decodeProfile(renderProfile(encodeB(id), 2.2, 1.1, 2, seed))).toBe(id);
      }
    }
  });

  it("restores thin spaces a heavy blur wiped out (deconvolution)", () => {
    // At this blur the plain edge finder sees merged bars; only the deblurred
    // pass can read it.
    const p = renderProfile(encodeB(ids[0]), 2.5, 1.4, 1, 4);
    expect(decodeProfile(p)).toBe(ids[0]);
  });

  it("reads an upside-down tag", () => {
    const p = renderProfile(encodeB(ids[0]), 3, 0.8, 4);
    expect(decodeProfile(Float32Array.from(p).reverse())).toBe(ids[0]);
  });

  it("returns nothing for a broken check character, never a wrong id", () => {
    const widths = encodeB(ids[1]);
    // Swap one data character for another of the same width → bad checksum.
    const at = 6 * 3;
    const other = [...CODE128_PATTERNS[50]].map(Number);
    widths.splice(at, 6, ...other);
    expect(decodeProfile(renderProfile(widths, 3, 0.5, 0))).toBeNull();
  });

  it("returns nothing for noise", () => {
    const rand = rng(9);
    const p = Float32Array.from({ length: 900 }, () => 130 + (rand() - 0.5) * 120);
    expect(decodeProfile(p)).toBeNull();
  });
});

describe("decodeStraightCrop", () => {
  it("averages bands of a 2D crop and needs two of them to agree", () => {
    const id = "SAB0-3850-001-02";
    const rows = Array.from({ length: 40 }, (_, y) => renderProfile(encodeB(id), 2.4, 1, 14, y + 1));
    const width = rows[0].length;
    const data = new Float32Array(width * rows.length);
    rows.forEach((r, y) => data.set(r, y * width));
    expect(decodeStraightCrop({ data, width, height: rows.length })).toBe(id);
  });
});
