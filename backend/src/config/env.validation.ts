import { plainToInstance } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, validateSync } from "class-validator";

class EnvironmentVariables {
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

  @IsString()
  @IsNotEmpty()
  AISENSY_API_KEY!: string;

  @IsString()
  @IsNotEmpty()
  AISENSY_SENDER_NAME!: string;

  @IsOptional()
  @IsString()
  AISENSY_API_URL?: string;

  @IsOptional()
  @IsString()
  WHATSAPP_ENABLED?: string;

  @IsOptional()
  @IsString()
  WHATSAPP_DEFAULT_COUNTRY_CODE?: string;

  // Cloudflare R2 object storage. All optional: when the four required ones
  // (account id, key pair, bucket) are absent, StorageService falls back to
  // local-disk uploads so dev and tests need no cloud credentials.
  @IsOptional()
  @IsString()
  R2_ACCOUNT_ID?: string;

  @IsOptional()
  @IsString()
  R2_ACCESS_KEY_ID?: string;

  @IsOptional()
  @IsString()
  R2_SECRET_ACCESS_KEY?: string;

  @IsOptional()
  @IsString()
  R2_BUCKET?: string;

  /** Overrides the default https://<account-id>.r2.cloudflarestorage.com endpoint. */
  @IsOptional()
  @IsString()
  R2_ENDPOINT?: string;

  /** Public bucket or custom-domain origin; without it, reads use presigned URLs. */
  @IsOptional()
  @IsString()
  R2_PUBLIC_BASE_URL?: string;
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
