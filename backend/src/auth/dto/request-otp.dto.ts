import { IsNotEmpty, IsString } from "class-validator";
import { LocationDto } from "../../geofence/dto/location.dto";

// Extends LocationDto so the geofence can refuse before an OTP is sent —
// there is no point spending a billable WhatsApp authentication conversation
// on someone who will be turned away at verify anyway. The check at verify is
// the authoritative one; this is a courtesy, and is bypassable on its own.
export class RequestOtpDto extends LocationDto {
  @IsString()
  @IsNotEmpty()
  phone!: string;
}
