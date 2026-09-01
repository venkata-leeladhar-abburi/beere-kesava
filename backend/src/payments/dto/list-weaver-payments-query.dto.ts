import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";

export class ListWeaverPaymentsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  pageSize: number = 20;

  @IsOptional()
  @IsUUID()
  weaverId?: string;

  // Firm ids are FIRM-NNN, not UUIDs — @IsUUID() here rejected every real
  // firm id with a 400 (same bug already fixed on the purchase-order DTO).
  @IsOptional()
  @IsString()
  firmId?: string;
}
