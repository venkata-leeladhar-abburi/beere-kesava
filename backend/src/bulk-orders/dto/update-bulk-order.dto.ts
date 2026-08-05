import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator";
import { BulkOrderStatus, OrderPaymentStatus } from "../../generated/prisma/client";

export class UpdateBulkOrderDto {
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
