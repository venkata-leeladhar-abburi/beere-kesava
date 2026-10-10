import { Transform } from "class-transformer";
import { IsOptional, IsString, IsUUID } from "class-validator";
import { normalizeOptionalMobile } from "../../common/phone.util";

export class UpdateCustomerDto {
  // No auth yet — the acting user's id is supplied explicitly for the action
  // feed until JWT/OTP auth exists and req.user is available.
  @IsOptional()
  @IsUUID()
  actorId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsString()
  city?: string;

  // Normalised like create, but not length-checked: an edit form resends the
  // phone already on file, and a customer saved before create enforced 10
  // digits must still be editable. Blanking the field clears the number
  // (null), where create treats blank as simply not given.
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" && value.trim() === "" ? null : normalizeOptionalMobile({ value })))
  @IsString()
  phone?: string | null;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  gstCode?: string;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @IsString()
  ifscCode?: string;

  @IsOptional()
  @IsString()
  visitingCardUrl?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  /** Firm.id ("FIRM-NNN") pre-selected on this wholesale customer's invoices.
   *  Only a default — each dispatch invoice carries its own firm. */
  @IsOptional()
  @IsString()
  firmId?: string | null;
}
