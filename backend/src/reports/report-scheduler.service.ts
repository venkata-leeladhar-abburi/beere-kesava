import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { ReportFrequency } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ReportsService } from "./reports.service";

const FREQUENCY_INTERVAL_MS: Record<ReportFrequency, number> = {
  [ReportFrequency.DAILY]: 24 * 60 * 60 * 1000,
  [ReportFrequency.WEEKLY]: 7 * 24 * 60 * 60 * 1000,
  [ReportFrequency.MONTHLY]: 30 * 24 * 60 * 60 * 1000,
};

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

/**
 * Polls active ScheduledReport rows every 15 minutes and generates the
 * report for any that are due, based on their frequency and lastRunAt. A
 * schedule that has never run is always due.
 */
@Injectable()
export class ReportSchedulerService {
  private readonly logger = new Logger(ReportSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reportsService: ReportsService,
  ) {}

  @Cron("0 */15 * * * *")
  async checkDueSchedules(): Promise<void> {
    const schedules = await this.prisma.scheduledReport.findMany({
      where: { active: true },
    });

    const now = Date.now();
    const due = schedules.filter((schedule) => {
      if (!schedule.lastRunAt) {
        return true;
      }
      const intervalMs = FREQUENCY_INTERVAL_MS[schedule.frequency];
      return now - schedule.lastRunAt.getTime() >= intervalMs;
    });

    if (due.length === 0) {
      return;
    }

    this.logger.log(`Generating ${due.length} due scheduled report(s)`);

    for (const schedule of due) {
      await this.generateReport(schedule.id);
    }
  }

  private async generateReport(scheduleId: string): Promise<void> {
    const schedule = await this.prisma.scheduledReport.findUnique({ where: { id: scheduleId } });
    if (!schedule) {
      this.logger.warn(`ScheduledReport ${scheduleId} not found, skipping`);
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
