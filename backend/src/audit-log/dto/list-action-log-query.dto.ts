import { Transform, Type } from "class-transformer";
import { IsArray, IsInt, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";

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
  @Max(200)
  pageSize: number = 20;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  module?: string;

  /**
   * Comma-separated module names, for showing one person's history scoped to
   * a single portal ("what did this worker do?" is BATCHES/QC/FINISHING/...,
   * not every module in the system). Takes precedence over `module`.
   */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === "string"
      ? value.split(",").map((v) => v.trim()).filter(Boolean)
      : (value as unknown),
  )
  modules?: string[];
}
