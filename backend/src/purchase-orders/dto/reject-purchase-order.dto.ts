import { IsOptional, IsString, IsUUID } from "class-validator";

export class RejectPurchaseOrderDto {
  @IsOptional()
  @IsUUID()
  actorId?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
