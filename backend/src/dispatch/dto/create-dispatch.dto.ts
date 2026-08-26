import { Type } from "class-transformer";
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
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
