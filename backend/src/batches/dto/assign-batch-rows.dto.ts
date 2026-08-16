import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsInt, IsOptional, IsUUID, Min, ValidateNested } from "class-validator";
import { AssignBatchRowDto } from "./assign-batch-row.dto";

/** One row's assignment within a bulk PATCH /batches/:id/rows request. */
export class AssignBatchRowsItemDto extends AssignBatchRowDto {
  @IsInt()
  @Min(1)
  serial!: number;
}

/**
 * PATCH /batches/:id/rows — assigns every row of a batch in a single request
 * (and a single DB transaction), instead of the caller making one
 * PATCH /batches/:id/rows/:serial request per row. Saving/finalizing a
 * 50-row batch previously meant 50 sequential round trips against the
 * pooled Supabase connection (see batches.service.ts assignRows for the
 * timing rationale) — this collapses that to one.
 */
export class AssignBatchRowsDto {
  @IsOptional()
  @IsUUID()
  actorId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AssignBatchRowsItemDto)
  rows!: AssignBatchRowsItemDto[];
}
