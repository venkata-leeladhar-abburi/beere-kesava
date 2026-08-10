import { IsBoolean, IsOptional, IsString, IsUUID } from "class-validator";

// Backs ResumeDispatchModal's "Complete Details" flow — filling in
// transport/receipt info that was skipped at dispatch time — as well as any
// later edit to those same fields. Every field optional: only what's sent
// gets patched.
export class UpdateDispatchDto {
  // No auth yet — the acting user's id is supplied explicitly for the action
  // feed until JWT/OTP auth exists and req.user is available.
  @IsOptional()
  @IsUUID()
  actorId?: string;

  @IsOptional()
  @IsString()
  lrNumber?: string;

  @IsOptional()
  @IsString()
  transportCompany?: string;

  @IsOptional()
  @IsString()
  vehicleNumber?: string;

  @IsOptional()
  @IsString()
  driverName?: string;

  @IsOptional()
  @IsString()
  dispatchDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  expectedDelivery?: string;

  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @IsOptional()
  @IsBoolean()
  pendingTransport?: boolean;

  @IsOptional()
  @IsBoolean()
  pendingReceipt?: boolean;
}
