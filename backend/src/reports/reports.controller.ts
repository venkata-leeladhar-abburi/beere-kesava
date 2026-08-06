import { Body, Controller, Get, Post } from "@nestjs/common";
import { ReportsService, CreateScheduleDto, RecordDownloadDto } from "./reports.service";

@Controller("reports")
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

  @Get("history")
  listHistory() {
    return this.reportsService.listHistory();
  }

  @Post("history")
  recordDownload(@Body() dto: RecordDownloadDto) {
    return this.reportsService.recordDownload(dto);
  }
}
