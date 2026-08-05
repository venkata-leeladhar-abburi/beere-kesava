import { IsEnum, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import { JariGrade, MaterialType, WarpSubtype } from "../../generated/prisma/client";

export class CreateMaterialIssueItemDto {
  @IsEnum(MaterialType)
  materialType!: MaterialType;

  @IsOptional()
  @IsEnum(WarpSubtype)
  warpSubtype?: WarpSubtype;

  @IsNumber()
  @IsPositive()
  quantity!: number;

  @IsString()
  unit!: string;

  @IsOptional()
  @IsString()
  jariType?: string;

  @IsOptional()
  @IsEnum(JariGrade)
  jariGrade?: JariGrade;

  @IsOptional()
  @IsString()
  jariColor?: string;

  @IsOptional()
  @IsString()
  grnBatchId?: string;
}
