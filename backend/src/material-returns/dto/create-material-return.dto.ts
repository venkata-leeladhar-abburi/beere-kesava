import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from "class-validator";
import { SignatureMethod } from "../../generated/prisma/client";
import { CreateMaterialReturnItemDto } from "./create-material-return-item.dto";

export class CreateMaterialReturnDto {
  @IsOptional()
  @IsUUID()
  weaverId?: string;

  @IsOptional()
  @IsUUID()
  factoryLoomId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  loomNumber?: number;

  @IsOptional()
  @IsString()
  batchId?: string;

  // No auth yet — the receiving user's id must be supplied explicitly until
  // JWT/OTP auth exists and req.user is available (same stopgap as
  // CreateMaterialIssueDto.issuedById).
  @IsUUID()
  receivedById!: string;

  @IsOptional()
  @IsEnum(SignatureMethod)
  signatureMethod?: SignatureMethod;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  deductionAmount?: number;

  @IsOptional()
  @IsString()
  deductionReason?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateMaterialReturnItemDto)
  items!: CreateMaterialReturnItemDto[];
}
