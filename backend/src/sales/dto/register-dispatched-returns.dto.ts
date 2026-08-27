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
 * One piece coming back off a wholesale dispatch we raised. Unlike the
 * untracked path, the saree already exists and we already know its type,
 * colour and weight — so only the things that are true of THIS return
 * (why it came back, and what it looked like when it did) are per-item.
 */
export class DispatchedReturnItemDto {
  /** Must be a saree on the dispatch named by the parent DTO. */
  @IsString()
  @Length(1, 100)
  sareeId!: string;

  @IsString()
  @Length(1, 150)
  reason!: string;

  /** Free text captured when `reason` is "Other" — the only record of why. */
  @IsOptional()
  @IsString()
  @Length(0, 500)
  reasonNote?: string;

  /** Server-relative path to a condition photo (POST /uploads/photo). */
  @IsOptional()
  @IsString()
  photoUrl?: string;

  /**
   * What to credit the buyer for this piece. Defaults to the dispatch's
   * per-saree price when omitted, which is the normal case — an override is
   * for a negotiated partial credit.
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  refundAmount?: number;
}

/**
 * A wholesale buyer sending back part of a consignment we dispatched to them.
 * One dispatch, many pieces, one write.
 */
export class RegisterDispatchedReturnsDto {
  @IsOptional()
  @IsUUID()
  actorId?: string;

  /** The WHOLESALE DispatchRecord the pieces went out on. */
  @IsUUID()
  dispatchId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => DispatchedReturnItemDto)
  items!: DispatchedReturnItemDto[];
}
