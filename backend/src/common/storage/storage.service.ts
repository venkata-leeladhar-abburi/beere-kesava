import { randomUUID } from "crypto";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/** How long a presigned GET link stays valid when the bucket is private (no public base URL). */
const PRESIGNED_URL_TTL_SECONDS = 60 * 60;

export type StorageFolder = "signatures" | "photos" | "receipts" | "documents";

/**
 * Object storage for user-uploaded files (signatures, photos, LR receipts).
 *
 * Cloudflare R2, over its S3-compatible API, is the only supported driver —
 * these files must always live in the cloud, never on local disk (local
 * files disappear on redeploy on ephemeral hosts, and there is no reason to
 * keep a dev-only fallback around). The service refuses to start unless
 * R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET are
 * all set.
 *
 * `upload()` returns a server-relative "/uploads/<folder>/<file>" key, so
 * the frontend's resolveAssetUrl keeps working unchanged; UploadsController's
 * GET handler redirects that key to the object — a public URL when
 * R2_PUBLIC_BASE_URL is configured, otherwise a presigned link.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string | null;

  constructor(private readonly config: ConfigService) {
    const accountId = this.config.get<string>("R2_ACCOUNT_ID");
    const accessKeyId = this.config.get<string>("R2_ACCESS_KEY_ID");
    const secretAccessKey = this.config.get<string>("R2_SECRET_ACCESS_KEY");
    const bucket = this.config.get<string>("R2_BUCKET");

    if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
      throw new Error(
        "Cloud storage is not configured. R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY " +
          "and R2_BUCKET are all required — invoices, saree images and signatures must be stored " +
          "in the cloud only; local-disk storage is not supported.",
      );
    }

    this.bucket = bucket;
    this.publicBaseUrl = this.config.get<string>("R2_PUBLIC_BASE_URL")?.replace(/\/+$/, "") || null;
    this.client = new S3Client({
      // R2 ignores the region but the SDK insists on one; "auto" is what
      // Cloudflare's own docs use.
      region: "auto",
      endpoint: this.config.get<string>("R2_ENDPOINT") ?? `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
    this.logger.log(`Using Cloudflare R2 storage (bucket: ${bucket})`);
  }

  /** Cloud storage is always the driver; kept for callers checking prior to a URL resolve. */
  get isRemote(): boolean {
    return true;
  }

  /**
   * Persist an uploaded file to R2 and return the server-relative key to
   * store on the owning record. Files arrive in memory (multer
   * memoryStorage), so this is the single point where bytes hit the bucket.
   */
  async upload(file: Express.Multer.File, folder: StorageFolder): Promise<string> {
    const key = `${folder}/${randomUUID()}${extensionFor(file.mimetype)}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return `/uploads/${key}`;
  }

  /**
   * Resolve a stored "/uploads/<folder>/<file>" path to a URL a browser can
   * fetch directly — a public URL when R2_PUBLIC_BASE_URL is configured,
   * otherwise a presigned link.
   */
  async resolveUrl(key: string): Promise<string> {
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
