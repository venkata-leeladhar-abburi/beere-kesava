import { Controller, Get, Query } from "@nestjs/common";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import { UserRole } from "../generated/prisma/client";
import { AnalyticsService } from "./analytics.service";

// Financial/business analytics — ACCOUNTANT access only.
@Controller("analytics")
@RequireRoles(UserRole.ACCOUNTANT)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("cash-flow")
  getCashFlow() {
    return this.analyticsService.getCashFlow();
  }

  @Get("cash-flow-monthly")
  getCashFlowMonthly(@Query("months") months?: string) {
    return this.analyticsService.getCashFlowMonthly(months ? Number(months) : undefined);
  }

  @Get("production-trends")
  getProductionTrends() {
    return this.analyticsService.getProductionTrends();
  }

  @Get("production-trend-monthly")
  getProductionTrendMonthly(@Query("months") months?: string) {
    return this.analyticsService.getProductionTrendMonthly(months ? Number(months) : undefined);
  }

  @Get("revenue-split")
  getRevenueSplit() {
    return this.analyticsService.getRevenueSplit();
  }

  @Get("top-weavers")
  getTopWeavers() {
    return this.analyticsService.getTopWeavers();
  }

  @Get("customers-new-vs-returning-monthly")
  getCustomersNewVsReturningMonthly(@Query("months") months?: string) {
    return this.analyticsService.getCustomersNewVsReturningMonthly(months ? Number(months) : undefined);
  }
}
