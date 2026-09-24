import { Type } from "class-transformer";
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
} from "class-validator";
import { DispatchType } from "../../generated/prisma/client";

export class CreateDispatchDto {
  // No auth yet — the acting user's id is supplied explicitly for the action
  // feed until JWT/OTP auth exists and req.user is available.
  @IsOptional()
  @IsUUID()
  actorId?: string;

  @IsEnum(DispatchType)
  type!: DispatchType;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  sareeIds!: string[];

  /** Date the goods physically left, as entered on the dispatch form. Left off
   *  the payload before, so every record was stamped with the server's clock. */
  @IsOptional()
  @IsString()
  dispatchDate?: string;

  @IsOptional()
  @IsString()
  lrNumber?: string;

  @IsOptional()
  @IsString()
  transportCompany?: string;

  @IsOptional()
  @IsString()
  vehicleNumber?: string;

  @IsOptional()
  @IsString()
  driverName?: string;

  @IsOptional()
  @IsBoolean()
  pendingTransport?: boolean;

  @IsOptional()
  @IsBoolean()
  pendingReceipt?: boolean;

  // Server-relative path returned by POST /uploads/receipt.
  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  expectedDelivery?: string;

  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @IsOptional()
  @IsString()
  bulkOrderRef?: string;

  @IsOptional()
  @IsString()
  quotationRef?: string;

  // Wholesale-only invoicing fields.
  @ValidateIf((o: CreateDispatchDto) => o.type === DispatchType.WHOLESALE)
  @IsUUID()
  customerId?: string;

  // Whether this dispatch raises a tax invoice. The invoice *number* itself is
  // never accepted from the client — DispatchService generates it via
  // IdGeneratorService (see Backend_Architecture_Design.pdf §6.1).
  @IsOptional()
  @IsBoolean()
  raiseInvoice?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  pricePerSaree?: number;

  // The exact sum of the per-saree prices typed on the invoice. pricePerSaree
  // is a whole-rupee average of those, so multiplying it back out is off by
  // up to half a rupee per saree whenever the prices differ; when this is
  // sent it is the subtotal, and pricePerSaree only describes it.
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  gstPct?: number;

  @IsOptional()
  @IsString()
  firmId?: string;

  @IsOptional()
  @IsString()
  paymentDueDate?: string;
}
