import { randomUUID } from "crypto";
import { existsSync, mkdirSync } from "fs";
import { writeFile } from "fs/promises";
import { join } from "path";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UPLOADS_ROOT } from "./upload.config";

/** How long a presigned GET link stays valid when the bucket is private (no public base URL). */
const PRESIGNED_URL_TTL_SECONDS = 60 * 60;

export type StorageFolder = "signatures" | "photos" | "receipts";

/**
 * Object storage for user-uploaded files (signatures, photos, LR receipts).
 *
 * Two drivers, chosen at boot from the environment:
 *  - "r2"    — Cloudflare R2 over its S3-compatible API. Used when
 *              R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and
 *              R2_BUCKET are all set.
 *  - "local" — the original local-disk behaviour under backend/uploads.
 *              Kept as the default so dev and tests need no cloud creds, but
 *              note that on ephemeral hosts (Render, containers) local files
 *              disappear on redeploy — production should run the r2 driver.
 *
 * Either way `upload()` returns a server-relative "/uploads/<folder>/<file>"
 * path, so what lands in the DB is driver-independent and the frontend's
 * resolveAssetUrl keeps working unchanged. With R2 that path is served by
 * UploadsController's GET handler, which redirects to the object — a public
 * URL when R2_PUBLIC_BASE_URL is configured, otherwise a presigned link.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client | null;
  private readonly bucket: string;
  private readonly publicBaseUrl: string | null;

  constructor(private readonly config: ConfigService) {
    const accountId = this.config.get<string>("R2_ACCOUNT_ID");
    const accessKeyId = this.config.get<string>("R2_ACCESS_KEY_ID");
    const secretAccessKey = this.config.get<string>("R2_SECRET_ACCESS_KEY");
    const bucket = this.config.get<string>("R2_BUCKET");
    this.bucket = bucket ?? "";
    this.publicBaseUrl = this.config.get<string>("R2_PUBLIC_BASE_URL")?.replace(/\/+$/, "") || null;

    if (accountId && accessKeyId && secretAccessKey && bucket) {
      this.client = new S3Client({
        // R2 ignores the region but the SDK insists on one; "auto" is what
        // Cloudflare's own docs use.
        region: "auto",
        endpoint:
          this.config.get<string>("R2_ENDPOINT") ?? `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId, secretAccessKey },
      });
      this.logger.log(`Using Cloudflare R2 storage (bucket: ${bucket})`);
    } else {
      this.client = null;
      this.logger.warn("R2 not configured — falling back to local disk storage under ./uploads");
    }
  }

  /** True when the R2 driver is active; false when files live on local disk. */
  get isRemote(): boolean {
    return this.client !== null;
  }

  /**
   * Persist an uploaded file and return the server-relative URL to store on
   * the owning record. Files arrive in memory (multer memoryStorage), so this
   * is the single point where bytes hit a disk or a bucket.
   */
  async upload(file: Express.Multer.File, folder: StorageFolder): Promise<string> {
    const key = `${folder}/${randomUUID()}${extensionFor(file.mimetype)}`;

    if (this.client) {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );
    } else {
      const destination = join(UPLOADS_ROOT, folder);
      if (!existsSync(destination)) {
        mkdirSync(destination, { recursive: true });
      }
      await writeFile(join(UPLOADS_ROOT, key), file.buffer);
    }

    return `/uploads/${key}`;
  }

  /**
   * Resolve a stored "/uploads/<folder>/<file>" path to a URL a browser can
   * fetch directly. Only meaningful for the R2 driver — under the local
   * driver express.static already serves the path as-is.
   */
  async resolveUrl(key: string): Promise<string | null> {
    if (!this.client) return null;
    if (this.publicBaseUrl) return `${this.publicBaseUrl}/${key}`;
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: key }), {
      expiresIn: PRESIGNED_URL_TTL_SECONDS,
    });
  }
}

function extensionFor(mimetype: string): string {
  switch (mimetype) {
    case "application/pdf":
      return ".pdf";
    case "image/png":
      return ".png";
    default:
      return ".jpg";
  }
}
