import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import { UserRole } from "../generated/prisma/client";
import { BulkOrdersService } from "./bulk-orders.service";
import { CreateBulkOrderDto } from "./dto/create-bulk-order.dto";
import { ListBulkOrdersQueryDto } from "./dto/list-bulk-orders-query.dto";
import { UpdateBulkOrderDto } from "./dto/update-bulk-order.dto";

// Wholesale orders — taken by retail (SHOP) and fulfilled by production
// (WORKER, assigning rows against the order).
@Controller("bulk-orders")
@RequireRoles(UserRole.SHOP, UserRole.WORKER)
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
}
