import { IsEmail, IsEnum, IsOptional, IsString, Length, Matches } from "class-validator";
import { ActiveStatus, UserRole } from "../../generated/prisma/client";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  lastName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{10,15}$/, { message: "mobile must be a valid phone number" })
  mobile?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(ActiveStatus)
  status?: ActiveStatus;
}
