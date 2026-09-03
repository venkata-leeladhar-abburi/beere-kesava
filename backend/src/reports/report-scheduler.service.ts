import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron } from "@nestjs/schedule";
import { ReportFrequency, WhatsAppMessageKind } from "../generated/prisma/client";
import { StorageService } from "../common/storage/storage.service";
import { PrismaService } from "../prisma/prisma.service";
import { WhatsAppService } from "../whatsapp/whatsapp.service";
import { computeNextRunAt } from "./report-schedule-timing";
import { buildReportWorkbook, XLSX_MIME_TYPE } from "./report-workbook";
import { ReportsService } from "./reports.service";

/**
 * Maps a ScheduledReport.reportName to the ReportsService method(s) that
 * produce its underlying data. Keyed by the exact label the frontend's
 * ScheduledReportsSection.tsx REPORT_TYPES dropdown sends — reportName is
 * stored as that human label verbatim, not a slug.
 *
 * This used to be keyed by an unrelated slug vocabulary
 * ("outstanding-payments" / "production-summary" / "sales-summary") that
 * schedule.reportName never actually contained, so every lookup missed and
 * silently fell back to a hardcoded default (getOutstandingPayments) —
 * every scheduled report, regardless of the type picked at creation, was
 * generating the same outstanding-payments-and-bulk-orders content. That's
 * the "I scheduled Retail but got Bulk Order" report. Keying by the real
 * label fixes the lookup. Every REPORT_TYPES entry on the frontend must have
 * a matching key here — keep both in sync.
 */
const REPORT_NAME_HANDLERS: Record<string, (svc: ReportsService) => Promise<unknown>> = {
  "Overdue & Alerts Report": (svc) => svc.getOutstandingPayments(),
  "Saree Production Report": (svc) => svc.getProductionSummary(),
  "Retail Sales Report": (svc) => svc.getRetailSalesReport(),
  "Wholesale Sales Report": (svc) => svc.getWholesaleSalesReport(),
  "Raw Material Report": (svc) => svc.getRawMaterialReport(),
  "Weaver Payment Report": (svc) => svc.getWeaverPaymentReport(),
  "Customer Report": (svc) => svc.getCustomerReport(),
  "Profit & Loss Report": (svc) => svc.getProfitAndLossReport(),
};

/**
 * Polls active ScheduledReport rows every 15 minutes and generates the
 * report for any whose nextRunAt has passed. nextRunAt is a real wall-clock
 * slot (see report-schedule-timing.ts), so a "9 AM daily" report goes out in
 * the 09:00–09:15 poll every day rather than drifting later with each run.
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
   * Each schedule carries the number it was created for. The owners' list is
   * only a safety net for rows saved before recipientPhone existed — without
   * it those would generate a workbook and deliver it nowhere.
   */
  private resolveRecipients(recipientPhone: string | null): string[] {
    if (recipientPhone && recipientPhone.trim()) {
      return [recipientPhone.trim()];
    }
    const raw = this.config.get<string>("ADMIN_WHATSAPP_NUMBERS") ?? "";
    return [...new Set(raw.split(",").map((n) => n.trim()).filter(Boolean))];
  }

  @Cron("0 */15 * * * *")
  async checkDueSchedules(): Promise<void> {
    const schedules = await this.prisma.scheduledReport.findMany({
      where: { active: true },
    });

    const now = Date.now();
    // A null nextRunAt means the row predates the scheduled-time columns —
    // treat it as due once, and generateReport gives it a proper slot after.
    const due = schedules.filter(
      (schedule) => !schedule.nextRunAt || schedule.nextRunAt.getTime() <= now,
    );

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

    // No fallback to a default report on a miss: a schedule for a report
    // type with no real data source yet must not silently deliver a
    // different report's content instead — that's the exact bug this
    // lookup used to have (see REPORT_NAME_HANDLERS' comment). Skip and log
    // loudly; nextRunAt still advances below so this doesn't retry every
    // 15 minutes forever.
    const handler = REPORT_NAME_HANDLERS[schedule.reportName];
    if (!handler) {
      this.logger.warn(
        `ScheduledReport ${scheduleId} has reportName "${schedule.reportName}", which has no ` +
          `ReportsService handler yet — skipping this run without generating or delivering anything.`,
      );
      await this.advanceSchedule(schedule);
      return;
    }
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

    // Advances even when delivery failed: leaving the schedule due would have
    // the 15-minute poll regenerate and re-send it for the rest of the day.
    await this.advanceSchedule(schedule);
  }

  /** Moves a schedule's nextRunAt past now, whether or not this run actually
   *  generated and delivered a report — a due schedule that's never advanced
   *  gets re-picked-up by every 15-minute poll for the rest of the day. */
  private async advanceSchedule(schedule: {
    id: string;
    frequency: ReportFrequency;
    deliveryHour: number;
    deliveryMinute: number;
    createdAt: Date;
  }): Promise<void> {
    const completedAt = new Date();
    await this.prisma.scheduledReport.update({
      where: { id: schedule.id },
      data: {
        lastRunAt: completedAt,
        nextRunAt: computeNextRunAt(
          {
            frequency: schedule.frequency,
            deliveryHour: schedule.deliveryHour,
            deliveryMinute: schedule.deliveryMinute,
            anchor: schedule.createdAt,
          },
          completedAt,
        ),
      },
    });
  }

  /**
   * Builds the workbook, stores it, and pushes it to the schedule's own
   * WhatsApp number through `bk_report_share_`. Returns the storage key, or
   * null if nothing could be delivered.
   *
   * Never throws: a failed delivery must still let lastRunAt advance. Leaving
   * the schedule "due" would have the 15-minute poll regenerate and re-send it
   * forever, which on a broken number means an unbounded spend rather than a
   * single logged failure. sendTemplate records each attempt in
   * WhatsAppMessage, so nothing is lost by moving on.
   */
  private async deliver(
    schedule: {
      id: string;
      reportName: string;
      frequency: ReportFrequency;
      recipientPhone: string | null;
    },
    reportData: unknown,
  ): Promise<string | null> {
    const recipients = this.resolveRecipients(schedule.recipientPhone);
    if (recipients.length === 0) {
      this.logger.warn(
        `No recipient number on schedule ${schedule.id} and ADMIN_WHATSAPP_NUMBERS is unset — ` +
          `report "${schedule.reportName}" generated but not delivered`,
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

/**
 * Approximate span each frequency covers, used only to word the "period"
 * line in the WhatsApp message. The delivery clock itself comes from
 * report-schedule-timing.ts — nothing here decides when a report fires.
 */
const PERIOD_LOOKBACK_MS: Record<ReportFrequency, number> = {
  [ReportFrequency.DAILY]: 24 * 60 * 60 * 1000,
  [ReportFrequency.WEEKLY]: 7 * 24 * 60 * 60 * 1000,
  [ReportFrequency.MONTHLY]: 30 * 24 * 60 * 60 * 1000,
  [ReportFrequency.QUARTERLY]: 91 * 24 * 60 * 60 * 1000,
};

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
  const start = new Date(end.getTime() - PERIOD_LOOKBACK_MS[frequency]);
  // Same month and year on both ends — "21–27 Aug 2026" rather than the
  // redundant "21 Aug 2026–27 Aug 2026".
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${String(start.getDate()).padStart(2, "0")}–${formatDay(end)}`;
  }
  return `${formatDay(start)} – ${formatDay(end)}`;
}
