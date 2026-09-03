import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import { ReportFrequency, UserRole } from "../generated/prisma/client";
import { ReportsService, CreateScheduleDto, UpdateScheduleDto, RecordDownloadDto } from "./reports.service";

// Financial/business reporting — ACCOUNTANT access only.
@Controller("reports")
@RequireRoles(UserRole.ACCOUNTANT)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("outstanding-payments")
  getOutstandingPayments() {
    return this.reportsService.getOutstandingPayments();
  }

  @Get("production-summary")
  getProductionSummary() {
    return this.reportsService.getProductionSummary();
  }

  @Get("sales-summary")
  getSalesSummary() {
    return this.reportsService.getSalesSummary();
  }

  @Get("retail-sales")
  getRetailSalesReport() {
    return this.reportsService.getRetailSalesReport();
  }

  @Get("wholesale-sales")
  getWholesaleSalesReport() {
    return this.reportsService.getWholesaleSalesReport();
  }

  // Powers the Overview dashboard's "In Stock"/"Payments Collected" figures —
  // paymentsCollectedPct here is computed across every invoice ever raised
  // (unlike getOutstandingPayments, which only covers invoices still owed),
  // so it's the one that actually answers "what fraction of everything
  // invoiced has been paid" rather than "of what's still owed, how much of
  // that has trickled in".
  @Get("production-analytics")
  getProductionAnalytics() {
    return this.reportsService.getProductionAnalytics();
  }

  @Get("raw-material")
  getRawMaterialReport() {
    return this.reportsService.getRawMaterialReport();
  }

  @Get("weaver-payments")
  getWeaverPaymentReport() {
    return this.reportsService.getWeaverPaymentReport();
  }

  @Get("customers")
  getCustomerReport() {
    return this.reportsService.getCustomerReport();
  }

  @Get("profit-loss")
  getProfitAndLossReport() {
    return this.reportsService.getProfitAndLossReport();
  }

  @Get("schedules")
  listSchedules() {
    return this.reportsService.listSchedules();
  }

  // Powers the "you'll receive it on…" preview in the Add Schedule form, so
  // the dates shown before saving are produced by the same code that will
  // later fire the delivery.
  @Get("schedules/preview")
  previewSchedule(
    @Query("frequency") frequency: ReportFrequency,
    @Query("deliveryTime") deliveryTime?: string,
    @Query("count") count?: string,
  ) {
    return this.reportsService.previewUpcomingRuns(
      frequency,
      deliveryTime,
      count ? Number(count) : undefined,
    );
  }

  @Post("schedules")
  createSchedule(@Body() dto: CreateScheduleDto) {
    return this.reportsService.createSchedule(dto);
  }

  @Patch("schedules/:id")
  updateSchedule(@Param("id") id: string, @Body() dto: UpdateScheduleDto) {
    return this.reportsService.updateSchedule(id, dto);
  }

  @Delete("schedules/:id")
  deleteSchedule(@Param("id") id: string, @Query("actorId") actorId?: string) {
    return this.reportsService.deleteSchedule(id, actorId);
  }

  @Get("history")
  listHistory(@Query("take") take?: string, @Query("skip") skip?: string) {
    return this.reportsService.listHistory(
      take ? Number(take) : undefined,
      skip ? Number(skip) : undefined,
    );
  }

  @Post("history")
  recordDownload(@Body() dto: RecordDownloadDto) {
    return this.reportsService.recordDownload(dto);
  }
}
