import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import { UserRole } from "../generated/prisma/client";
import { CreatePurchaseDto } from "./dto/create-purchase.dto";
import { ListPurchasesQueryDto } from "./dto/list-purchases-query.dto";
import { UpdatePurchaseDto } from "./dto/update-purchase.dto";
import { PurchasesService } from "./purchases.service";

// Covers external supplier purchases of finished sarees for resale (the
// `Purchase` model — distinct from `PurchaseOrder`/raw-material procurement).
// Only tracks the purchase record itself (supplier, count, invoice, amount);
// generating the individual Saree rows for each piece purchased is a
// separate, deliberately out-of-scope concern for now.
//
// Financial module (resale purchases) — ACCOUNTANT access only.
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
}
