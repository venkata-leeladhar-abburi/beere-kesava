import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';
import { RecipientType } from '../../generated/prisma/client';

export class CreateDesignDispatchDto {
  @IsEnum(RecipientType)
  recipientType!: RecipientType;

  @IsString()
  recipientId!: string;

  @IsString()
  recipientName!: string;

  @IsString()
  instructions!: string;

  @IsOptional()
  @IsString()
  colorSlipImageUrl?: string;

  @IsOptional()
  @IsString()
  designGraphImageUrl?: string;

  @IsArray()
  @IsString({ each: true })
  batches!: string[];
}
