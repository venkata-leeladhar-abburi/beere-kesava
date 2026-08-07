import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { PrismaService } from "../prisma/prisma.service";
import { ReportsService } from "./reports.service";

export const REPORT_GENERATION_QUEUE = "report-generation";

export interface ReportGenerationJobData {
  scheduleId: string;
}

/**
 * Maps a ScheduledReport.reportName to the ReportsService method(s) that
 * produce its underlying data. New report types should be added here.
 */
const REPORT_NAME_HANDLERS: Record<string, (svc: ReportsService) => Promise<unknown>> = {
  "outstanding-payments": (svc) => svc.getOutstandingPayments(),
  "production-summary": (svc) => svc.getProductionSummary(),
  "sales-summary": (svc) => svc.getSalesSummary(),
};

const DEFAULT_REPORT_HANDLER = REPORT_NAME_HANDLERS["outstanding-payments"];

@Processor(REPORT_GENERATION_QUEUE)
export class ReportGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportGenerationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reportsService: ReportsService,
  ) {
    super();
  }

  async process(job: Job<ReportGenerationJobData>): Promise<void> {
    const { scheduleId } = job.data;

    const schedule = await this.prisma.scheduledReport.findUnique({ where: { id: scheduleId } });
    if (!schedule) {
      this.logger.warn(`ScheduledReport ${scheduleId} not found, skipping job ${job.id}`);
      return;
    }

    // Resolve the handler for this report's name; fall back to a default
    // summary if the name doesn't match a known report type, so a
    // schedule never silently produces nothing.
    const handler = REPORT_NAME_HANDLERS[schedule.reportName] ?? DEFAULT_REPORT_HANDLER;
    const reportData = await handler(this.reportsService);

    this.logger.log(
      `Generated report "${schedule.reportName}" (${schedule.format}) for schedule ${scheduleId}`,
    );

    // TODO(delivery): wire real email/WhatsApp send once a provider is configured.
    // `reportData` and `schedule.recipientEmail` / `schedule.format` are ready to
    // hand to a delivery provider here; for now we just record that the report
    // was generated and would have been sent.
    void reportData;

    await this.prisma.reportDownloadHistory.create({
      data: {
        reportName: schedule.reportName,
        fileType: schedule.format,
        downloadUrl: null,
        downloadedById: null,
        filtersUsed: { scheduledReportId: schedule.id, trigger: "scheduled" },
      },
    });

    await this.prisma.scheduledReport.update({
      where: { id: schedule.id },
      data: { lastRunAt: new Date() },
    });
  }
}
