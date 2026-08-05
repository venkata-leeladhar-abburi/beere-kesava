import { Type } from "class-transformer";
import { IsBoolean, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateReturnDto {
  @IsString()
  sareeId!: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  refundAmount?: number;

  @IsOptional()
  @IsBoolean()
  restocked?: boolean;
}
