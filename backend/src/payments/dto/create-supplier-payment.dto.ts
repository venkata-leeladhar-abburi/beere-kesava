import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString, IsUUID, Min } from "class-validator";

export class CreateSupplierPaymentDto {
  // No auth yet — the acting user's id is supplied explicitly for the action
  // feed until JWT/OTP auth exists and req.user is available.
  @IsOptional()
  @IsUUID()
  actorId?: string;

  @IsUUID()
  supplierId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  utr?: string;

  @IsOptional()
  @IsString()
  method?: string;

  @IsOptional()
  @IsUUID()
  firmId?: string;

  // Links this payment to a specific Purchase it settles (partial or full).
  // Purchase ids are human-facing codes (e.g. EXT-2026-NNN), not UUIDs.
  @IsOptional()
  @IsString()
  purchaseId?: string;
}
