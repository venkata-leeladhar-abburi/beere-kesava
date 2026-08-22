import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from "@nestjs/common";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import { UserRole } from "../generated/prisma/client";
import { CreateFinancialEntryDto } from "./dto/create-financial-entry.dto";
import { CreateFirmDto } from "./dto/create-firm.dto";
import { ListFinancialEntriesQueryDto } from "./dto/list-financial-entries-query.dto";
import { ListFirmsQueryDto } from "./dto/list-firms-query.dto";
import { UpdateFirmDto } from "./dto/update-firm.dto";
import { UpdateFinancialEntryDto } from "./dto/update-financial-entry.dto";
import { FirmActivityService } from "./firm-activity.service";
import { FirmsService } from "./firms.service";

// Firm ledgers — financial, ACCOUNTANT access only for mutations.
@Controller("firms")
export class FirmsController {
  constructor(
    private readonly firmsService: FirmsService,
    private readonly firmActivityService: FirmActivityService,
  ) {}

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

  @Delete(":id")
  @RequireRoles(UserRole.ACCOUNTANT, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id") id: string) {
    return this.firmsService.remove(id);
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

  @Patch(":id/entries/:entryId")
  @RequireRoles(UserRole.ACCOUNTANT, UserRole.SUPERADMIN)
  updateEntry(
    @Param("id") id: string,
    @Param("entryId") entryId: string,
    @Body() dto: UpdateFinancialEntryDto,
  ) {
    return this.firmsService.updateEntry(id, entryId, dto);
  }

  @Delete(":id/entries/:entryId")
  @RequireRoles(UserRole.ACCOUNTANT, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeEntry(@Param("id") id: string, @Param("entryId") entryId: string) {
    return this.firmsService.removeEntry(id, entryId);
  }

  @Get(":id/ledger-summary")
  getLedgerSummary(@Param("id") id: string) {
    return this.firmsService.getLedgerSummary(id);
  }

  // Every real document and payment that names this firm — the auto-tracked
  // half of the ledger, alongside the manually-entered half above.
  @Get(":id/activity")
  getActivity(@Param("id") id: string) {
    return this.firmActivityService.getActivity(id);
  }
}
