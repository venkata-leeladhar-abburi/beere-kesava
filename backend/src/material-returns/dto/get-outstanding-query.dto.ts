import { IsOptional, IsUUID } from "class-validator";

export class GetOutstandingQueryDto {
  @IsOptional()
  @IsUUID()
  weaverId?: string;

  @IsOptional()
  @IsUUID()
  factoryLoomId?: string;
}
