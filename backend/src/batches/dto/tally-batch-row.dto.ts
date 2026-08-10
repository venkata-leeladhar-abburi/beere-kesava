import { IsBoolean, IsOptional, IsString, IsUUID } from "class-validator";

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
}
