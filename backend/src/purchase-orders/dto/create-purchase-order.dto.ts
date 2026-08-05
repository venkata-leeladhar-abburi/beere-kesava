import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, Min } from "class-validator";

export class CreatePurchaseOrderDto {
  // No auth yet — the acting user's id is supplied explicitly for the action
  // feed until JWT/OTP auth exists and req.user is available.
  @IsOptional()
  @IsUUID()
  actorId?: string;

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
