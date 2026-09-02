import { plainToInstance } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, validateSync } from "class-validator";

class EnvironmentVariables {
  // Gates production-only hardening in main.ts (CORS fails closed instead of
  // open when CORS_ORIGIN is unset) — declared here so it's validated and
  // documented like every other env var this app depends on.
  @IsOptional()
  @IsString()
  NODE_ENV?: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  DIRECT_URL!: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT!: number;

  @IsOptional()
  @IsString()
  AISENSY_API_KEY?: string;

  @IsOptional()
  @IsString()
  AISENSY_SENDER_NAME?: string;

  @IsOptional()
  @IsString()
  AISENSY_API_URL?: string;

  @IsOptional()
  @IsString()
  WHATSAPP_ENABLED?: string;

  @IsOptional()
  @IsString()
  WHATSAPP_DEFAULT_COUNTRY_CODE?: string;

  /**
   * Comma-separated numbers that receive the `bk_admin_sale_alert_` feed —
   * one message per counter sale, each carrying the bill PDF. Deliberately
   * NOT the SUPERADMIN user list: this is an owners' feed, and the people on
   * it are not necessarily the people who hold a superadmin login.
   *
   * Each number must have messaged the WhatsApp Business number at least once,
   * or Meta will not reliably deliver a template to it.
   */
  @IsOptional()
  @IsString()
  ADMIN_WHATSAPP_NUMBERS?: string;

  /**
   * Fills {{1}} of `bk_admin_sale_alert_` — which shop the sale happened at.
   * A single-outlet firm still sends it: the variable exists so a second
   * outlet never requires a new template and a fresh Meta approval.
   */
  @IsOptional()
  @IsString()
  SHOP_OUTLET_NAME?: string;

  // Cloudflare R2 object storage — required. Invoices, saree photos and
  // signatures must always be stored in the cloud; StorageService refuses to
  // start without these, so the app must never fall back to local disk.
  @IsString()
  @IsNotEmpty()
  R2_ACCOUNT_ID!: string;

  @IsString()
  @IsNotEmpty()
  R2_ACCESS_KEY_ID!: string;

  @IsString()
  @IsNotEmpty()
  R2_SECRET_ACCESS_KEY!: string;

  @IsString()
  @IsNotEmpty()
  R2_BUCKET!: string;

  /** Overrides the default https://<account-id>.r2.cloudflarestorage.com endpoint. */
  @IsOptional()
  @IsString()
  R2_ENDPOINT?: string;

  /** Public bucket or custom-domain origin; without it, reads use presigned URLs. */
  @IsOptional()
  @IsString()
  R2_PUBLIC_BASE_URL?: string;

  /** Deployed frontend origin, e.g. https://app.beerekesava.com — used to
   *  build the /scan?id= link encoded into a saree tag's QR code. Falls back
   *  to the local dev frontend when unset. */
  @IsOptional()
  @IsString()
  FRONTEND_URL?: string;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const messages = errors
      .map((error) => Object.values(error.constraints ?? {}).join(", "))
      .join("; ");
    throw new Error(`Invalid environment configuration: ${messages}`);
  }

  return validated;
}
