import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateIf } from "class-validator";
import { SalesChannel } from "../../generated/prisma/client";

export class CreateSaleDto {
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
