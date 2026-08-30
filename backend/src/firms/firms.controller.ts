import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import { UserRole } from "../generated/prisma/client";
import { CreateFinancialEntryDto } from "./dto/create-financial-entry.dto";
import { CreateFirmDto } from "./dto/create-firm.dto";
import { LinkRetailSalesDto } from "./dto/link-retail-sales.dto";
import { ListFinancialEntriesQueryDto } from "./dto/list-financial-entries-query.dto";
import { ListFirmRetailSalesQueryDto } from "./dto/list-firm-retail-sales-query.dto";
import { ListUnlinkedRetailSalesQueryDto } from "./dto/list-unlinked-retail-sales-query.dto";
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


  // ── Retail sales ────────────────────────────────────────────────────────────
  // Declared before the ":id" routes below would ever be reached for these
  // paths; "retail-sales" as a bare segment is the firm-agnostic pool an
  // accountant picks from, so it must not be read as a firm id.
  /** The firm every new retail sale is booked to, or null when none is set. */
  @Get("retail-sales/active-firm")
  getRetailSalesFirm() {
    return this.firmsService.getRetailSalesFirm();
  }

  /** Stop booking new retail sales automatically. Existing links are kept. */
  @Delete("retail-sales/active-firm")
  @RequireRoles(UserRole.ACCOUNTANT, UserRole.SUPERADMIN)
  clearRetailSalesFirm() {
    return this.firmsService.clearRetailSalesFirm();
  }

  @Get("retail-sales/connectable")
  listConnectableRetailSales(@Query() query: ListUnlinkedRetailSalesQueryDto) {
    return this.firmsService.listConnectableRetailSales(query);
  }

  @Get(":id/retail-sales")
  listRetailSales(@Param("id") id: string, @Query() query: ListFirmRetailSalesQueryDto) {
    return this.firmsService.listRetailSales(id, query);
  }

  /** Filter values this firm's retail sales actually contain. */
  @Get(":id/retail-sales/options")
  getRetailSaleFilterOptions(@Param("id") id: string) {
    return this.firmsService.getRetailSaleFilterOptions(id);
  }

  /**
   * Make this firm the one new retail sales are booked to, and back-fill every
   * currently-unconnected retail sale to it.
   */
  @Post(":id/retail-sales/active-firm")
  @RequireRoles(UserRole.ACCOUNTANT, UserRole.SUPERADMIN)
  setRetailSalesFirm(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.firmsService.setRetailSalesFirm(id, user?.id);
  }

  @Post(":id/retail-sales")
  @RequireRoles(UserRole.ACCOUNTANT, UserRole.SUPERADMIN)
  linkRetailSales(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: LinkRetailSalesDto,
  ) {
    return this.firmsService.linkRetailSales(id, dto, user?.id);
  }

  @Delete(":id/retail-sales/:saleRef")
  @RequireRoles(UserRole.ACCOUNTANT, UserRole.SUPERADMIN)
  unlinkRetailSale(@Param("id") id: string, @Param("saleRef") saleRef: string) {
    return this.firmsService.unlinkRetailSale(id, saleRef);
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
