import { Type } from "class-transformer";
import { ArrayUnique, IsArray, IsInt, IsOptional, IsPositive, IsString, IsUUID, ValidateNested } from "class-validator";

export class DebitNoteLineDecisionDto {
  /** A SupplierReturnRequest.id belonging to the debit note. */
  @IsString()
  requestId!: string;

  /** The pieces of that line accepted for return — a subset of its pieceNos. Empty rejects the line. */
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  approvedPieceNos!: number[];
}

export class DecideSupplierDebitNoteDto {
  // No auth yet — the deciding user's id must be supplied explicitly until
  // JWT/OTP auth exists and req.user is available.
  @IsUUID()
  decidedById!: string;

  /** One entry per line of the note. A line left out is rejected in full. */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DebitNoteLineDecisionDto)
  lines!: DebitNoteLineDecisionDto[];

  @IsOptional()
  @IsString()
  decisionNote?: string;
}
