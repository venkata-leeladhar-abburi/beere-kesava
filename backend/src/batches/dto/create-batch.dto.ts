import { IsDateString, IsInt, IsOptional, IsUUID, Min } from "class-validator";

export class CreateBatchDto {
  // No auth yet — the acting user's id is supplied explicitly for the action
  // feed until JWT/OTP auth exists and req.user is available.
  @IsOptional()
  @IsUUID()
  actorId?: string;

  @IsInt()
  @Min(1)
  totalCount!: number;

  @IsDateString()
  dueDate!: string;
}
