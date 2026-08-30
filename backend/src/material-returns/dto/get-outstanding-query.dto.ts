import { IsOptional, IsString, IsUUID } from "class-validator";

export class GetOutstandingQueryDto {
  @IsOptional()
  @IsUUID()
  weaverId?: string;

  @IsOptional()
  @IsUUID()
  factoryLoomId?: string;

  // Narrows the balance to one loom of the selected weaver. Stored as a
  // string on both MaterialIssueRecord and MaterialReturnRecord, so it is
  // matched as a string here rather than coerced to a number.
  @IsOptional()
  @IsString()
  loomNumber?: string;

  // Narrows further to a single batch. Batch ids are business ids
  // ("BATCH-014"), not uuids.
  @IsOptional()
  @IsString()
  batchId?: string;
}
