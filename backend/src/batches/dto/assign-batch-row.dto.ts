import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from "class-validator";
import { RecipientType } from "../../generated/prisma/client";

/** PATCH /batches/:id/rows/:serial — assign a saree row to a weaver or factory loom. */
export class AssignBatchRowDto {
  // No auth yet — the acting user's id is supplied explicitly for the action
  // feed until JWT/OTP auth exists and req.user is available.
  @IsOptional()
  @IsUUID()
  actorId?: string;

  @IsEnum(RecipientType)
  recipientType!: RecipientType;

  @IsOptional()
  @IsUUID()
  weaverId?: string;

  @IsOptional()
  @IsUUID()
  factoryLoomId?: string;

  @IsOptional()
  @IsString()
  designCode?: string;

  @IsString()
  sareeTypeCode!: string;

  @IsOptional()
  @IsString()
  bulkOrderRef?: string;

  // Which of the weaver's own looms this row is on (used only for the
  // {WeaverInitials}-L{loom}-{seq3} saree ID format — architecture doc §6.1).
  @IsOptional()
  @IsInt()
  @Min(1)
  loomNumber?: number;
}
