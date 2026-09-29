import { Transform } from "class-transformer";
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, Length, Matches, ValidateIf } from "class-validator";
import { normalizeOptionalMobile } from "../../common/phone.util";
import { CustomerType } from "../../generated/prisma/client";

export class CreateCustomerDto {
  // No auth yet — the acting user's id is supplied explicitly for the action
  // feed until JWT/OTP auth exists and req.user is available.
  @IsOptional()
  @IsUUID()
  actorId?: string;

  @IsString()
  @Length(1, 150)
  name!: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsEnum(CustomerType)
  type?: CustomerType;

  @IsOptional()
  @IsString()
  city?: string;

  // Optional — a counter walk-in may not leave a number, and the sale is
  // still billed and recorded. One that is given must be a full Indian
  // mobile, since the retail bill is sent to it on WhatsApp.
  @IsOptional()
  @Transform(normalizeOptionalMobile)
  @IsString()
  @Matches(/^\d{10}$/, { message: "phone must be a 10-digit mobile number" })
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  // Wholesale trades as a business and needs settlement details on file;
  // retail customers are walk-in individuals, so GST and bank details stay optional.
  @ValidateIf((o: CreateCustomerDto) => o.type === CustomerType.WHOLESALE)
  @IsString()
  @IsNotEmpty()
  gstCode?: string;

  @ValidateIf((o: CreateCustomerDto) => o.type === CustomerType.WHOLESALE)
  @IsString()
  @IsNotEmpty()
  bankName?: string;

  @ValidateIf((o: CreateCustomerDto) => o.type === CustomerType.WHOLESALE)
  @IsString()
  @IsNotEmpty()
  accountNumber?: string;

  @ValidateIf((o: CreateCustomerDto) => o.type === CustomerType.WHOLESALE)
  @IsString()
  @IsNotEmpty()
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
}
