import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString, IsUUID, Min } from "class-validator";

export class CreatePaymentDto {
  @IsOptional()
  @IsUUID()
  actorId?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  utr?: string;

  @IsOptional()
  @IsString()
  method?: string;

  @IsOptional()
  @IsString()
  firmId?: string;
}
