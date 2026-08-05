import { IsInt, IsOptional, IsString, Length, Max, Min } from "class-validator";

export class CreateFactoryLoomDto {
  // Real loom numbers in use are free-form (e.g. "Loom F-01"), not a fixed
  // pattern — just require a non-empty unique string.
  @IsString()
  @Length(1, 50)
  loomNumber!: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  operatorName?: string;

  @IsOptional()
  @IsString()
  operatorPhone?: string;

  @IsOptional()
  @IsInt()
  @Min(1990)
  @Max(2100)
  installedYear?: number;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  notes?: string;
}
