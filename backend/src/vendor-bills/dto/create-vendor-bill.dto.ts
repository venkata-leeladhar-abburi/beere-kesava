import { Type } from "class-transformer";
import {
  IsArray, IsDateString, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested,
} from "class-validator";

export class VendorBillMaterialAmountDto {
  @IsUUID()
  itemId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount!: number;
}

export class CreateVendorBillDto {
  // No auth yet — the acting user's id is supplied explicitly for the action
  // feed until JWT/OTP auth exists and req.user is available.
  @IsOptional()
  @IsUUID()
  actorId?: string;

  @IsUUID()
  vendorId!: string;

  // Optional link to the purchase order this bill was generated from (e.g.
  // on GRN receipt). Absent for manually entered bills (rent, services, etc).
  @IsOptional()
  @IsUUID()
  poId?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  invoiceFileUrl?: string;

  @IsOptional()
  @IsString()
  invoiceFileName?: string;

  // Entry aid only — PurchaseOrderItem.invoicedAmount has no bearing on the
  // bill's own total (`amount` above is what's actually owed); this just
  // records how the admin split that total across the PO's material lines,
  // so PO-tracking screens can show a real per-material invoiced figure.
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VendorBillMaterialAmountDto)
  materialAmounts?: VendorBillMaterialAmountDto[];
}
