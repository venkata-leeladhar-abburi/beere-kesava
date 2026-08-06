import { Controller, Get } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";

@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("cash-flow")
  getCashFlow() {
    return this.analyticsService.getCashFlow();
  }

  @Get("production-trends")
  getProductionTrends() {
    return this.analyticsService.getProductionTrends();
  }

  @Get("revenue-split")
  getRevenueSplit() {
    return this.analyticsService.getRevenueSplit();
  }

  @Get("top-weavers")
  getTopWeavers() {
    return this.analyticsService.getTopWeavers();
  }
}
