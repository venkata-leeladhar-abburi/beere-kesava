import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { ReportGenerationProcessor, REPORT_GENERATION_QUEUE } from "./report-generation.processor";
import { ReportSchedulerService } from "./report-scheduler.service";
import { ReportsController } from "./reports.controller";
import { ReportsService } from "./reports.service";

@Module({
  imports: [BullModule.registerQueue({ name: REPORT_GENERATION_QUEUE }), AuditLogModule],
  controllers: [ReportsController],
  providers: [ReportsService, ReportGenerationProcessor, ReportSchedulerService],
})
export class ReportsModule {}
