import { Type } from "class-transformer";
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from "class-validator";
import { MaterialType } from "../../generated/prisma/client";

export class CreatePurchaseOrderItemDto {
  @IsEnum(MaterialType)
  materialType!: MaterialType;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;
}

export class CreatePurchaseOrderDto {
  // No auth yet — the acting user's id is supplied explicitly for the action
  // feed until JWT/OTP auth exists and req.user is available.
  @IsOptional()
  @IsUUID()
  actorId?: string;

  @IsUUID()
  vendorId!: string;

  /** Which of the company's legal firms this order is raised under — copied onto the GrnReceipt when the goods arrive. */
  @IsOptional()
  @IsUUID()
  firmId?: string;

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

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemDto)
  items?: CreatePurchaseOrderItemDto[];
}
