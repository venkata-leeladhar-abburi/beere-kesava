import { IsNumber, IsOptional, IsString, IsUUID, Min } from "class-validator";

/** PATCH /batches/:id/rows/:serial/receive — worker receives the finished saree from the weaver/loom. */
export class ReceiveBatchRowDto {
  @IsOptional()
  @IsUUID()
  actorId?: string;

  @IsNumber()
  @Min(0)
  weight!: number;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;
}
