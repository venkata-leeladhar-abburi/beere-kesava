import { ArrayUnique, IsArray, IsEmail, IsEnum, IsInt, IsOptional, IsString, Length, Matches, Min } from "class-validator";
import { AccessLevel, UserRole } from "../../generated/prisma/client";

export class CreateUserDto {
  @IsString()
  @Length(1, 100)
  firstName!: string;

  @IsString()
  @Length(1, 100)
  lastName!: string;

  @IsString()
  @Matches(/^\+?[0-9]{10,15}$/, { message: "mobile must be a valid phone number" })
  mobile!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsEnum(UserRole)
  role!: UserRole;

  // Extra portals besides `role` — the person picks one at login and can
  // switch between them. WEAVER and SUPERADMIN are rejected by the service.
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(UserRole, { each: true })
  additionalRoles?: UserRole[];

  @IsOptional()
  @IsEnum(AccessLevel)
  accessLevel?: AccessLevel;

  // Only used when role === WEAVER — populates the linked Weaver record
  // created alongside this User (see users.service.ts's create()). Ignored
  // for every other role.
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  village?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  cluster?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  looms?: number;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  accountNo?: string;

  @IsOptional()
  @IsString()
  ifsc?: string;
}
