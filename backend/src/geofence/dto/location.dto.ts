import { Type } from "class-transformer";
import { IsLatitude, IsLongitude, IsNumber, IsOptional, Min } from "class-validator";

/**
 * The position a client attaches to a sign-in attempt.
 *
 * Every field is optional, and that is load-bearing rather than lax: a browser
 * that denied the permission prompt, timed out, or has no location hardware
 * sends nothing at all. Rejecting those at the validation layer would turn
 * "we could not read your location" into an opaque 400 instead of the
 * explained refusal GeofenceService produces — and would hard-break sign-in
 * for the roles that are not geofenced in the first place.
 *
 * Trust nothing here. These numbers come from the client and can be anything;
 * they are evidence for GeofenceService to weigh, never an assertion that the
 * caller is somewhere. The client never sends a "I am inside the fence" flag,
 * because that would be a boolean anyone could flip in devtools.
 */
export class LocationDto {
  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  longitude?: number;

  /** The fix's own error radius in metres, as `GeolocationCoordinates.accuracy`. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  accuracyMeters?: number;
}
