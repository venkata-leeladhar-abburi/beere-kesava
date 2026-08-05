import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { ListInvoicesQueryDto } from "./dto/list-invoices-query.dto";
import { InvoicesService } from "./invoices.service";

// NOTE: RBAC guards intentionally not yet applied — see the same note in
// src/users/users.controller.ts.
@Controller("invoices")
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
