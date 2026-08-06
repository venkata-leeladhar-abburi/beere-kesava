import { IsEnum, IsOptional, IsString, IsUUID, ValidateIf } from "class-validator";
import { DamageSeverity, FinishingCondition } from "../../generated/prisma/client";

export class ReceiveFinishingReturnDto {
  // No auth yet — the acting user's id is supplied explicitly for the action
  // feed until JWT/OTP auth exists and req.user is available.
  @IsOptional()
  @IsUUID()
  actorId?: string;

  @IsEnum(FinishingCondition)
  condition!: FinishingCondition;

  @ValidateIf((o: ReceiveFinishingReturnDto) => o.condition === FinishingCondition.DAMAGED)
  @IsString()
  damageType?: string;

  @ValidateIf((o: ReceiveFinishingReturnDto) => o.condition === FinishingCondition.DAMAGED)
  @IsEnum(DamageSeverity)
  damageSeverity?: DamageSeverity;

  @IsOptional()
  @IsString()
  damageNotes?: string;

  @IsOptional()
  @IsString()
  damagePhotoUrl?: string;
}
