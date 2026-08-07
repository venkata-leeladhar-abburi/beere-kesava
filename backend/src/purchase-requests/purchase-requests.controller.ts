import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { AdminOnly, RequireRoles } from "../auth/decorators/require-roles.decorator";
import { UserRole } from "../generated/prisma/client";
import { CreatePurchaseRequestDto } from "./dto/create-purchase-request.dto";
import { DecidePurchaseRequestDto } from "./dto/decide-purchase-request.dto";
import { ListPurchaseRequestsQueryDto } from "./dto/list-purchase-requests-query.dto";
import { PurchaseRequestsService } from "./purchase-requests.service";

// Procurement/financial module — ACCOUNTANT access for create/list; decide
// (approve/reject) is an admin-level sign-off.
@Controller("purchase-requests")
@RequireRoles(UserRole.ACCOUNTANT)
export class PurchaseRequestsController {
  constructor(private readonly purchaseRequestsService: PurchaseRequestsService) {}

  @Post()
  create(@Body() dto: CreatePurchaseRequestDto) {
    return this.purchaseRequestsService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListPurchaseRequestsQueryDto) {
    return this.purchaseRequestsService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.purchaseRequestsService.findOne(id);
  }

  @Post(":id/decide")
  @AdminOnly()
  decide(@Param("id") id: string, @Body() dto: DecidePurchaseRequestDto) {
    return this.purchaseRequestsService.decide(id, dto);
  }
}
