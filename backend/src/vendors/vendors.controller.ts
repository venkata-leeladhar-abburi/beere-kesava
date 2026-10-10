import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import { ListPartyQueryDto } from "../common/dto/list-party-query.dto";
import { UserRole } from "../generated/prisma/client";
import { CreateVendorDto } from "./dto/create-vendor.dto";
import { UpdateVendorDto } from "./dto/update-vendor.dto";
import { VendorsService } from "./vendors.service";

// Vendor master data / vendor payments — financial, ACCOUNTANT, ADMIN, SUPERADMIN access.
@Controller("vendors")
@RequireRoles(UserRole.ACCOUNTANT, UserRole.ADMIN, UserRole.SUPERADMIN)
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post()
  create(@Body() dto: CreateVendorDto) {
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
  update(@Param("id") id: string, @Body() dto: UpdateVendorDto) {
    return this.vendorsService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.vendorsService.remove(id);
  }
}
