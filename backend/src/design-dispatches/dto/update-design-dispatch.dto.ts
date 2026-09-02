import { IsString, IsOptional } from 'class-validator';

export class UpdateDesignDispatchDto {
  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsString()
  colorSlipImageUrl?: string;

  @IsOptional()
  @IsString()
  designGraphImageUrl?: string;
}
