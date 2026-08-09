import { Body, Controller, Delete, ForbiddenException, Get, HttpCode, HttpStatus, Param, Post, Query } from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import { UserRole } from "../generated/prisma/client";
import { ActorOnlyDto } from "./dto/actor-only.dto";
import { CreatePurchaseOrderDto } from "./dto/create-purchase-order.dto";
import { ListPurchaseOrdersQueryDto } from "./dto/list-purchase-orders-query.dto";
import { ReceiveGrnDto } from "./dto/receive-grn.dto";
import { RejectPurchaseOrderDto } from "./dto/reject-purchase-order.dto";
import { PurchaseOrdersService } from "./purchase-orders.service";

// Procurement/financial module — ACCOUNTANT access for create/approve/
// reject; WORKER additionally needs read access (to pick an approved PO in
// the GRN receiving flow) and the GRN endpoint itself (they're the one
// physically receiving stock, not finance).
@Controller("purchase-orders")
@RequireRoles(UserRole.ACCOUNTANT)
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Post()
  @RequireRoles(UserRole.ACCOUNTANT, UserRole.ADMIN, UserRole.SUPERADMIN)
  create(@Body() dto: CreatePurchaseOrderDto) {
    return this.purchaseOrdersService.create(dto);
  }

  @Get()
  @RequireRoles(UserRole.WORKER, UserRole.ACCOUNTANT)
  findAll(@Query() query: ListPurchaseOrdersQueryDto) {
    return this.purchaseOrdersService.findAll(query);
  }

  @Get(":id")
  @RequireRoles(UserRole.WORKER, UserRole.ACCOUNTANT)
  findOne(@Param("id") id: string) {
    return this.purchaseOrdersService.findOne(id);
  }

  // Every other guard on this controller lets ADMIN/SUPERADMIN through
  // unconditionally (see PermissionsGuard) — PO approval is the one action
  // that must stay SUPERADMIN-only even for ADMIN, so it's checked here
  // manually rather than relying on @RequireRoles/@RequirePermissions.
  @Post(":id/approve")
  @HttpCode(HttpStatus.OK)
  approve(@Param("id") id: string, @Body() dto: ActorOnlyDto, @CurrentUser() user: AuthenticatedUser) {
    if (user.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException("Only Superadmin can approve purchase orders.");
    }
    return this.purchaseOrdersService.approve(id, dto);
  }

  @Post(":id/reject")
  @HttpCode(HttpStatus.OK)
  @RequirePermissions("procurement.po.reject")
  reject(@Param("id") id: string, @Body() dto: RejectPurchaseOrderDto) {
    return this.purchaseOrdersService.reject(id, dto);
  }

  // The physical receiving clerk who logs the GRN (WorkerGRN.tsx) is a
  // WORKER, not an ACCOUNTANT — this must stay reachable by whoever actually
  // receives the stock, not just finance.
  @Post(":id/grn")
  @HttpCode(HttpStatus.OK)
  @RequireRoles(UserRole.WORKER, UserRole.ACCOUNTANT)
  receiveGrn(@Param("id") id: string, @Body() dto: ReceiveGrnDto) {
    return this.purchaseOrdersService.receiveGrn(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id") id: string, @Query() dto: ActorOnlyDto) {
    return this.purchaseOrdersService.remove(id, dto);
  }
}
