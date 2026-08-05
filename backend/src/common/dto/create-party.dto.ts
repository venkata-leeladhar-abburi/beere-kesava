import { IsInt, IsOptional, IsString, Length, Max, Min } from "class-validator";

/** Shared shape for Supplier and Vendor create payloads — identical fields in the schema. */
export class CreatePartyDto {
  @IsString()
  @Length(1, 150)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  initials?: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  gstCode?: string;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsString()
  terms?: string;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  accountNo?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;
}
