import { Transform } from "class-transformer";
import { IsString, MaxLength, MinLength } from "class-validator";

export class LookupReturnablePiecesQueryDto {
  /** A scanned or typed piece code, line code, invoice number, supplier, type or colour. */
  @Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  q!: string;
}
