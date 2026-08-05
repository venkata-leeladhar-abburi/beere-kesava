import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { CreatePartyDto } from "../common/dto/create-party.dto";
import { ListPartyQueryDto } from "../common/dto/list-party-query.dto";
import { UpdatePartyDto } from "../common/dto/update-party.dto";
import { VendorsService } from "./vendors.service";

// NOTE: RBAC guards intentionally not yet applied — see the same note in
// src/users/users.controller.ts.
@Controller("vendors")
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post()
  create(@Body() dto: CreatePartyDto) {
    return this.vendorsService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListPartyQueryDto) {
    return this.vendorsService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.vendorsService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdatePartyDto) {
    return this.vendorsService.update(id, dto);
  }
}
