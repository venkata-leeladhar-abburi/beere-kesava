import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString, IsUUID, Min } from "class-validator";

export class CreateVendorPaymentDto {
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
  vendorId!: string;

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

  // Optional: when present, this payment settles (partially or fully)
  // against the given vendor bill, and the bill's status is recomputed.
  @IsOptional()
  @IsUUID()
  billId?: string;
}
