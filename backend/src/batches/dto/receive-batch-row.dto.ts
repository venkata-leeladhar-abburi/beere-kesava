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

  // Actual material split entered at receipt — grams for warp/resham, reels
  // for jari. Optional: the receive screen always computes a value (auto or
  // manually edited), but older callers may omit it.
  @IsOptional()
  @IsNumber()
  @Min(0)
  warpG?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  reshamG?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  jariReels?: number;
}
