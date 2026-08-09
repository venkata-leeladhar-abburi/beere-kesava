import { IsOptional, IsUUID } from "class-validator";

// No auth yet — used on endpoints (delete) that otherwise have no body, so
// the acting user's id can still be supplied explicitly for the action feed
// until JWT/OTP auth exists and req.user is available.
export class ActorOnlyDto {
  @IsOptional()
  @IsUUID()
  actorId?: string;
}
