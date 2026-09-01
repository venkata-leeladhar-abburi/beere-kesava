import { describe, it, expect } from "vitest";
import { isAcceptedImageFile } from "./imageTypes";

const file = (name: string, type: string) => new File([new Uint8Array([1])], name, { type });

describe("isAcceptedImageFile", () => {
  it("accepts the formats phones actually produce", () => {
    for (const f of [
      file("a.jpg", "image/jpeg"),
      file("a.png", "image/png"),
      file("a.webp", "image/webp"),
      file("IMG_0001.heic", "image/heic"),
      file("a.avif", "image/avif"),
    ]) {
      expect(isAcceptedImageFile(f)).toBe(true);
    }
  });

  it("falls back to the extension when the browser reports no usable type", () => {
    expect(isAcceptedImageFile(file("IMG_0001.HEIC", ""))).toBe(true);
    expect(isAcceptedImageFile(file("scan.pdf", "application/octet-stream"))).toBe(false);
  });

  it("rejects SVG and non-images", () => {
    expect(isAcceptedImageFile(file("x.svg", "image/svg+xml"))).toBe(false);
    expect(isAcceptedImageFile(file("x.pdf", "application/pdf"))).toBe(false);
  });
});
