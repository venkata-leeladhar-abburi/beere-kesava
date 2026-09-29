import { Type } from "class-transformer";
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  ValidateNested,
} from "class-validator";

export class DebitNoteLineDto {
  /** A PurchaseSareeLine.id on the purchase. */
  @IsUUID()
  sareeLineId!: string;

  /** 1-based positions of the pieces picked for return within that line. */
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  pieceNos!: number[];
}

export class CreateSupplierDebitNoteDto {
  // No auth yet — the requesting user's id must be supplied explicitly until
  // JWT/OTP auth exists and req.user is available.
  @IsUUID()
  requestedById!: string;

  @IsString()
  purchaseId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DebitNoteLineDto)
  lines!: DebitNoteLineDto[];

  @IsOptional()
  @IsString()
  reason?: string;
}
