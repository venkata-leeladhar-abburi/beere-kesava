import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID, Min } from "class-validator";

export class TallyBatchRowDto {
  @IsBoolean()
  tallied!: boolean;

  // No auth yet — explicit name of the tallying user (matches
  // UpdateBulkOrderDto.talliedBy).
  @IsOptional()
  @IsString()
  talliedBy?: string;

  // No auth yet — the acting user's id is supplied explicitly for the audit
  // trail until JWT/OTP auth exists and req.user is available.
  @IsOptional()
  @IsUUID()
  actorId?: string;

  // Admin's correction to Worker Staff's received weight/material entry,
  // made while tallying — e.g. a scale misread caught during verification.
  // Optional: omitting these leaves the received values untouched.
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  warpG?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  reshamG?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  jariReels?: number;
}
