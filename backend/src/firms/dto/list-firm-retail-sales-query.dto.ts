import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

/**
 * Retail sales booked against one firm. Same paging contract as the other
 * firm list endpoints; `search` matches saree id, sale ref or customer name so
 * the firm's Retail Sales tab can filter without a second round trip.
 */
export class ListFirmRetailSalesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  pageSize: number = 200;

  @IsOptional()
  @IsString()
  search?: string;

  /** ISO date (inclusive) — sales on or after this day. */
  @IsOptional()
  @IsString()
  from?: string;

  /** ISO date (inclusive) — sales on or before this day. */
  @IsOptional()
  @IsString()
  to?: string;

  /** Exact SaleRecord.paymentMethod, e.g. "cash" | "upi" | "card". */
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  /** The Shop Staff / Accountant user who rang the sale up. */
  @IsOptional()
  @IsString()
  soldById?: string;

  /**
   * How the sale reached this firm: "auto" (the active-firm rule booked it) or
   * "manual" (someone picked it). "all" is the default.
   */
  @IsOptional()
  @IsIn(["all", "auto", "manual"])
  linkType?: "all" | "auto" | "manual";
}
