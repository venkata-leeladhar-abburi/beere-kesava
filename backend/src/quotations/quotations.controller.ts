import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from "@nestjs/common";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import { UserRole } from "../generated/prisma/client";
import { CreateQuotationDto } from "./dto/create-quotation.dto";
import { ListQuotationsQueryDto } from "./dto/list-quotations-query.dto";
import { ReceiveQuotationSareesDto } from "./dto/receive-quotation-sarees.dto";
import { AssignQuotationFinishingDto } from "./dto/assign-quotation-finishing.dto";
import { QuotationsService } from "./quotations.service";

// Finishing-house workflow (assign to finishing, receive back) — WORKER access only.
// Admin can raise quotations from Inventory.
@Controller("quotations")
@RequireRoles(UserRole.WORKER, UserRole.ADMIN, UserRole.SUPERADMIN)
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
  assignFinishing(@Param("id") id: string, @Body() dto: AssignQuotationFinishingDto) {
    return this.quotationsService.assignFinishing(id, dto);
  }

  @Post(":id/receive")
  @HttpCode(HttpStatus.OK)
  receive(@Param("id") id: string, @Body() dto: ReceiveQuotationSareesDto) {
    return this.quotationsService.receive(id, dto);
  }

  @Post(":id/dispatch")
  @HttpCode(HttpStatus.OK)
  dispatch(@Param("id") id: string) {
    return this.quotationsService.dispatch(id);
  }
}
