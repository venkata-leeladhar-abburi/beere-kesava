import { Type } from "class-transformer";
import { IsIn, IsInt, IsISO8601, IsOptional, IsString, Max, Min } from "class-validator";

/**
 * Query shared by GET /payments/staff-ledger and GET /payments/staff-summary
 * — the money side of the Accountant Staff Directory.
 *
 * `recordedById` is a plain string rather than @IsUUID because the sentinel
 * "unattributed" selects the rows that predate per-user attribution
 * (recordedById/soldById are nullable, so historic payments carry no actor).
 *
 * The period lives here rather than in the client so a total is computed over
 * the whole period, not over whatever slice the row cap happened to return.
 */
export class StaffLedgerQueryDto {
  @IsOptional()
  @IsString()
  recordedById?: string;

  /** Restricts the result to one entry kind — see StaffLedgerKind. */
  @IsOptional()
  @IsIn(["WEAVER", "VENDOR", "SUPPLIER", "RETAIL_SALE"])
  kind?: "WEAVER" | "VENDOR" | "SUPPLIER" | "RETAIL_SALE";

  /** Inclusive start of the period, as an instant. */
  @IsOptional()
  @IsISO8601()
  from?: string;

  /** Inclusive end of the period — the caller sends end-of-day. */
  @IsOptional()
  @IsISO8601()
  to?: string;

  /**
   * Hard cap on rows returned by staff-ledger; the client paginates locally.
   * Ignored by staff-summary, whose totals are aggregated in the database and
   * are therefore never clipped.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5000)
  limit: number = 2000;
}
