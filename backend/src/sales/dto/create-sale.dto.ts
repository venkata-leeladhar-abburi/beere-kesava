import { Transform, Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Matches, Max, Min } from "class-validator";
import { SalesChannel } from "../../generated/prisma/client";

/** Highest GST slab a counter bill can carry (the 28% slab). */
export const GST_MAX_RATE = 28;

/** 2-digit state code, 10-char PAN, entity number, "Z", check character. */
export const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export class CreateSaleDto {
  // No auth yet — the acting user's id is supplied explicitly for the action
  // feed until JWT/OTP auth exists and req.user is available.
  @IsOptional()
  @IsUUID()
  actorId?: string;

  @IsString()
  sareeId!: string;

  @IsEnum(SalesChannel)
  channel!: SalesChannel;

  @IsUUID()
  customerId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  paymentRef?: string;

  // What the counter discounted from, and how ("10%") — carried into the
  // admin notification so it shows rate, discount and final amount. Not
  // stored on the sale itself.
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  originalPrice?: number;

  @IsOptional()
  @IsString()
  discountNote?: string;

  // Shared by every saree on one counter bill, so the admin feed gets one
  // notification for the bill instead of one per saree. Omitted by any
  // caller that sells a single piece.
  @IsOptional()
  @IsUUID()
  billId?: string;

  // GST on the counter bill, when the shop chose to charge it. `gstRate` is
  // the bill's rate in percent; `gstAmount` is this saree's share of the
  // bill's GST in rupees and is already INCLUDED in `amount`. Both or neither.
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(GST_MAX_RATE)
  gstRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  gstAmount?: number;

  // Buyer's GSTIN, printed on the bill when a registered customer asks for it.
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim().toUpperCase() || undefined : value,
  )
  @IsString()
  @Matches(GSTIN_PATTERN, { message: "customerGstin must be a valid 15-character GSTIN" })
  customerGstin?: string;
}
