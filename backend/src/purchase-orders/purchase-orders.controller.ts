import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from "@nestjs/common";
import { ActorOnlyDto } from "./dto/actor-only.dto";
import { CreatePurchaseOrderDto } from "./dto/create-purchase-order.dto";
import { ListPurchaseOrdersQueryDto } from "./dto/list-purchase-orders-query.dto";
import { RejectPurchaseOrderDto } from "./dto/reject-purchase-order.dto";
import { PurchaseOrdersService } from "./purchase-orders.service";

// NOTE: RBAC guards intentionally not yet applied — see the same note in
// src/users/users.controller.ts. approve/reject/grn should require
// "po.approve" once auth exists.
@Controller("purchase-orders")
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Post()
  create(@Body() dto: CreatePurchaseOrderDto) {
    return this.purchaseOrdersService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListPurchaseOrdersQueryDto) {
    return this.purchaseOrdersService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.purchaseOrdersService.findOne(id);
  }

  @Post(":id/approve")
  @HttpCode(HttpStatus.OK)
  approve(@Param("id") id: string, @Body() dto: ActorOnlyDto) {
    return this.purchaseOrdersService.approve(id, dto);
  }

  @Post(":id/reject")
  @HttpCode(HttpStatus.OK)
  reject(@Param("id") id: string, @Body() dto: RejectPurchaseOrderDto) {
    return this.purchaseOrdersService.reject(id, dto);
  }

  @Post(":id/grn")
  @HttpCode(HttpStatus.OK)
  receiveGrn(@Param("id") id: string, @Body() dto: ActorOnlyDto) {
    return this.purchaseOrdersService.receiveGrn(id, dto);
  }
}
