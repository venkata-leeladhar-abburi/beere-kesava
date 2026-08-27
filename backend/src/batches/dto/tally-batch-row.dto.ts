import { IsBoolean, IsNumber, IsOptional, IsUUID, Min } from "class-validator";

export class TallyBatchRowDto {
  @IsBoolean()
  tallied!: boolean;

  // Set server-side from the authenticated user (see BatchesController) —
  // not read from the request body.
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
