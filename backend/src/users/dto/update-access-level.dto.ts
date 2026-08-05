import { IsEnum } from "class-validator";
import { AccessLevel } from "../../generated/prisma/client";

export class UpdateAccessLevelDto {
  @IsEnum(AccessLevel)
  accessLevel!: AccessLevel;
}
