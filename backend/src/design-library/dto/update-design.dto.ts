import { IsOptional, IsString, IsUUID, Length } from "class-validator";

export class UpdateDesignDto {
  @IsOptional()
  @IsString()
  @Length(1, 150)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 30)
  typeCode?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  typeName?: string;

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
