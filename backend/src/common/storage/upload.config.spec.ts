import { isAcceptedImageFile, isAcceptedImageMimeType } from "./upload.config";

const file = (originalname: string, mimetype: string) =>
  ({ originalname, mimetype }) as Express.Multer.File;

describe("upload image acceptance", () => {
  it("accepts every image type except SVG", () => {
    for (const m of ["image/jpeg", "image/png", "image/webp", "image/heic", "image/avif", "image/gif"]) {
      expect(isAcceptedImageMimeType(m)).toBe(true);
    }
    expect(isAcceptedImageMimeType("image/svg+xml")).toBe(false);
    expect(isAcceptedImageMimeType("application/pdf")).toBe(false);
  });

  it("uses the extension when the browser sends no usable MIME type", () => {
    expect(isAcceptedImageFile(file("IMG_0001.HEIC", "application/octet-stream"))).toBe(true);
    expect(isAcceptedImageFile(file("photo.jpg", ""))).toBe(true);
    expect(isAcceptedImageFile(file("payload.exe", "application/octet-stream"))).toBe(false);
  });
});
