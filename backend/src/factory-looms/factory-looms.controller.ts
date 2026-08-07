import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import { UserRole } from "../generated/prisma/client";
import { CreateFactoryLoomDto } from "./dto/create-factory-loom.dto";
import { ListFactoryLoomsQueryDto } from "./dto/list-factory-looms-query.dto";
import { UpdateFactoryLoomDto } from "./dto/update-factory-loom.dto";
import { FactoryLoomsService } from "./factory-looms.service";

// Production/operational module — WORKER access only.
@Controller("factory-looms")
@RequireRoles(UserRole.WORKER)
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
