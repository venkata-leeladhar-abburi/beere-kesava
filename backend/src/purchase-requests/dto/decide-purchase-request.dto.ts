import { IsEnum, IsOptional, IsString, IsUUID } from "class-validator";
import { PurchaseRequestStatus } from "../../generated/prisma/client";

const DECISION_STATUSES = [PurchaseRequestStatus.APPROVED, PurchaseRequestStatus.REJECTED] as const;

export class DecidePurchaseRequestDto {
  // No auth yet — the deciding user's id must be supplied explicitly until
  // JWT/OTP auth exists and req.user is available.
  @IsUUID()
  decidedById!: string;

  @IsEnum(DECISION_STATUSES)
  decision!: (typeof DECISION_STATUSES)[number];

  @IsOptional()
  @IsString()
  decisionNote?: string;
}
