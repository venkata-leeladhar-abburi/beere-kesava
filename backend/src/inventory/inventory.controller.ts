import { Controller, Get } from "@nestjs/common";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import { UserRole } from "../generated/prisma/client";
import { InventoryService } from "./inventory.service";

// Finished-saree stock — needed by retail (SHOP) and production (WORKER,
// tracking what's ready to dispatch).
@Controller("inventory")
@RequireRoles(UserRole.SHOP, UserRole.WORKER)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  findAll() {
    return this.inventoryService.findAll();
  }
}
