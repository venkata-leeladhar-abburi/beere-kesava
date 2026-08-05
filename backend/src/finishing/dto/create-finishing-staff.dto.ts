import { IsEmail, IsOptional, IsString, Length, Matches } from "class-validator";

export class CreateFinishingStaffDto {
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

  @IsOptional()
  @IsString()
  specialisation?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
