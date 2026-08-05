import { IsArray, IsDateString, IsInt, IsOptional, IsString, IsUUID, Min } from "class-validator";

export class CreateBulkOrderDto {
  @IsUUID()
  customerId!: string;

  @IsDateString()
  dueDate!: string;

  @IsOptional()
  @IsString()
  sareeTypeCode?: string;

  @IsOptional()
  @IsString()
  designCode?: string;

  @IsInt()
  @Min(1)
  total!: number;

  @IsInt()
  @Min(0)
  amountDue!: number;

  @IsOptional()
  @IsString()
  gstCode?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  visitingCardUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];
}
