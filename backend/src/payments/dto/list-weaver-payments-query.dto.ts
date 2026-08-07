import { Type } from "class-transformer";
import { IsInt, IsOptional, IsUUID, Max, Min } from "class-validator";

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

  @IsOptional()
  @IsUUID()
  firmId?: string;
}
