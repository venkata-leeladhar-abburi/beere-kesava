import { IsOptional, IsString, IsUUID, Length } from "class-validator";

export class CreateDesignDto {
  @IsString()
  @Length(1, 30)
  code!: string;

  @IsString()
  @Length(1, 150)
  name!: string;

  @IsString()
  @Length(1, 30)
  typeCode!: string;

  @IsString()
  @Length(1, 100)
  typeName!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsUUID()
  weaverId?: string;

  @IsOptional()
  @IsString()
  notesForWeaver?: string;

  @IsOptional()
  @IsString()
  colorSlipPhotoUrl?: string;

  @IsOptional()
  @IsString()
  designGraphUrl?: string;
}
