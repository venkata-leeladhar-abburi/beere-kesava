import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
} from "class-validator";
import { QcResult } from "../../generated/prisma/client";

export class CreateQcRecordDto {
  // sareeId identifies the BatchSareeRow being inspected — must already have
  // a generated sareeId (i.e. the row was assigned to a weaver/factory loom).
  @IsString()
  sareeId!: string;

  @IsEnum(QcResult)
  result!: QcResult;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  defects?: string[];

  // Only meaningful for a "semi" result — clamped server-side to
  // [0, makingCharge], matching the frontend's computeQcPayment exactly.
  //
  // IsNumber, not IsInt: a deduction is money, and the inspection screen's
  // own input accepts paise (step 0.01). Under IsInt a perfectly ordinary
  // amount like 100.50 was rejected with a 400 at the point of recording a
  // verdict. Matches UpdateQcDeductionDto, which revises the same value.
  @ValidateIf((o: CreateQcRecordDto) => o.result === QcResult.SEMI)
  @IsNumber()
  @Min(0)
  semiDeduction?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsInt()
  receivedDaysAgo?: number;

  // No auth yet — the inspecting user's id must be supplied explicitly.
  @IsUUID()
  inspectedById!: string;
}
