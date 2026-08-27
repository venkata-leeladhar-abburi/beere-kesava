import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from "class-validator";
import { PurchasePaymentStatus } from "../../generated/prisma/client";
import { CreatePurchaseSareeLineDto } from "./create-purchase-saree-line.dto";

export class CreatePurchaseDto {
  // Exactly one of supplierId/supplierName is required (validated in
  // PurchasesService.create) — supplierId for a registered Supplier,
  // supplierName+location for the form's "Other (enter manually)" option.
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @IsString()
  supplierName?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  // Derived from the sum of saree line quantities when omitted.
  @IsOptional()
  @IsInt()
  @IsPositive()
  sareeCount?: number;

  @IsOptional()
  @IsString()
  gstNumber?: string;

  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @IsNumber()
  @Min(0)
  billAmount!: number;

  @IsOptional()
  @IsEnum(PurchasePaymentStatus)
  status?: PurchasePaymentStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  invoiceFileName?: string;

  @IsOptional()
  @IsString()
  invoiceFileUrl?: string;

  // No auth yet — the acting user's id is supplied explicitly for the action
  // feed until JWT/OTP auth exists and req.user is available.
  @IsOptional()
  @IsUUID()
  addedById?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseSareeLineDto)
  sarees!: CreatePurchaseSareeLineDto[];
}
