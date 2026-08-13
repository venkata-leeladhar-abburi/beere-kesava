import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from "class-validator";
import { SignatureMethod } from "../../generated/prisma/client";
import { CreateMaterialIssueItemDto } from "./create-material-issue-item.dto";

export class CreateMaterialIssueDto {
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

  // When set, this issuance fulfils an approved WarpRequest — the service
  // validates it's APPROVED and belongs to the same weaver, then flips it
  // to ISSUED once the material issue record is created.
  @IsOptional()
  @IsString()
  warpRequestId?: string;

  // No auth yet — the issuing user's id must be supplied explicitly until
  // JWT/OTP auth exists and req.user is available.
  @IsUUID()
  issuedById!: string;

  @IsOptional()
  @IsEnum(SignatureMethod)
  signatureMethod?: SignatureMethod;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateMaterialIssueItemDto)
  items!: CreateMaterialIssueItemDto[];
}
