import { Controller, Get, Query } from "@nestjs/common";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import { UserRole } from "../generated/prisma/client";
import { InventoryService } from "./inventory.service";

// Finished-saree stock — needed by retail (SHOP), production (WORKER), ACCOUNTANT, ADMIN, SUPERADMIN.
@Controller("inventory")
@RequireRoles(UserRole.SHOP, UserRole.WORKER, UserRole.ACCOUNTANT, UserRole.ADMIN, UserRole.SUPERADMIN)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  findAll() {
    return this.inventoryService.findAll();
  }

  /** Stock physically standing in the shop — everything delivered by a SHOP
   *  dispatch and not yet sold. Declared before no other :param route exists
   *  here, but kept explicit so a future one cannot shadow it. */
  @Get("shop")
  findShopStock(@Query("dispatchId") dispatchId?: string) {
    return this.inventoryService.findShopStock(dispatchId);
  }
}
