import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Queue } from "bullmq";
import { ReportFrequency } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { REPORT_GENERATION_QUEUE, ReportGenerationJobData } from "./report-generation.processor";

const FREQUENCY_INTERVAL_MS: Record<ReportFrequency, number> = {
  [ReportFrequency.DAILY]: 24 * 60 * 60 * 1000,
  [ReportFrequency.WEEKLY]: 7 * 24 * 60 * 60 * 1000,
  [ReportFrequency.MONTHLY]: 30 * 24 * 60 * 60 * 1000,
};

/**
 * Polls active ScheduledReport rows every 15 minutes and enqueues a
 * report-generation job for any that are due, based on their frequency
 * and lastRunAt. A schedule that has never run is always due.
 */
@Injectable()
export class ReportSchedulerService {
  private readonly logger = new Logger(ReportSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(REPORT_GENERATION_QUEUE) private readonly reportQueue: Queue<ReportGenerationJobData>,
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

    this.logger.log(`Enqueuing ${due.length} due scheduled report(s)`);

    for (const schedule of due) {
      await this.reportQueue.add(
        "generate-report",
        { scheduleId: schedule.id },
        { removeOnComplete: true, removeOnFail: 50 },
      );
    }
  }
}
