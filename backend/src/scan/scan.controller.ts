import { Controller, Get, Param, Query } from "@nestjs/common";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import { UserRole } from "../generated/prisma/client";
import { ScanService } from "./scan.service";

// Same audience as the stock screens (inventory): everyone who handles sarees.
// Weavers are excluded — a scan returns QC, finishing and (for purchased
// pieces) cost details they have no need to see.
@Controller("scan")
@RequireRoles(UserRole.SHOP, UserRole.WORKER, UserRole.ACCOUNTANT, UserRole.ADMIN, UserRole.SUPERADMIN)
export class ScanController {
  constructor(private readonly scanService: ScanService) {}

  /**
   * The current code for a scanned/typed one — old codes from tags printed
   * before a supplier short name or invoice number change map to the new
   * ones. Screens that match a scan against sarees already on screen call
   * this first. Declared before ":sareeId" so "resolve" isn't read as an id.
   */
  @Get("resolve")
  async resolve(@Query("code") code = "") {
    return { code: await this.scanService.resolveCode(code) };
  }

  @Get(":sareeId")
  lookup(@Param("sareeId") sareeId: string) {
    return this.scanService.lookup(sareeId);
  }
}
