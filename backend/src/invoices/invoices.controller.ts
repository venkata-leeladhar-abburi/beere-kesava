import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import { UserRole } from "../generated/prisma/client";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { ListInvoicesQueryDto } from "./dto/list-invoices-query.dto";
import { InvoicesService } from "./invoices.service";

// Financial module — ACCOUNTANT access only.
@Controller("invoices")
@RequireRoles(UserRole.ACCOUNTANT)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  create(@Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListInvoicesQueryDto) {
    return this.invoicesService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.invoicesService.findOne(id);
  }

  @Post(":id/payments")
  recordPayment(@Param("id") id: string, @Body() dto: CreatePaymentDto) {
    return this.invoicesService.recordPayment(id, dto);
  }
}
