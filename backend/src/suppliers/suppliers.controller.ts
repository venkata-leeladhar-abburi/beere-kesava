import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { CreatePartyDto } from "../common/dto/create-party.dto";
import { ListPartyQueryDto } from "../common/dto/list-party-query.dto";
import { UpdatePartyDto } from "../common/dto/update-party.dto";
import { SuppliersService } from "./suppliers.service";

// NOTE: RBAC guards intentionally not yet applied — see the same note in
// src/users/users.controller.ts.
@Controller("suppliers")
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  create(@Body() dto: CreatePartyDto) {
    return this.suppliersService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListPartyQueryDto) {
    return this.suppliersService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.suppliersService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdatePartyDto) {
    return this.suppliersService.update(id, dto);
  }
}
