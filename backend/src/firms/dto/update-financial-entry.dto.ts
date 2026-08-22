import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { FinancialEntryKind } from "../../generated/prisma/client";

export class UpdateFinancialEntryDto {
  @IsOptional()
  @IsEnum(FinancialEntryKind)
  kind?: FinancialEntryKind;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
