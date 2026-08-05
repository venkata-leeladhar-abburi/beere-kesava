import { IsEnum, IsOptional, IsString } from "class-validator";
import { PurchasePaymentStatus } from "../../generated/prisma/client";

export class UpdatePurchaseDto {
  @IsOptional()
  @IsString()
  gstNumber?: string;

  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @IsOptional()
  @IsEnum(PurchasePaymentStatus)
  status?: PurchasePaymentStatus;
}
