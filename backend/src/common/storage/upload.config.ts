import { BadRequestException } from "@nestjs/common";
import type { Request } from "express";
import { memoryStorage } from "multer";

const ALLOWED_SIGNATURE_MIME_TYPES = new Set(["image/png", "image/jpeg"]);
const MAX_SIGNATURE_SIZE_BYTES = 2 * 1024 * 1024;

// SVG is the one image type deliberately refused: it is an executable
// document (scripts, external refs), and these files are served back to
// browsers from our own /uploads route. Everything else a camera or gallery
// can produce is accepted — the png/jpeg-only list this replaces rejected
// HEIC/HEIF from iPhones and WebP from Android outright, which is why photos
// taken on a phone silently never made it into the site.
export function isAcceptedImageMimeType(mimetype: string): boolean {
  return mimetype.startsWith("image/") && mimetype !== "image/svg+xml";
}

// Browsers do not always know an image's MIME type: Windows without the HEIF
// codec installed sends application/octet-stream (or nothing at all) for a
// .heic straight off an iPhone. In that case the filename extension is the
// only signal there is, so it decides.
const IMAGE_EXTENSIONS =
  /\.(jpe?g|png|webp|gif|avif|heic|heif|bmp|tiff?|jfif)$/i;
const UNKNOWN_MIME_TYPES = new Set(["", "application/octet-stream", "binary/octet-stream"]);

export function isAcceptedImageFile(file: Express.Multer.File): boolean {
  const mimetype = file.mimetype ?? "";
  if (UNKNOWN_MIME_TYPES.has(mimetype)) return IMAGE_EXTENSIONS.test(file.originalname ?? "");
  return isAcceptedImageMimeType(mimetype);
}

const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

// Receipts differ from photos on both axes: an LR receipt is often a scanned
// PDF rather than a picture, and the dropzones advertise 10MB.
const MAX_RECEIPT_SIZE_BYTES = 10 * 1024 * 1024;

// PO/invoice/quotation exports handed to WhatsAppDocumentsService — always
// the PDF the frontend just rasterised client-side (see exportPdf.ts), never
// a scan, so unlike receipts there's no image case to allow for.
const ALLOWED_DOCUMENT_MIME_TYPES = new Set(["application/pdf"]);
const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * Files are buffered in memory rather than written straight to disk: the
 * destination (local disk or an R2 bucket) is a runtime decision made by
 * StorageService, and only it should touch the bytes. The size limits below
 * cap what a single request can hold in memory.
 */
function memoryUploadOptions(
  isAllowed: (file: Express.Multer.File) => boolean,
  maxBytes: number,
  message: string,
) {
  return {
    storage: memoryStorage(),
    limits: { fileSize: maxBytes },
    fileFilter: (
      _req: Request,
      file: Express.Multer.File,
      callback: (error: Error | null, accept: boolean) => void,
    ) => {
      if (!isAllowed(file)) {
        callback(new BadRequestException(message), false);
        return;
      }
      callback(null, true);
    },
  };
}

/** Multer options for capturing a single signature image. */
export function signatureUploadOptions() {
  return memoryUploadOptions(
    (f) => ALLOWED_SIGNATURE_MIME_TYPES.has(f.mimetype),
    MAX_SIGNATURE_SIZE_BYTES,
    "Signature must be a PNG or JPEG image",
  );
}

/** Multer options for a general-purpose profile/identification photo. */
export function photoUploadOptions() {
  return memoryUploadOptions(
    isAcceptedImageFile,
    MAX_PHOTO_SIZE_BYTES,
    "Photo must be an image file (SVG isn't supported)",
  );
}

/** Multer options for a dispatch LR receipt — image or PDF. */
export function receiptUploadOptions() {
  return memoryUploadOptions(
    (f) =>
      isAcceptedImageFile(f) ||
      f.mimetype === "application/pdf" ||
      // Same unknown-MIME fallback as images: a scanner app's PDF sometimes
      // arrives as application/octet-stream.
      (UNKNOWN_MIME_TYPES.has(f.mimetype ?? "") && /\.pdf$/i.test(f.originalname ?? "")),
    MAX_RECEIPT_SIZE_BYTES,
    "Receipt must be an image or PDF file",
  );
}

/** Multer options for a generated document PDF (PO/invoice/quotation) shared via WhatsApp. */
export function documentUploadOptions() {
  return memoryUploadOptions(
    (f) => ALLOWED_DOCUMENT_MIME_TYPES.has(f.mimetype),
    MAX_DOCUMENT_SIZE_BYTES,
    "Document must be a PDF file",
  );
}
