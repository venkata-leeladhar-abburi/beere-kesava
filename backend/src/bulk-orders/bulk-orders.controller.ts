import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from "@nestjs/common";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import { UserRole } from "../generated/prisma/client";
import { BulkOrdersService } from "./bulk-orders.service";
import { ActorOnlyDto } from "./dto/actor-only.dto";
import { CreateBulkOrderDto } from "./dto/create-bulk-order.dto";
import { ListBulkOrdersQueryDto } from "./dto/list-bulk-orders-query.dto";
import { UpdateBulkOrderDto } from "./dto/update-bulk-order.dto";

// Wholesale orders — taken by retail (SHOP), fulfilled by production
// (WORKER), and visible to ACCOUNTANT, ADMIN, SUPERADMIN.
@Controller("bulk-orders")
@RequireRoles(UserRole.SHOP, UserRole.WORKER, UserRole.ACCOUNTANT, UserRole.ADMIN, UserRole.SUPERADMIN)
export class BulkOrdersController {
  constructor(private readonly bulkOrdersService: BulkOrdersService) {}

  @Post()
  create(@Body() dto: CreateBulkOrderDto) {
    return this.bulkOrdersService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListBulkOrdersQueryDto) {
    return this.bulkOrdersService.findAll(query);
  }

  @Get(":ref")
  findOne(@Param("ref") ref: string) {
    return this.bulkOrdersService.findOne(ref);
  }

  @Patch(":ref")
  update(@Param("ref") ref: string, @Body() dto: UpdateBulkOrderDto) {
    return this.bulkOrdersService.update(ref, dto);
  }

  @Delete(":ref")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("ref") ref: string, @Query() dto: ActorOnlyDto) {
    return this.bulkOrdersService.remove(ref, dto);
  }
}
