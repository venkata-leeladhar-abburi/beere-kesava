import { Type } from "class-transformer";
import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, Min } from "class-validator";

export class CreateVendorBillDto {
  // No auth yet — the acting user's id is supplied explicitly for the action
  // feed until JWT/OTP auth exists and req.user is available.
  @IsOptional()
  @IsUUID()
  actorId?: string;

  @IsUUID()
  vendorId!: string;

  // Optional link to the purchase order this bill was generated from (e.g.
  // on GRN receipt). Absent for manually entered bills (rent, services, etc).
  @IsOptional()
  @IsUUID()
  poId?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
