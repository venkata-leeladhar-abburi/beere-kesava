import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, Min } from "class-validator";

export class CreatePurchaseOrderDto {
  @IsUUID()
  vendorId!: string;

  @IsOptional()
  @IsDateString()
  deliveryDate?: string;

  // Optional: the real frontend flow raises a PO with materials/quantities
  // only — per-unit pricing (and so totalValue) is filled in later, closer
  // to GRN/invoicing time, not at creation.
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalValue?: number;

  @IsOptional()
  @IsString()
  urgency?: string;
}
