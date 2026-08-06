import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateIf } from "class-validator";
import { SalesChannel } from "../../generated/prisma/client";

export class CreateSaleDto {
  // No auth yet — the acting user's id is supplied explicitly for the action
  // feed until JWT/OTP auth exists and req.user is available.
  @IsOptional()
  @IsUUID()
  actorId?: string;

  @IsString()
  sareeId!: string;

  @IsEnum(SalesChannel)
  channel!: SalesChannel;

  @ValidateIf((o: CreateSaleDto) => o.channel === "WHOLESALE")
  @IsUUID()
  customerId?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount!: number;
}
