import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsEnum, ValidateNested } from "class-validator";
import { AccessLevel, UserRole } from "../../generated/prisma/client";

/** One portal's access level. The role must be one the person is assigned. */
export class PortalAccessLevelDto {
  @IsEnum(UserRole)
  role!: UserRole;

  @IsEnum(AccessLevel)
  accessLevel!: AccessLevel;
}

export class UpdateAccessLevelsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PortalAccessLevelDto)
  levels!: PortalAccessLevelDto[];
}
