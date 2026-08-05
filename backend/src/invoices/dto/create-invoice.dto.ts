import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString, IsUUID, Min } from "class-validator";

export class CreateInvoiceDto {
  // No auth yet — the acting user's id is supplied explicitly for the action
  // feed until JWT/OTP auth exists and req.user is available.
  @IsOptional()
  @IsUUID()
  actorId?: string;

  @IsUUID()
  customerId!: string;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsUUID()
  dispatchId?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  total!: number;
}
