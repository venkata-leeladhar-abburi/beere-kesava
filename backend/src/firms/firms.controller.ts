import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import { UserRole } from "../generated/prisma/client";
import { CreateFinancialEntryDto } from "./dto/create-financial-entry.dto";
import { CreateFirmDto } from "./dto/create-firm.dto";
import { ListFinancialEntriesQueryDto } from "./dto/list-financial-entries-query.dto";
import { ListFirmsQueryDto } from "./dto/list-firms-query.dto";
import { UpdateFirmDto } from "./dto/update-firm.dto";
import { FirmsService } from "./firms.service";

// Firm ledgers — financial, ACCOUNTANT access only for mutations.
@Controller("firms")
export class FirmsController {
  constructor(private readonly firmsService: FirmsService) {}

  @Post()
  @RequireRoles(UserRole.ACCOUNTANT, UserRole.SUPERADMIN)
  create(@Body() dto: CreateFirmDto) {
    return this.firmsService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListFirmsQueryDto) {
    return this.firmsService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.firmsService.findOne(id);
  }

  @Patch(":id")
  @RequireRoles(UserRole.ACCOUNTANT, UserRole.SUPERADMIN)
  update(@Param("id") id: string, @Body() dto: UpdateFirmDto) {
    return this.firmsService.update(id, dto);
  }

  @Post(":id/entries")
  @RequireRoles(UserRole.ACCOUNTANT, UserRole.SUPERADMIN)
  addEntry(@Param("id") id: string, @Body() dto: CreateFinancialEntryDto) {
    return this.firmsService.addEntry(id, dto);
  }

  @Get(":id/entries")
  listEntries(@Param("id") id: string, @Query() query: ListFinancialEntriesQueryDto) {
    return this.firmsService.listEntries(id, query);
  }

  @Get(":id/ledger-summary")
  getLedgerSummary(@Param("id") id: string) {
    return this.firmsService.getLedgerSummary(id);
  }
}
