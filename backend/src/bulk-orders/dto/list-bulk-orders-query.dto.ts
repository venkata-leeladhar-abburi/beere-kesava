import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from "class-validator";
import { BulkOrderStatus } from "../../generated/prisma/client";

export class ListBulkOrdersQueryDto {
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
  @IsEnum(BulkOrderStatus)
  status?: BulkOrderStatus;

  @IsOptional()
  @IsUUID()
  customerId?: string;
}
