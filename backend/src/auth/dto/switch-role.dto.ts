import { IsEnum } from "class-validator";
import { UserRole } from "../../generated/prisma/client";

export class SwitchRoleDto {
  @IsEnum(UserRole)
  role!: UserRole;
}
