import { Type } from "class-transformer";
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from "class-validator";
import { ShopReceiptItemStatus } from "../../generated/prisma/client";

export class ShopReceiptItemDto {
  @IsString()
  sareeId!: string;

  @IsEnum(ShopReceiptItemStatus)
  status!: ShopReceiptItemStatus;

  /** Why the piece is DAMAGED or MISSING. Required for those two by the
   *  service, not here — the message is clearer when it names the saree. */
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateShopReceiptDto {
  @IsUUID()
  dispatchId!: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ShopReceiptItemDto)
  items!: ShopReceiptItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}
