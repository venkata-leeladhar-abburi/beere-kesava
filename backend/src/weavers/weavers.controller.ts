import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { CreateWeaverDto } from "./dto/create-weaver.dto";
import { ListWeaversQueryDto } from "./dto/list-weavers-query.dto";
import { UpdateWeaverDto } from "./dto/update-weaver.dto";
import { WeaversService } from "./weavers.service";

// NOTE: RBAC guards intentionally not yet applied — see the same note in
// src/users/users.controller.ts. Add guards for the relevant permissions
// (procurement/production admin-level access) once auth exists.
@Controller("weavers")
export class WeaversController {
  constructor(private readonly weaversService: WeaversService) {}

  @Post()
  create(@Body() dto: CreateWeaverDto) {
    return this.weaversService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListWeaversQueryDto) {
    return this.weaversService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.weaversService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateWeaverDto) {
    return this.weaversService.update(id, dto);
  }
}
