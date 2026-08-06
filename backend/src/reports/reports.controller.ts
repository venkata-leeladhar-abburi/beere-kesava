import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import { UserRole } from "../generated/prisma/client";
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

  @Get("schedules")
  listSchedules() {
    return this.reportsService.listSchedules();
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
