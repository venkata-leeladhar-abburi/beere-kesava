import { ArrayNotEmpty, IsArray, IsString } from "class-validator";

export class ReceiveQuotationSareesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  sareeIds!: string[];
}
