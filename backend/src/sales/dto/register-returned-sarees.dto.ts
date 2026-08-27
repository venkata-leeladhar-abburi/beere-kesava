import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
  ValidateNested,
} from "class-validator";

/**
 * One piece on a multi-saree wholesale return. The vendor is named once on the
 * parent DTO — a single consignment comes back from a single source — while
 * everything physical about the piece is per-item, since a vendor rarely sends
 * back two identical sarees.
 */
export class RegisterReturnedSareeItemDto {
  /**
   * The tag id being attached to the piece — becomes Saree.id. Omit when the
   * piece has no physical tag (not in our records); the server generates one
   * from `sareeType`, which is then required.
   */
  @IsOptional()
  @IsString()
  @Length(1, 100)
  sareeId?: string;

  @IsString()
  @Length(1, 150)
  reason!: string;

  /** Free text captured when `reason` is "Other" — the only record of why. */
  @IsOptional()
  @IsString()
  @Length(0, 500)
  reasonNote?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  weightG!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  costPrice?: number;

  /** Matched against SareeTypeRate.code, else its human name. */
  @IsOptional()
  @IsString()
  sareeType?: string;

  @IsOptional()
  @IsString()
  color?: string;

  /** Server-relative path to a condition photo (POST /uploads/photo). */
  @IsOptional()
  @IsString()
  photoUrl?: string;
}

/** A whole wholesale return consignment: one source, many pieces, one write. */
export class RegisterReturnedSareesDto {
  @IsOptional()
  @IsUUID()
  actorId?: string;

  /** Who the consignment came back from — a wholesale customer's name. */
  @IsString()
  @Length(1, 150)
  sourceName!: string;

  /** The wholesale Customer this source resolves to, when picked from the list. */
  @IsOptional()
  @IsUUID()
  sourceCustomerId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => RegisterReturnedSareeItemDto)
  items!: RegisterReturnedSareeItemDto[];
}
