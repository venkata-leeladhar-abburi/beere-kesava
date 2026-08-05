import { IsBoolean, IsOptional, IsString } from "class-validator";

export class UpdateLabelSettingsDto {
  @IsOptional()
  @IsString()
  labelSize?: string;

  @IsOptional()
  @IsBoolean()
  showBarcode?: boolean;

  @IsOptional()
  @IsBoolean()
  showCode?: boolean;

  @IsOptional()
  @IsBoolean()
  showWeaver?: boolean;

  @IsOptional()
  @IsBoolean()
  showDate?: boolean;

  @IsOptional()
  @IsBoolean()
  showBranding?: boolean;

  @IsOptional()
  @IsString()
  defaultPrinter?: string;

  @IsOptional()
  @IsString()
  connectionType?: string;

  @IsOptional()
  @IsBoolean()
  scanShowPhoto?: boolean;

  @IsOptional()
  @IsBoolean()
  scanShowCode?: boolean;

  @IsOptional()
  @IsBoolean()
  scanShowWeaver?: boolean;

  @IsOptional()
  @IsBoolean()
  scanShowFabric?: boolean;

  @IsOptional()
  @IsBoolean()
  scanShowColour?: boolean;

  @IsOptional()
  @IsBoolean()
  scanShowJari?: boolean;

  @IsOptional()
  @IsBoolean()
  scanShowDispatchDate?: boolean;

  @IsOptional()
  @IsBoolean()
  scanShowProductionStatus?: boolean;
}
