import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";

export class ListActionLogQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  module?: string;
}
