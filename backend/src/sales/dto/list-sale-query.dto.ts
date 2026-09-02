import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from "class-validator";
import { SalesChannel } from "../../generated/prisma/client";

export class ListSaleQueryDto {
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
  @IsEnum(SalesChannel)
  channel?: SalesChannel;

  /** Narrows the list to one customer's purchase history. */
  @IsOptional()
  @IsUUID()
  customerId?: string;
}
