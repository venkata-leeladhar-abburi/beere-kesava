import { Body, Controller, Get, Patch, Post, Query } from "@nestjs/common";
import { ListGrnsQueryDto } from "./dto/list-grns-query.dto";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import { UserRole } from "../generated/prisma/client";
import { RawMaterialsService, CreateGrnDto } from "./raw-materials.service";

// Raw material stock/GRN — used by production (WORKER), finance (ACCOUNTANT),
// and management (ADMIN, SUPERADMIN) for updating thresholds and stock.
@Controller("materials")
@RequireRoles(UserRole.WORKER, UserRole.ACCOUNTANT, UserRole.ADMIN, UserRole.SUPERADMIN)
export class RawMaterialsController {
  constructor(private readonly rawMaterialsService: RawMaterialsService) {}

  @Get("stock")
  listStock() {
    return this.rawMaterialsService.listStock();
  }

  @Get("grn")
  listGrns(@Query() query: ListGrnsQueryDto) {
    return this.rawMaterialsService.listGrns(query);
  }

  @Post("grn")
  createGrn(@Body() dto: CreateGrnDto) {
    return this.rawMaterialsService.createGrn(dto);
  }

  @Patch("reorder-levels")
  updateReorderLevels(
    @Body() body: { thresholds: { id: string; reorderLevel: number }[] }
  ) {
    return this.rawMaterialsService.updateReorderLevels(body.thresholds);
  }
}

