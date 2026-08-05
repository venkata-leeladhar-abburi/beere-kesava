import { IsInt, IsNumber, IsOptional, IsPositive, IsString, IsUUID } from "class-validator";

export class CreatePurchaseRequestDto {
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  // No auth yet — the requesting user's id must be supplied explicitly until
  // JWT/OTP auth exists and req.user is available.
  @IsUUID()
  requestedById!: string;

  @IsOptional()
  @IsString()
  sareeType?: string;

  @IsInt()
  @IsPositive()
  quantity!: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  estimatedAmount?: number;

  @IsOptional()
  @IsString()
  urgency?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
