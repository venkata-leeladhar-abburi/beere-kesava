import { ArrayNotEmpty, IsArray, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateFinishingAssignmentDto {
  // One or more sareeIds (BatchSareeRow.sareeId) to assign in one call —
  // matches the frontend's bulk "assign selected sarees" flow.
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  sareeIds!: string[];

  @IsUUID()
  finishingStaffId!: string;

  // No auth yet — the assigning user's id must be supplied explicitly.
  @IsUUID()
  assignedById!: string;

  @IsOptional()
  @IsString()
  quotationRef?: string;
}
