import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { CreateDispatchDto } from "./dto/create-dispatch.dto";
import { ListDispatchQueryDto } from "./dto/list-dispatch-query.dto";
import { DispatchService } from "./dispatch.service";

// NOTE: RBAC guards intentionally not yet applied — see the same note in
// src/users/users.controller.ts.
@Controller("dispatch")
export class DispatchController {
  constructor(private readonly dispatchService: DispatchService) {}

  @Post()
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
