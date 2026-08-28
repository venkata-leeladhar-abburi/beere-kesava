import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron } from "@nestjs/schedule";
import { ReportFrequency, WhatsAppMessageKind } from "../generated/prisma/client";
import { StorageService } from "../common/storage/storage.service";
import { PrismaService } from "../prisma/prisma.service";
import { WhatsAppService } from "../whatsapp/whatsapp.service";
import { buildReportWorkbook, XLSX_MIME_TYPE } from "./report-workbook";
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
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly reportsService: ReportsService,
    private readonly storage: StorageService,
    private readonly whatsapp: WhatsAppService,
  ) {}

  /**
   * Scheduled reports go to the same owners' list as the sale-alert feed, so
   * ScheduledReport needs no recipient-phone column of its own — it has only
   * ever stored an email.
   */
  private get recipients(): string[] {
    const raw = this.config.get<string>("ADMIN_WHATSAPP_NUMBERS") ?? "";
    return [...new Set(raw.split(",").map((n) => n.trim()).filter(Boolean))];
  }

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

    // Delivered as .xlsx regardless of ScheduledReport.format: PDFs in this
    // app are rasterised in the browser (see exportPdf.ts) and a cron has no
    // browser to rasterise in. WhatsApp's DOCUMENT header accepts a workbook
    // just as happily, and a spreadsheet is the more useful artefact for the
    // tabular data these reports produce.
    const key = await this.deliver(schedule, reportData);

    await this.prisma.reportDownloadHistory.create({
      data: {
        reportName: schedule.reportName,
        fileType: "XLSX",
        // The storage key, never the resolved URL: a presigned link expires in
        // an hour and would rot in this table.
        downloadUrl: key,
        downloadedById: null,
        filtersUsed: { scheduledReportId: schedule.id, trigger: "scheduled" },
      },
    });

    await this.prisma.scheduledReport.update({
      where: { id: schedule.id },
      data: { lastRunAt: new Date() },
    });
  }

  /**
   * Builds the workbook, stores it, and pushes it to every number on the
   * owners' list through `bk_report_share_`. Returns the storage key, or null
   * if nothing could be delivered.
   *
   * Never throws: a failed delivery must still let lastRunAt advance. Leaving
   * the schedule "due" would have the 15-minute poll regenerate and re-send it
   * forever, which on a broken number means an unbounded spend rather than a
   * single logged failure. sendTemplate records each attempt in
   * WhatsAppMessage, so nothing is lost by moving on.
   */
  private async deliver(
    schedule: { id: string; reportName: string; frequency: ReportFrequency },
    reportData: unknown,
  ): Promise<string | null> {
    const recipients = this.recipients;
    if (recipients.length === 0) {
      this.logger.warn(
        `ADMIN_WHATSAPP_NUMBERS is unset — report "${schedule.reportName}" generated but not delivered`,
      );
      return null;
    }

    try {
      const now = new Date();
      const workbook = await buildReportWorkbook(schedule.reportName, reportData);
      const key = await this.storage.uploadBuffer(workbook, XLSX_MIME_TYPE, "documents");
      const url = await this.storage.resolveUrl(key.replace(/^\/uploads\//, ""));

      // The stored names read "Outstanding Payments Report", and the template
      // body already ends in "report" — sending it whole yields "your
      // Outstanding Payments Report report is attached".
      const label = titleCase(schedule.reportName).replace(/\s*Report$/i, "").trim() || "Summary";
      const filename = `${label.replace(/\s+/g, "-")}-${dateStamp(now)}.xlsx`;

      for (const destination of recipients) {
        await this.whatsapp.sendTemplate({
          campaignName: "bk_report_share_",
          destination,
          recipientName: "Admin",
          templateParams: [
            "Admin",
            label,
            formatPeriod(schedule.frequency, now),
            formatDateTime(now),
            // The enum is stored uppercase; the sentence around {{5}} reads
            // "an automated Weekly delivery", not "an automated WEEKLY one".
            titleCase(schedule.frequency),
          ],
          media: { url, filename },
          kind: WhatsAppMessageKind.REPORT,
          relatedType: "ScheduledReport",
          relatedId: schedule.id,
          // sentById is deliberately omitted — a cron has no acting user, and
          // the column is optional.
        });
      }

      return key;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Delivery failed for report "${schedule.reportName}": ${message}`);
      return null;
    }
  }
}

/** "outstanding-payments" / "WEEKLY" → "Outstanding Payments" / "Weekly" */
function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** "27 Aug 2026, 06:00 AM" */
function formatDateTime(date: Date): string {
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDay(date: Date): string {
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/** File-name-safe "2026-08-27". */
function dateStamp(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * The window the report covers, ending now — "21–27 Aug 2026" for a weekly
 * run. Derived from the frequency because ScheduledReport stores no explicit
 * period, only how often it fires.
 */
function formatPeriod(frequency: ReportFrequency, end: Date): string {
  if (frequency === ReportFrequency.DAILY) return formatDay(end);
  const start = new Date(end.getTime() - FREQUENCY_INTERVAL_MS[frequency]);
  // Same month and year on both ends — "21–27 Aug 2026" rather than the
  // redundant "21 Aug 2026–27 Aug 2026".
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${String(start.getDate()).padStart(2, "0")}–${formatDay(end)}`;
  }
  return `${formatDay(start)} – ${formatDay(end)}`;
}
