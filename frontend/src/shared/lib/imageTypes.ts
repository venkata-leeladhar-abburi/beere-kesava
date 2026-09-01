/**
 * What counts as an uploadable photo, client-side.
 *
 * The dropzones used to hard-code `image/png` + `image/jpeg`, which rejected
 * exactly the files people actually upload from a phone — HEIC/HEIF from
 * iPhones, WebP from Android — so those photos never reached the site at all.
 * Every image type is accepted now except SVG, which is an executable
 * document rather than a picture.
 *
 * The extension fallback matters: a browser with no codec for the format
 * reports an empty or `application/octet-stream` type, and then the filename
 * is the only signal there is. The backend applies the same rule (see
 * upload.config.ts's isAcceptedImageFile) — keep the two in step.
 */
const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif|avif|heic|heif|bmp|tiff?|jfif)$/i;
const UNKNOWN_MIME_TYPES = new Set(["", "application/octet-stream", "binary/octet-stream"]);

/** `accept` attribute for a photo file input — every image type the browser knows, plus formats it may not. */
export const IMAGE_ACCEPT_ATTR = "image/*,.heic,.heif,.avif,.jfif";

export function isAcceptedImageFile(file: File): boolean {
  if (UNKNOWN_MIME_TYPES.has(file.type)) return IMAGE_EXTENSIONS.test(file.name);
  return file.type.startsWith("image/") && file.type !== "image/svg+xml";
}

/** Shown when isAcceptedImageFile rejects a file. */
export const IMAGE_REJECTION_MESSAGE = "That file isn't an image we can display (SVG isn't supported).";
