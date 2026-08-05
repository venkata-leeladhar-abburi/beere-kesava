import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { CreateFactoryLoomDto } from "./dto/create-factory-loom.dto";
import { ListFactoryLoomsQueryDto } from "./dto/list-factory-looms-query.dto";
import { UpdateFactoryLoomDto } from "./dto/update-factory-loom.dto";
import { FactoryLoomsService } from "./factory-looms.service";

// NOTE: RBAC guards intentionally not yet applied — see the same note in
// src/users/users.controller.ts.
@Controller("factory-looms")
export class FactoryLoomsController {
  constructor(private readonly factoryLoomsService: FactoryLoomsService) {}

  @Post()
  create(@Body() dto: CreateFactoryLoomDto) {
    return this.factoryLoomsService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListFactoryLoomsQueryDto) {
    return this.factoryLoomsService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.factoryLoomsService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateFactoryLoomDto) {
    return this.factoryLoomsService.update(id, dto);
  }
}
