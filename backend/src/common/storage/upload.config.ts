import { BadRequestException } from "@nestjs/common";
import type { Request } from "express";
import { memoryStorage } from "multer";

const ALLOWED_SIGNATURE_MIME_TYPES = new Set(["image/png", "image/jpeg"]);
const MAX_SIGNATURE_SIZE_BYTES = 2 * 1024 * 1024;

const ALLOWED_PHOTO_MIME_TYPES = new Set(["image/png", "image/jpeg"]);
const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

// Receipts differ from photos on both axes: an LR receipt is often a scanned
// PDF rather than a picture, and the dropzones advertise 10MB.
const ALLOWED_RECEIPT_MIME_TYPES = new Set(["image/png", "image/jpeg", "application/pdf"]);
const MAX_RECEIPT_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * Files are buffered in memory rather than written straight to disk: the
 * destination (local disk or an R2 bucket) is a runtime decision made by
 * StorageService, and only it should touch the bytes. The size limits below
 * cap what a single request can hold in memory.
 */
function memoryUploadOptions(allowedMimeTypes: Set<string>, maxBytes: number, message: string) {
  return {
    storage: memoryStorage(),
    limits: { fileSize: maxBytes },
    fileFilter: (
      _req: Request,
      file: Express.Multer.File,
      callback: (error: Error | null, accept: boolean) => void,
    ) => {
      if (!allowedMimeTypes.has(file.mimetype)) {
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
    ALLOWED_SIGNATURE_MIME_TYPES,
    MAX_SIGNATURE_SIZE_BYTES,
    "Signature must be a PNG or JPEG image",
  );
}

/** Multer options for a general-purpose profile/identification photo. */
export function photoUploadOptions() {
  return memoryUploadOptions(
    ALLOWED_PHOTO_MIME_TYPES,
    MAX_PHOTO_SIZE_BYTES,
    "Photo must be a PNG or JPEG image",
  );
}

/** Multer options for a dispatch LR receipt — image or PDF. */
export function receiptUploadOptions() {
  return memoryUploadOptions(
    ALLOWED_RECEIPT_MIME_TYPES,
    MAX_RECEIPT_SIZE_BYTES,
    "Receipt must be a JPG, PNG or PDF file",
  );
}
