import { IsOptional, IsString } from "class-validator";
import { UpdatePartyDto } from "../../common/dto/update-party.dto";

/** Supplier update payload — the shared party fields plus the optional firm link. */
export class UpdateSupplierDto extends UpdatePartyDto {
  /** Firm.id to connect; null disconnects; omitted leaves the link unchanged. */
  @IsOptional()
  @IsString()
  firmId?: string | null;
}
