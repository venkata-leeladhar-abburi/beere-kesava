import { IsOptional, IsUUID } from "class-validator";

export class WeaverEarningsQueryDto {
  @IsOptional()
  @IsUUID()
  weaverId?: string;
}
