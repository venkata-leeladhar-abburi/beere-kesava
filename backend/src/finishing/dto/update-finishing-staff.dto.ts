import { IsEmail, IsEnum, IsOptional, IsString, Length, Matches } from "class-validator";
import { ActiveStatus } from "../../generated/prisma/client";

export class UpdateFinishingStaffDto {
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
  @IsString()
  specialisation?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(ActiveStatus)
  status?: ActiveStatus;
}
