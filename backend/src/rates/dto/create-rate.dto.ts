import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString, IsUUID, Length, Min } from "class-validator";

export class CreateRateDto {
  // No auth yet — the acting user's id is supplied explicitly for the action
  // feed until JWT/OTP auth exists and req.user is available.
  @IsOptional()
  @IsUUID()
  actorId?: string;

  @IsString()
  @Length(1, 30)
  code!: string;

  @IsString()
  @Length(1, 100)
  type!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  makingCharge!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  retailPrice!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  wholesalePrice!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stdWeightG!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  warpWeightG!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  reshamWeightG!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  jariWeightG!: number;
}
