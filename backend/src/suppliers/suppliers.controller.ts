import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import { ListPartyQueryDto } from "../common/dto/list-party-query.dto";
import { UserRole } from "../generated/prisma/client";
import { CreateSupplierDto } from "./dto/create-supplier.dto";
import { UpdateSupplierDto } from "./dto/update-supplier.dto";
import { SuppliersService } from "./suppliers.service";

// Supplier master data (purchasing) — financial, ACCOUNTANT, ADMIN, SUPERADMIN access.
@Controller("suppliers")
@RequireRoles(UserRole.ACCOUNTANT, UserRole.ADMIN, UserRole.SUPERADMIN)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  create(@Body() dto: CreateSupplierDto) {
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
  update(@Param("id") id: string, @Body() dto: UpdateSupplierDto) {
    return this.suppliersService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.suppliersService.remove(id);
  }
}
