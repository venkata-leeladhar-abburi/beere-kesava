import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";
import { MaterialIssueStatus } from "../../generated/prisma/client";

export class ListMaterialIssuesQueryDto {
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
  @IsEnum(MaterialIssueStatus)
  status?: MaterialIssueStatus;

  @IsOptional()
  @IsUUID()
  weaverId?: string;

  @IsOptional()
  @IsString()
  batchId?: string;
}
