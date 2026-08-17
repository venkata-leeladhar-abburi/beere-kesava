import { Type } from "class-transformer";
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from "class-validator";

export class QuotationSareeInputDto {
  @IsString()
  sareeId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  price!: number;
}

export class CreateQuotationDto {
  @IsUUID()
  customerId!: string;

  @IsOptional()
  @IsString()
  bulkOrderRef?: string;

  @IsOptional()
  @IsBoolean()
  applyGst?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  gstPct?: number;

  @IsOptional()
  @IsString()
  firmId?: string;

  // No auth yet — the raising user's id must be supplied explicitly.
  @IsUUID()
  raisedById!: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => QuotationSareeInputDto)
  sarees!: QuotationSareeInputDto[];
}
