import { Type } from "class-transformer";
import { IsInt, IsNumber, IsOptional, IsString, IsUUID, Min } from "class-validator";

export class CreateWeaverPaymentDto {
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
  weaverId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amountPaid!: number;

  @IsOptional()
  @IsString()
  utrNumber?: string;

  // Firm ids are FIRM-NNN, not UUIDs — @IsUUID() here rejected every real
  // firm id with a 400 (same bug already fixed on the purchase-order DTO).
  @IsOptional()
  @IsString()
  firmId?: string;

  @IsOptional()
  @IsString()
  paymentDate?: string;

  @IsOptional()
  @IsString()
  batchNo?: string;

  @IsOptional()
  @IsString()
  loomNumber?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  noOfSarees?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  deduction?: number;
}
