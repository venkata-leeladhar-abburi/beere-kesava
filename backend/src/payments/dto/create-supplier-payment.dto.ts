import { Type } from "class-transformer";
import { IsISO8601, IsNumber, IsOptional, IsString, IsUUID, Min } from "class-validator";

export class CreateSupplierPaymentDto {
  // No auth yet — the acting user's id is supplied explicitly for the action
  // feed until JWT/OTP auth exists and req.user is available.
  @IsOptional()
  @IsUUID()
  actorId?: string;

  // Set server-side from the authenticated user (see PaymentsController).
  @IsOptional()
  @IsUUID()
  recordedById?: string;

  @IsUUID()
  supplierId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount!: number;

  // The calendar day the money went out, as "yyyy-MM-dd" (a full ISO
  // timestamp is still accepted from older callers). Stored as that day's UTC
  // midnight — see paymentCalendarDate in PaymentsService.
  @IsOptional()
  @IsISO8601({ strict: true }, { message: "date must be a valid date (yyyy-MM-dd)" })
  date?: string;

  @IsOptional()
  @IsString()
  utr?: string;

  @IsOptional()
  @IsString()
  method?: string;

  // Firm ids are FIRM-NNN, not UUIDs — @IsUUID() here rejected every real
  // firm id with a 400 (same bug already fixed on the purchase-order DTO).
  @IsOptional()
  @IsString()
  firmId?: string;

  // Links this payment to a specific Purchase it settles (partial or full).
  // Purchase ids are human-facing codes (e.g. EXT-2026-NNN), not UUIDs.
  @IsOptional()
  @IsString()
  purchaseId?: string;
}
