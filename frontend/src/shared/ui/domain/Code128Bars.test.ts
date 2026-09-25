import { describe, expect, it } from "vitest";
import { encodeCode128 } from "./Code128Bars";

describe("encodeCode128", () => {
  it("draws the bars for every shape of saree id the tags print", () => {
    for (const id of ["SRIS-626-001-01", "JJSI-NOINV-001-02", "RAMOJI RAO-L1-B001-008", "GRN-Ravi-2-1"]) {
      const drawing = encodeCode128(id);
      expect(drawing, id).not.toBeNull();
      expect(drawing!.paths.length).toBeGreaterThan(0);
    }
  });

  it("keeps Code128's quiet zone inside the drawing, so stretched bars never touch the tag border", () => {
    const drawing = encodeCode128("SRIS-626-001-01")!;
    const [, , width] = drawing.viewBox.split(" ").map(Number);
    const xs = drawing.paths.flatMap(p => [...p.d.matchAll(/M(\d+(?:\.\d+)?)/g)].map(m => Number(m[1])));
    // paddingwidth 10 modules at scale 6 = 60 units clear on each side.
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(60);
    expect(width - Math.max(...xs)).toBeGreaterThanOrEqual(60);
  });

  it("returns null for text Code128 cannot carry, so the tag falls back to a QR", () => {
    expect(encodeCode128("साड़ी-001")).toBeNull();
  });
});
