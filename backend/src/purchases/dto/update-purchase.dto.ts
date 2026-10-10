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
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import { PurchaseDiscountType } from "../../generated/prisma/client";
import { CreatePurchaseSareeLineDto } from "./create-purchase-saree-line.dto";

export class UpdatePurchaseDto {
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @IsString()
  supplierName?: string;

  @IsOptional()
  @IsString()
  location?: string;

  /** Firm.id to book this purchase to. Omitted leaves it unchanged; it can't
   *  be cleared, and can't move once another firm has paid against it. */
  @IsOptional()
  @IsString()
  firmId?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

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

  // The bill itself (subtotal, discount, GST, billAmount) is calculated
  // server-side from the saree lines and these three inputs — see
  // PurchasesService.computeBill. Payment status is never sent: it follows
  // the supplier payments linked to the purchase (recomputeStatus).
  @IsOptional()
  @IsEnum(PurchaseDiscountType)
  discountType?: PurchaseDiscountType | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  gstPercent?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  invoiceFileName?: string;

  @IsOptional()
  @IsString()
  invoiceFileUrl?: string;

  // Omitted entirely: leave existing lines untouched. Present: replaces every
  // line wholesale (simplest correct semantics for an edit form that always
  // resubmits its full saree-details table).
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseSareeLineDto)
  sarees?: CreatePurchaseSareeLineDto[];
}
