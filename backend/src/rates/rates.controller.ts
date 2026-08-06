import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import { UserRole } from "../generated/prisma/client";
import { CreateRateDto } from "./dto/create-rate.dto";
import { ListRatesQueryDto } from "./dto/list-rates-query.dto";
import { UpdateRateDto } from "./dto/update-rate.dto";
import { RatesService } from "./rates.service";

// Rate card management — financial, ACCOUNTANT access only.
@Controller("rates")
@RequireRoles(UserRole.ACCOUNTANT)
export class RatesController {
  constructor(private readonly ratesService: RatesService) {}

  @Post()
  create(@Body() dto: CreateRateDto) {
    return this.ratesService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListRatesQueryDto) {
    return this.ratesService.findAll(query);
  }

  @Get(":code")
  findOne(@Param("code") code: string) {
    return this.ratesService.findOne(code);
  }

  @Patch(":code")
  update(@Param("code") code: string, @Body() dto: UpdateRateDto) {
    return this.ratesService.update(code, dto);
  }
}
