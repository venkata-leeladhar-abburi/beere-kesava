import { IsInt, IsOptional, IsPositive, IsString, IsUUID } from "class-validator";

export class CreateSupplierReturnRequestDto {
  // No auth yet — the requesting user's id must be supplied explicitly until
  // JWT/OTP auth exists and req.user is available.
  @IsUUID()
  requestedById!: string;

  @IsString()
  purchaseId!: string;

  /** A PurchaseSareeLine.id — which line of the purchase these pieces belong to. */
  @IsUUID()
  sareeLineId!: string;

  @IsInt()
  @IsPositive()
  quantity!: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
