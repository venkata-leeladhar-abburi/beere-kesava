import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from "@nestjs/common";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import { UserRole } from "../generated/prisma/client";
import { CreatePurchaseDto } from "./dto/create-purchase.dto";
import { ListPurchasesQueryDto } from "./dto/list-purchases-query.dto";
import { UpdatePurchaseDto } from "./dto/update-purchase.dto";
import { PurchasesService } from "./purchases.service";

// Covers external supplier purchases of finished sarees for resale (the
// `Purchase` model — distinct from `PurchaseOrder`/raw-material procurement),
// including the rich per-saree line detail (weight/type/color/price/markup/
// photo) captured on the External Purchases form and stored as
// PurchaseSareeLine rows. Generating real production Saree rows for each
// piece purchased remains a separate, deliberately out-of-scope concern.
//
// Financial module (resale purchases) — ACCOUNTANT access only (ADMIN/
// SUPERADMIN bypass every role check, and the External Purchases page they
// use lives on the Materials/Inventory side of the app).
@Controller("purchases")
@RequireRoles(UserRole.ACCOUNTANT)
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  create(@Body() dto: CreatePurchaseDto) {
    return this.purchasesService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListPurchasesQueryDto) {
    return this.purchasesService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.purchasesService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdatePurchaseDto) {
    return this.purchasesService.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id") id: string) {
    return this.purchasesService.remove(id);
  }
}
