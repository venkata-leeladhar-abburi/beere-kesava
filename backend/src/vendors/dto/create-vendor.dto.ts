import { IsOptional, IsString } from "class-validator";
import { CreatePartyDto } from "../../common/dto/create-party.dto";

/** Vendor create payload — the shared party fields plus the optional default firm. */
export class CreateVendorDto extends CreatePartyDto {
  /** Firm.id ("FIRM-NNN") pre-selected on this vendor's purchase orders. Omit to leave unset. */
  @IsOptional()
  @IsString()
  firmId?: string | null;
}
