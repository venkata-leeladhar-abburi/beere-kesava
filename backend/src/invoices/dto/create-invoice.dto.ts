import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString, IsUUID, Min } from "class-validator";

export class CreateInvoiceDto {
  @IsUUID()
  customerId!: string;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  total!: number;
}
