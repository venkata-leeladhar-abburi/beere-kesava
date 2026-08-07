import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import { UserRole } from "../generated/prisma/client";
import { CreateDispatchDto } from "./dto/create-dispatch.dto";
import { ListDispatchQueryDto } from "./dto/list-dispatch-query.dto";
import { DispatchService } from "./dispatch.service";

// Dispatch is created by production (WORKER) but looked up by retail (SHOP)
// as well, so reads are shared and only the write is WORKER-restricted.
@Controller("dispatch")
@RequireRoles(UserRole.WORKER, UserRole.SHOP)
export class DispatchController {
  constructor(private readonly dispatchService: DispatchService) {}

  @Post()
  @RequireRoles(UserRole.WORKER)
  create(@Body() dto: CreateDispatchDto) {
    return this.dispatchService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListDispatchQueryDto) {
    return this.dispatchService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.dispatchService.findOne(id);
  }
}
