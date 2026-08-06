import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from "@nestjs/common";
import { AdminOnly, RequireRoles } from "../auth/decorators/require-roles.decorator";
import { UserRole } from "../generated/prisma/client";
import { ActorOnlyDto } from "./dto/actor-only.dto";
import { CreatePurchaseOrderDto } from "./dto/create-purchase-order.dto";
import { ListPurchaseOrdersQueryDto } from "./dto/list-purchase-orders-query.dto";
import { ReceiveGrnDto } from "./dto/receive-grn.dto";
import { RejectPurchaseOrderDto } from "./dto/reject-purchase-order.dto";
import { PurchaseOrdersService } from "./purchase-orders.service";

// Procurement/financial module — ACCOUNTANT access for create/list/GRN;
// approve/reject is an admin-level sign-off.
@Controller("purchase-orders")
@RequireRoles(UserRole.ACCOUNTANT)
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
  @AdminOnly()
  approve(@Param("id") id: string, @Body() dto: ActorOnlyDto) {
    return this.purchaseOrdersService.approve(id, dto);
  }

  @Post(":id/reject")
  @HttpCode(HttpStatus.OK)
  @AdminOnly()
  reject(@Param("id") id: string, @Body() dto: RejectPurchaseOrderDto) {
    return this.purchaseOrdersService.reject(id, dto);
  }

  @Post(":id/grn")
  @HttpCode(HttpStatus.OK)
  receiveGrn(@Param("id") id: string, @Body() dto: ReceiveGrnDto) {
    return this.purchaseOrdersService.receiveGrn(id, dto);
  }
}
