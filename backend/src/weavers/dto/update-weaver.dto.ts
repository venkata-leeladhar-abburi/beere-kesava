import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Min,
} from "class-validator";
import { ActiveStatus } from "../../generated/prisma/client";

export class UpdateWeaverDto {
  @IsOptional()
  @IsUUID()
  actorId?: string;

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
  @Length(1, 20)
  initials?: string;

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
  photoUrl?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{10,15}$/, { message: "phone must be a valid phone number" })
  phone?: string;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  accountNo?: string;

  @IsOptional()
  @IsString()
  ifsc?: string;

  @IsOptional()
  @IsEnum(ActiveStatus)
  status?: ActiveStatus;
}
