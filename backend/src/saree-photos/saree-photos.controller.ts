import { Body, Controller, Get, Param, Put } from "@nestjs/common";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import { UserRole } from "../generated/prisma/client";
import { SetSareePhotoDto } from "./dto/set-saree-photo.dto";
import { SareePhotosService } from "./saree-photos.service";

// Worker Staff photograph sarees from their portal; ADMIN/SUPERADMIN pass the
// role check anyway and use the same endpoints from the inventory table.
@Controller("saree-photos")
@RequireRoles(UserRole.WORKER)
export class SareePhotosController {
  constructor(private readonly sareePhotos: SareePhotosService) {}

  @Get(":sareeId")
  lookup(@Param("sareeId") sareeId: string) {
    return this.sareePhotos.lookup(sareeId);
  }

  @Put(":sareeId")
  setPhoto(
    @Param("sareeId") sareeId: string,
    @Body() dto: SetSareePhotoDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.sareePhotos.setPhoto(sareeId, dto.photoUrl, user?.id);
  }
}
