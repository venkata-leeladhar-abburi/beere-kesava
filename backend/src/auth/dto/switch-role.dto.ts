import { IsEnum } from "class-validator";
import { UserRole } from "../../generated/prisma/client";
import { LocationDto } from "../../geofence/dto/location.dto";

// Carries a position for the same reason verify-otp does: switching portals
// issues a fresh token, so an unrestricted role could otherwise be used as a
// side door into a geofenced one from anywhere.
export class SwitchRoleDto extends LocationDto {
  @IsEnum(UserRole)
  role!: UserRole;
}
