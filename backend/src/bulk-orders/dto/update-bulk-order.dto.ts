import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from "class-validator";
import { BulkOrderStatus, OrderPaymentStatus } from "../../generated/prisma/client";

export class UpdateBulkOrderDto {
  // No auth yet — the acting user's id is supplied explicitly for the action
  // feed until JWT/OTP auth exists and req.user is available.
  @IsOptional()
  @IsUUID()
  actorId?: string;

  @IsOptional()
  @IsEnum(BulkOrderStatus)
  status?: BulkOrderStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  done?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  shortage?: number;

  @IsOptional()
  @IsEnum(OrderPaymentStatus)
  paymentStatus?: OrderPaymentStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  amountPaid?: number;

  @IsOptional()
  @IsBoolean()
  tallied?: boolean;

  // No auth yet — explicit id of the tallying user.
  @IsOptional()
  @IsString()
  talliedBy?: string;
}
