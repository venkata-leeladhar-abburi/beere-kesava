import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { photoFileToUrl, photoUploadOptions } from "../common/storage/upload.config";

// General-purpose photo upload (weaver profile photos, etc.) — same local-disk
// pattern as material-issues' signature capture, not the S3 pre-signed-URL
// flow the original architecture doc sketched, since this project doesn't
// have S3 wired up. Returns a server-relative path; callers resolve it
// against the API origin for display (see frontend's resolveAssetUrl).
@Controller("uploads")
export class UploadsController {
  @Post("photo")
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor("photo", photoUploadOptions()))
  uploadPhoto(@UploadedFile() photo?: Express.Multer.File) {
    if (!photo) {
      throw new BadRequestException("A photo file is required");
    }
    return { url: photoFileToUrl(photo) };
  }
}
