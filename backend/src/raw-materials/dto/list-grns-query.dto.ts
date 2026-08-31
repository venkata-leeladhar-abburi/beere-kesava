import { Type } from "class-transformer";
import { IsDate, IsInt, IsOptional, Max, Min } from "class-validator";

/**
 * Bounds for GET /materials/grn. Every field is optional and omitting all of
 * them preserves the original "return every receipt" behaviour, so existing
 * callers are unaffected — but each screen now has a way to ask only for what
 * it renders, which is what keeps this read from growing without limit.
 */
export class ListGrnsQueryDto {
  /** Newest N receipts. For screens showing "recent" activity. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;

  /** Inclusive lower bound on receipt date, for date-scoped reports. */
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  /** Inclusive upper bound on receipt date. */
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;
}
