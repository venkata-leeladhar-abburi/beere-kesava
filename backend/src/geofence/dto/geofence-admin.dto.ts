import { Type } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from "class-validator";
import { GeofenceMode, UserRole } from "../../generated/prisma/client";

export class CreateGeofenceSiteDto {
  @IsString()
  @IsNotEmpty()
  label!: string;

  @Type(() => Number)
  @IsLatitude()
  latitude!: number;

  @Type(() => Number)
  @IsLongitude()
  longitude!: number;

  // Floors at 25m because anything tighter is inside consumer GPS error even
  // outdoors — a 10m fence would reject people standing on top of the pin.
  // Ceiling is 5km: past that it has stopped being a premises check.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(25)
  @Max(5000)
  radiusMeters?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(10)
  @Max(1000)
  maxAccuracyMeters?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  sourceNote?: string;
}

export class UpdateGeofenceSiteDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  label?: string;

  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(25)
  @Max(5000)
  radiusMeters?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(10)
  @Max(1000)
  maxAccuracyMeters?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  sourceNote?: string;
}

export class UpsertGeofencePolicyDto {
  @IsBoolean()
  enforced!: boolean;

  @IsEnum(GeofenceMode)
  mode!: GeofenceMode;
}

export class RoleParamDto {
  @IsEnum(UserRole)
  role!: UserRole;
}

export class CreateGeofenceExemptionDto {
  @IsUUID()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  reason!: string;

  /** Always required — see the GeofenceExemption model on why none are permanent. */
  @IsDateString()
  expiresAt!: string;
}
