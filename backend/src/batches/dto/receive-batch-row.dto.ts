import { IsNumber, IsOptional, IsString, IsUUID, Min } from "class-validator";

/** PATCH /batches/:id/rows/:serial/receive — worker receives the finished saree from the weaver/loom. */
export class ReceiveBatchRowDto {
  @IsOptional()
  @IsUUID()
  actorId?: string;

  @IsNumber()
  @Min(0)
  weight!: number;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  // Saree type confirmed at receipt. The type assigned when the batch was
  // created is what the weaver was told to make; what actually comes back can
  // differ, and it is this value that QC prices the making charge off. Sent
  // only when Worker Staff changes it — omitted, the row keeps the type it
  // already had.
  @IsOptional()
  @IsString()
  sareeTypeCode?: string;

  // Actual material split entered at receipt — grams for warp/resham, reels
  // for jari. Optional: the receive screen always computes a value (auto or
  // manually edited), but older callers may omit it.
  @IsOptional()
  @IsNumber()
  @Min(0)
  warpG?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  reshamG?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  jariReels?: number;

  // Retail selling price for THIS specific saree, entered by Worker Staff at
  // receipt — overrides the saree type's shared SareeTypeRate.retailPrice
  // when the New Sale flow prices it later.
  @IsOptional()
  @IsNumber()
  @Min(0)
  sellingPrice?: number;
}
