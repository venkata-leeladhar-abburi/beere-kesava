import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, Length, ValidateIf } from "class-validator";
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

  @IsOptional()
  @IsString()
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
