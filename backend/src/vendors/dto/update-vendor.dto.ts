import { IsOptional, IsString } from "class-validator";
import { UpdatePartyDto } from "../../common/dto/update-party.dto";

/** Vendor update payload — the shared party fields plus the optional default firm. */
export class UpdateVendorDto extends UpdatePartyDto {
  /** Firm.id to set as the default; null clears it; omitted leaves it unchanged. */
  @IsOptional()
  @IsString()
  firmId?: string | null;
}
