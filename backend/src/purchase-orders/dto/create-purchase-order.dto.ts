import { IsDateString, IsNumber, IsOptional, IsPositive, IsString, IsUUID } from "class-validator";

export class CreatePurchaseOrderDto {
  @IsUUID()
  vendorId!: string;

  @IsOptional()
  @IsDateString()
  deliveryDate?: string;

  @IsNumber()
  @IsPositive()
  totalValue!: number;

  @IsOptional()
  @IsString()
  urgency?: string;
}
