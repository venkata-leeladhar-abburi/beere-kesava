import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import { CreatePartyDto } from "../common/dto/create-party.dto";
import { ListPartyQueryDto } from "../common/dto/list-party-query.dto";
import { UpdatePartyDto } from "../common/dto/update-party.dto";
import { UserRole } from "../generated/prisma/client";
import { VendorsService } from "./vendors.service";

// Vendor master data / vendor payments — financial, ACCOUNTANT, ADMIN, SUPERADMIN access.
@Controller("vendors")
@RequireRoles(UserRole.ACCOUNTANT, UserRole.ADMIN, UserRole.SUPERADMIN)
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

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.vendorsService.remove(id);
  }
}
