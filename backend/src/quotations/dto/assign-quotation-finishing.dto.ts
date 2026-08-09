import { IsArray, IsString } from "class-validator";

export class AssignQuotationFinishingDto {
  @IsArray()
  @IsString({ each: true })
  sareeIds!: string[];

  @IsString()
  staffId!: string;

  @IsString()
  assignedById!: string;
}
