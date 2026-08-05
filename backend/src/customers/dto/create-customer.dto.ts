import { IsEnum, IsOptional, IsString, Length } from "class-validator";
import { CustomerType } from "../../generated/prisma/client";

export class CreateCustomerDto {
  @IsString()
  @Length(1, 150)
  name!: string;

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

  @IsOptional()
  @IsString()
  gstCode?: string;

  @IsOptional()
  @IsString()
  visitingCardUrl?: string;
}
