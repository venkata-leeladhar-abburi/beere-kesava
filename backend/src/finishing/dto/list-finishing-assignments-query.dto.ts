import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from "class-validator";
import { FinishingAssignmentStatus } from "../../generated/prisma/client";

export class ListFinishingAssignmentsQueryDto {
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
  @IsEnum(FinishingAssignmentStatus)
  status?: FinishingAssignmentStatus;

  @IsOptional()
  @IsUUID()
  finishingStaffId?: string;
}
