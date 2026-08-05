import { IsEmail, IsEnum, IsOptional, IsString, Length, Matches } from "class-validator";
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

  @IsOptional()
  @IsEnum(AccessLevel)
  accessLevel?: AccessLevel;
}
