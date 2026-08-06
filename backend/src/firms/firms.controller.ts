import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import { UserRole } from "../generated/prisma/client";
import { CreateFinancialEntryDto } from "./dto/create-financial-entry.dto";
import { CreateFirmDto } from "./dto/create-firm.dto";
import { ListFinancialEntriesQueryDto } from "./dto/list-financial-entries-query.dto";
import { ListFirmsQueryDto } from "./dto/list-firms-query.dto";
import { UpdateFirmDto } from "./dto/update-firm.dto";
import { FirmsService } from "./firms.service";

// Firm ledgers — financial, ACCOUNTANT access only.
@Controller("firms")
@RequireRoles(UserRole.ACCOUNTANT)
export class FirmsController {
  constructor(private readonly firmsService: FirmsService) {}

  @Post()
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
  update(@Param("id") id: string, @Body() dto: UpdateFirmDto) {
    return this.firmsService.update(id, dto);
  }

  @Post(":id/entries")
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
