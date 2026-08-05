import { IsEnum, IsObject, IsOptional, IsString, IsUUID } from "class-validator";
import { NotificationTargetType, UserRole } from "../../generated/prisma/client";

export class CreateNotificationDto {
  @IsEnum(NotificationTargetType)
  targetType!: NotificationTargetType;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsString()
  type!: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
