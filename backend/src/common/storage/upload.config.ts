import { randomUUID } from "crypto";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { BadRequestException } from "@nestjs/common";
import type { Request } from "express";
import { diskStorage } from "multer";

export const UPLOADS_ROOT = join(process.cwd(), "uploads");

const ALLOWED_SIGNATURE_MIME_TYPES = new Set(["image/png", "image/jpeg"]);
const MAX_SIGNATURE_SIZE_BYTES = 2 * 1024 * 1024;

const ALLOWED_PHOTO_MIME_TYPES = new Set(["image/png", "image/jpeg"]);
const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/** Multer options for capturing a single signature image, stored on local disk under uploads/signatures. */
export function signatureUploadOptions() {
  const destination = join(UPLOADS_ROOT, "signatures");
  ensureDir(destination);

  return {
    storage: diskStorage({
      destination,
      filename: (
        _req: Request,
        file: Express.Multer.File,
        callback: (error: Error | null, filename: string) => void,
      ) => {
        const extension = file.mimetype === "image/png" ? "png" : "jpg";
        callback(null, `${randomUUID()}.${extension}`);
      },
    }),
    limits: { fileSize: MAX_SIGNATURE_SIZE_BYTES },
    fileFilter: (
      _req: Request,
      file: Express.Multer.File,
      callback: (error: Error | null, accept: boolean) => void,
    ) => {
      if (!ALLOWED_SIGNATURE_MIME_TYPES.has(file.mimetype)) {
        callback(new BadRequestException("Signature must be a PNG or JPEG image"), false);
        return;
      }
      callback(null, true);
    },
  };
}

export function signatureFileToUrl(file: Express.Multer.File): string {
  return `/uploads/signatures/${file.filename}`;
}

/** Multer options for a general-purpose profile/identification photo, stored on local disk under uploads/photos. */
export function photoUploadOptions() {
  const destination = join(UPLOADS_ROOT, "photos");
  ensureDir(destination);

  return {
    storage: diskStorage({
      destination,
      filename: (
        _req: Request,
        file: Express.Multer.File,
        callback: (error: Error | null, filename: string) => void,
      ) => {
        const extension = file.mimetype === "image/png" ? "png" : "jpg";
        callback(null, `${randomUUID()}.${extension}`);
      },
    }),
    limits: { fileSize: MAX_PHOTO_SIZE_BYTES },
    fileFilter: (
      _req: Request,
      file: Express.Multer.File,
      callback: (error: Error | null, accept: boolean) => void,
    ) => {
      if (!ALLOWED_PHOTO_MIME_TYPES.has(file.mimetype)) {
        callback(new BadRequestException("Photo must be a PNG or JPEG image"), false);
        return;
      }
      callback(null, true);
    },
  };
}

export function photoFileToUrl(file: Express.Multer.File): string {
  return `/uploads/photos/${file.filename}`;
}
