import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { FinancialEntryKind } from "../../generated/prisma/client";

export class CreateFinancialEntryDto {
  @IsEnum(FinancialEntryKind)
  kind!: FinancialEntryKind;

  @IsString()
  category!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
