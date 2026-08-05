import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { CreatePurchaseRequestDto } from "./dto/create-purchase-request.dto";
import { DecidePurchaseRequestDto } from "./dto/decide-purchase-request.dto";
import { ListPurchaseRequestsQueryDto } from "./dto/list-purchase-requests-query.dto";
import { PurchaseRequestsService } from "./purchase-requests.service";

// NOTE: RBAC guards intentionally not yet applied — see the same note in
// src/users/users.controller.ts. decide should require
// "procurement.purchase_requests.decide" once auth exists.
@Controller("purchase-requests")
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
  decide(@Param("id") id: string, @Body() dto: DecidePurchaseRequestDto) {
    return this.purchaseRequestsService.decide(id, dto);
  }
}
