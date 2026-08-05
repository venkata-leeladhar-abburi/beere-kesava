import { Controller, Get } from "@nestjs/common";
import { ReportsService } from "./reports.service";

// NOTE: RBAC guards intentionally not yet applied — see the same note in
// src/users/users.controller.ts.
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
}
