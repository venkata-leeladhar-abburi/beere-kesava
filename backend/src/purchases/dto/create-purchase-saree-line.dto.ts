import { IsArray, IsDateString, IsInt, IsNumber, IsOptional, IsString, Min } from "class-validator";

/** One saree line inside a purchase — mirrors the frontend's SareeTag. */
export class CreatePurchaseSareeLineDto {
  // Human-facing line code (e.g. RAVI-INV118-003), computed client-side via
  // buildSareeCode and passed through as-is; falls back to a generated
  // placeholder server-side if omitted.
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  weight?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  sareeType?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sellPercent?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  finalAmount?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  // Optional per-physical-piece photo override, indexed by piece position
  // (pieceImageUrls[0] is piece 1 of `quantity`) — a piece with no entry (or
  // an empty string) here just falls back to the line's own `imageUrl`.
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pieceImageUrls?: string[];

  // How many of this line's pieces have already been returned to the
  // supplier. Sent back through the same full-replace update as every other
  // line field (see PurchasesService.update).
  @IsOptional()
  @IsInt()
  @Min(0)
  returnedQuantity?: number;
}
