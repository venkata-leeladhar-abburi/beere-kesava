import { IsNotEmpty, IsString } from "class-validator";
import { LocationDto } from "../../geofence/dto/location.dto";

export class VerifyOtpDto extends LocationDto {
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsString()
  @IsNotEmpty()
  code!: string;
}
