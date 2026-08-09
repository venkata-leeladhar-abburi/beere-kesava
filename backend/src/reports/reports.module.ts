import { Module } from "@nestjs/common";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { ReportSchedulerService } from "./report-scheduler.service";
import { ReportsController } from "./reports.controller";
import { ReportsService } from "./reports.service";

@Module({
  imports: [AuditLogModule],
  controllers: [ReportsController],
  providers: [ReportsService, ReportSchedulerService],
})
export class ReportsModule {}
