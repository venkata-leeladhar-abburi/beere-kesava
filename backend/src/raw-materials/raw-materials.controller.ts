import { Body, Controller, Get, Post } from "@nestjs/common";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import { UserRole } from "../generated/prisma/client";
import { RawMaterialsService, CreateGrnDto } from "./raw-materials.service";

// Raw material stock/GRN — used by both production (WORKER, receiving
// material) and finance (ACCOUNTANT, reconciling purchases).
@Controller("materials")
@RequireRoles(UserRole.WORKER, UserRole.ACCOUNTANT)
export class RawMaterialsController {
  constructor(private readonly rawMaterialsService: RawMaterialsService) {}

  @Get("stock")
  listStock() {
    return this.rawMaterialsService.listStock();
  }

  @Get("grn")
  listGrns() {
    return this.rawMaterialsService.listGrns();
  }

  @Post("grn")
  createGrn(@Body() dto: CreateGrnDto) {
    return this.rawMaterialsService.createGrn(dto);
  }
}
