import { IsEnum, IsInt, IsOptional, IsString, Length, Max, Min } from "class-validator";
import { LoomStatus } from "../../generated/prisma/client";

export class UpdateFactoryLoomDto {
  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  operatorName?: string;

  @IsOptional()
  @IsString()
  operatorPhone?: string;

  @IsOptional()
  @IsEnum(LoomStatus)
  status?: LoomStatus;

  @IsOptional()
  @IsInt()
  @Min(1990)
  @Max(2100)
  installedYear?: number;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  notes?: string;
}
