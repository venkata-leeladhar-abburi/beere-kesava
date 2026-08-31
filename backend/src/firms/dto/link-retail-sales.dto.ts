import { ArrayMaxSize, ArrayMinSize, IsArray, IsOptional, IsString, Length } from "class-validator";

/** Connect one or many retail sales to the firm named in the route. */
export class LinkRetailSalesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @IsString({ each: true })
  saleRefs!: string[];

  /** Why these sales are being booked to this firm. */
  @IsOptional()
  @IsString()
  @Length(0, 500)
  note?: string;
}
