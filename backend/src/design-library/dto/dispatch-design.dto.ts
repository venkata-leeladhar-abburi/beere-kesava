import { IsOptional, IsString, IsUUID } from "class-validator";

/** Assigns a design to a weaver for production — POST /design-library/:code/dispatch */
export class DispatchDesignDto {
  @IsUUID()
  weaverId!: string;

  @IsOptional()
  @IsString()
  notesForWeaver?: string;
}
