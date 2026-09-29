import { IsOptional, IsString, IsUUID } from "class-validator";

export class CancelSupplierDebitNoteDto {
  // No auth yet on the other supplier-return endpoints — kept here for the
  // same stopgap. The controller prefers the authenticated user's id.
  @IsOptional()
  @IsUUID()
  cancelledById?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
