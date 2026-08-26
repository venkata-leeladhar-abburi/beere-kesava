import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Public } from "../auth/decorators/public.decorator";
import type { Response } from "express";
import { StorageService } from "../common/storage/storage.service";
import { photoUploadOptions, receiptUploadOptions } from "../common/storage/upload.config";

// Only these prefixes are reachable through the GET redirect below — an
// allow-list, so a crafted key cannot reach into unrelated parts of the bucket.
// "mock" holds the placeholder/hero art the frontend used to hotlink from
// Unsplash (see frontend's shared/constants/mockImages.ts); it is written by
// hand, never by an upload endpoint.
const SERVABLE_FOLDERS = new Set(["signatures", "photos", "receipts", "mock"]);

// General-purpose upload endpoints (weaver profile photos, LR receipts, ...).
// Bytes go wherever StorageService is configured to put them — Cloudflare R2
// in production, local disk when R2 env vars are absent. The response is a
// server-relative path; callers resolve it against the API origin for display
// (see frontend's resolveAssetUrl).
@Controller("uploads")
export class UploadsController {
  constructor(private readonly storage: StorageService) {}

  @Post("photo")
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor("photo", photoUploadOptions()))
  async uploadPhoto(@UploadedFile() photo?: Express.Multer.File) {
    if (!photo) {
      throw new BadRequestException("A photo file is required");
    }
    return { url: await this.storage.upload(photo, "photos") };
  }

  // Dispatch LR receipts — separate from /photo because a receipt is commonly
  // a scanned PDF and the dropzones allow 10MB, neither of which /photo accepts.
  @Post("receipt")
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor("receipt", receiptUploadOptions()))
  async uploadReceipt(@UploadedFile() receipt?: Express.Multer.File) {
    if (!receipt) {
      throw new BadRequestException("A receipt file is required");
    }
    return { url: await this.storage.upload(receipt, "receipts") };
  }

  /**
   * Serves a stored file by its "/uploads/<folder>/<file>" path when the R2
   * driver is active, by redirecting to the object's public or presigned URL.
   * Under the local driver this route is never reached: express.static is
   * mounted on the same prefix in main.ts and answers first.
   *
   * Writes to the raw response rather than using @Redirect() because the
   * global ResponseInterceptor wraps every returned value in an envelope,
   * which would hide the { url } shape @Redirect() expects.
   */
  // Unauthenticated, exactly like the express.static mount it replaces: the
  // URLs end up in <img src>/<a href>, which cannot carry a bearer token.
  // Access control is the unguessable UUID filename, as before.
  @Public()
  @Get(":folder/:filename")
  async serve(
    @Param("folder") folder: string,
    @Param("filename") filename: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!SERVABLE_FOLDERS.has(folder) || !/^[\w.-]+$/.test(filename)) {
      throw new NotFoundException("File not found");
    }
    const url = await this.storage.resolveUrl(`${folder}/${filename}`);
    if (!url) {
      throw new NotFoundException("File not found");
    }
    res.redirect(HttpStatus.FOUND, url);
  }
}
