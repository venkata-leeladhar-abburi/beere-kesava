import { IsDateString, IsOptional, IsString, IsUUID } from "class-validator";

// No auth yet — the acting user's id is supplied explicitly for the action
// feed until JWT/OTP auth exists and req.user is available.
export class ReceiveGrnDto {
  @IsOptional()
  @IsUUID()
  actorId?: string;

  // Real FK to GrnReceipt.id, when the receiving clerk has already logged the
  // material receipt via /materials/grn. Optional so the endpoint stays
  // backward-compatible with callers that only mark the PO received.
  @IsOptional()
  @IsString()
  grnReceiptId?: string;

  // Defaults to now() if omitted.
  @IsOptional()
  @IsDateString()
  actualReceivedDate?: string;
}
