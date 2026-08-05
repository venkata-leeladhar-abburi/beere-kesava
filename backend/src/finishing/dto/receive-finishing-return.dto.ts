import { IsEnum, IsOptional, IsString, ValidateIf } from "class-validator";
import { DamageSeverity, FinishingCondition } from "../../generated/prisma/client";

export class ReceiveFinishingReturnDto {
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
