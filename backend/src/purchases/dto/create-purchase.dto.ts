import { IsInt, IsNumber, IsOptional, IsPositive, IsString, IsUUID } from "class-validator";

export class CreatePurchaseDto {
  @IsUUID()
  supplierId!: string;

  @IsInt()
  @IsPositive()
  sareeCount!: number;

  @IsOptional()
  @IsString()
  gstNumber?: string;

  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @IsNumber()
  @IsPositive()
  billAmount!: number;
}
