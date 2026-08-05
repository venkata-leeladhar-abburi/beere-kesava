import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString, Length, Min } from "class-validator";

export class UpdateRateDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  type?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  makingCharge?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  retailPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  wholesalePrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stdWeightG?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  warpWeightG?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  reshamWeightG?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  jariWeightG?: number;
}
