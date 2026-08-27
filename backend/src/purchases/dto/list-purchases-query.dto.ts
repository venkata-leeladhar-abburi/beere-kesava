import { Type } from "class-transformer";
import { IsEnum, IsIn, IsInt, IsOptional, IsUUID, Max, Min } from "class-validator";
import { PurchasePaymentStatus } from "../../generated/prisma/client";

export class ListPurchasesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20;

  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @IsEnum(PurchasePaymentStatus)
  status?: PurchasePaymentStatus;

  /**
   * "full" (default, unchanged behaviour) includes every sareeLine —
   * PurchaseSareeLine.imageUrl/pieceImageUrls are stored as raw base64 data
   * URLs (never uploaded to R2 — see the schema comment), so a full page of
   * purchases can be tens of MB and stall past the frontend's request
   * timeout. Callers that only need the purchase-level totals (e.g. the
   * Reports page's External Purchases table) should pass "summary" to skip
   * sareeLines and the supplier's saree photos entirely.
   */
  @IsOptional()
  @IsIn(["full", "summary"])
  view?: "full" | "summary" = "full";
}
