import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import { UserRole } from "../generated/prisma/client";
import { CreateVendorBillDto } from "./dto/create-vendor-bill.dto";
import { ListVendorBillsQueryDto } from "./dto/list-vendor-bills-query.dto";
import { VendorBillsService } from "./vendor-bills.service";

// Financial module — vendor billing/settlement ledger, ACCOUNTANT access
// only (same scoping as PaymentsController).
@Controller("vendor-bills")
@RequireRoles(UserRole.ACCOUNTANT)
export class VendorBillsController {
  constructor(private readonly vendorBillsService: VendorBillsService) {}

  @Post()
  create(@Body() dto: CreateVendorBillDto) {
    return this.vendorBillsService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListVendorBillsQueryDto) {
    return this.vendorBillsService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.vendorBillsService.findOne(id);
  }
}
