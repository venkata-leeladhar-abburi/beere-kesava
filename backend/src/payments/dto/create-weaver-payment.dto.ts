import { Type } from "class-transformer";
import { IsInt, IsNumber, IsOptional, IsString, IsUUID, Min } from "class-validator";

export class CreateWeaverPaymentDto {
  // No auth yet — the acting user's id is supplied explicitly for the action
  // feed until JWT/OTP auth exists and req.user is available.
  @IsOptional()
  @IsUUID()
  actorId?: string;

  @IsUUID()
  weaverId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amountPaid!: number;

  @IsOptional()
  @IsString()
  utrNumber?: string;

  @IsOptional()
  @IsUUID()
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
