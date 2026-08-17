import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString, IsUUID, Length, Min } from "class-validator";

/**
 * A wholesale return that arrives with no barcode: the piece was never tracked,
 * so it is registered from the operator's description and given the tag id they
 * physically attach to it. Distinct from CreateReturnDto, which returns a saree
 * the system already sold.
 */
export class RegisterReturnedSareeDto {
  // No auth yet — the acting user's id is supplied explicitly for the action
  // feed until JWT/OTP auth exists and req.user is available.
  @IsOptional()
  @IsUUID()
  actorId?: string;

  /** The tag id being attached to the piece — becomes Saree.id. */
  @IsString()
  @Length(1, 100)
  sareeId!: string;

  /** Who the piece came back from. */
  @IsString()
  @Length(1, 150)
  sourceName!: string;

  @IsString()
  @Length(1, 150)
  reason!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  weightG!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  costPrice?: number;

  /** Must match an existing DesignLibrary code when supplied. */
  @IsOptional()
  @IsString()
  designCode?: string;

  /** Matched against SareeTypeRate.type (the human name) when supplied. */
  @IsOptional()
  @IsString()
  sareeType?: string;

  @IsOptional()
  @IsString()
  color?: string;
}
