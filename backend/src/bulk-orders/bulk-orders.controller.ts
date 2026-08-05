import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { BulkOrdersService } from "./bulk-orders.service";
import { CreateBulkOrderDto } from "./dto/create-bulk-order.dto";
import { ListBulkOrdersQueryDto } from "./dto/list-bulk-orders-query.dto";
import { UpdateBulkOrderDto } from "./dto/update-bulk-order.dto";

// NOTE: RBAC guards intentionally not yet applied — see the same note in
// src/users/users.controller.ts.
@Controller("bulk-orders")
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
