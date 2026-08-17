import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { AdminOnly, RequireRoles } from "../auth/decorators/require-roles.decorator";
import { UserRole } from "../generated/prisma/client";
import { CreateSupplierReturnRequestDto } from "./dto/create-supplier-return-request.dto";
import { DecideSupplierReturnRequestDto } from "./dto/decide-supplier-return-request.dto";
import { ListSupplierReturnRequestsQueryDto } from "./dto/list-supplier-return-requests-query.dto";
import { SupplierReturnsService } from "./supplier-returns.service";

// Sending purchased sarees back to their supplier — same module split as
// purchases/purchase-requests: ACCOUNTANT raises and views, an admin decides.
@Controller("supplier-returns")
@RequireRoles(UserRole.ACCOUNTANT)
export class SupplierReturnsController {
  constructor(private readonly supplierReturnsService: SupplierReturnsService) {}

  @Post()
  create(@Body() dto: CreateSupplierReturnRequestDto) {
    return this.supplierReturnsService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListSupplierReturnRequestsQueryDto) {
    return this.supplierReturnsService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.supplierReturnsService.findOne(id);
  }

  @Post(":id/decide")
  @AdminOnly()
  decide(@Param("id") id: string, @Body() dto: DecideSupplierReturnRequestDto) {
    return this.supplierReturnsService.decide(id, dto);
  }
}
