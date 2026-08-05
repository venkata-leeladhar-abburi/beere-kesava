import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from "@nestjs/common";
import { CreateQuotationDto } from "./dto/create-quotation.dto";
import { ListQuotationsQueryDto } from "./dto/list-quotations-query.dto";
import { ReceiveQuotationSareesDto } from "./dto/receive-quotation-sarees.dto";
import { QuotationsService } from "./quotations.service";

// NOTE: RBAC guards intentionally not yet applied — see the same note in
// src/users/users.controller.ts.
@Controller("quotations")
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Post()
  create(@Body() dto: CreateQuotationDto) {
    return this.quotationsService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListQuotationsQueryDto) {
    return this.quotationsService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.quotationsService.findOne(id);
  }

  @Post(":id/assign-finishing")
  @HttpCode(HttpStatus.OK)
  assignFinishing(@Param("id") id: string) {
    return this.quotationsService.assignFinishing(id);
  }

  @Post(":id/receive")
  @HttpCode(HttpStatus.OK)
  receive(@Param("id") id: string, @Body() dto: ReceiveQuotationSareesDto) {
    return this.quotationsService.receive(id, dto);
  }
}
