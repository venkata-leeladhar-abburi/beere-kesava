import { IsOptional, IsString } from "class-validator";
import { CreatePartyDto } from "../../common/dto/create-party.dto";

/** Supplier create payload — the shared party fields plus the optional firm link
 *  (vendors share CreatePartyDto but have no firm, so it lives here). */
export class CreateSupplierDto extends CreatePartyDto {
  /** Firm.id ("FIRM-NNN") this supplier is connected to. Omit to leave unlinked. */
  @IsOptional()
  @IsString()
  firmId?: string | null;
}
