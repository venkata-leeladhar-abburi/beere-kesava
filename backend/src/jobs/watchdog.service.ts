import { Injectable } from "@nestjs/common";
import {
  JobRunStatus,
  NotificationTargetType,
  UserRole,
  WhatsAppMessageStatus,
} from "../generated/prisma/client";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { MAX_ATTEMPTS } from "./job-runner.service";
import type { JobName } from "./job-schedule";

const DAY_MS = 24 * 60 * 60_000;
// A daily job that last succeeded longer ago than this missed a day. Two
// hours of slack over 24 covers a run that started late the day before.
const DAILY_JOB_MAX_AGE_MS = 26 * 60 * 60_000;
// A scheduled report this far past its slot was not delivered on time.
const REPORT_LATE_MS = 60 * 60_000;

const DAILY_JOBS: JobName[] = ["overdue-payments", "ops-alerts"];

export interface WatchdogReport {
  problems: string[];
  whatsappFailures: Record<string, number>;
  missedJobs: string[];
  exhaustedJobs: string[];
  lateReports: string[];
}

/**
 * Daily check for things that fail without anyone seeing: WhatsApp messages
 * the provider rejected, scheduled jobs that never ran or gave up, and
 * scheduled reports that were never delivered. Anything found becomes one
 * admin notification, and the tick endpoint reports `ok: false` so the
 * GitHub Actions run fails and GitHub emails the repository owner.
 */
@Injectable()
export class WatchdogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async run(now = new Date()): Promise<WatchdogReport> {
    const since = new Date(now.getTime() - DAY_MS);

    const failed = await this.prisma.whatsAppMessage.groupBy({
      by: ["kind"],
      where: { status: WhatsAppMessageStatus.FAILED, createdAt: { gte: since } },
      _count: { _all: true },
    });
    const whatsappFailures = Object.fromEntries(failed.map((f) => [f.kind, f._count._all]));
    const latestError = failed.length
      ? await this.prisma.whatsAppMessage.findFirst({
          where: { status: WhatsAppMessageStatus.FAILED, createdAt: { gte: since } },
          orderBy: { createdAt: "desc" },
          select: { errorMessage: true },
        })
      : null;

    const missedJobs: string[] = [];
    for (const job of DAILY_JOBS) {
      const last = await this.prisma.jobRun.findFirst({
        where: { job, status: JobRunStatus.SUCCEEDED },
        orderBy: { startedAt: "desc" },
        select: { startedAt: true },
      });
      if (!last || now.getTime() - last.startedAt.getTime() > DAILY_JOB_MAX_AGE_MS) {
        missedJobs.push(job);
      }
    }

    const exhausted = await this.prisma.jobRun.findMany({
      where: {
        status: JobRunStatus.FAILED,
        attempts: { gte: MAX_ATTEMPTS },
        startedAt: { gte: since },
      },
      select: { job: true, slot: true },
    });
    const exhaustedJobs = exhausted.map((r) => `${r.job} [${r.slot}]`);

    const late = await this.prisma.scheduledReport.findMany({
      where: { active: true, nextRunAt: { lt: new Date(now.getTime() - REPORT_LATE_MS) } },
      select: { reportName: true },
    });
    const lateReports = late.map((r) => r.reportName);

    const problems: string[] = [];
    const failedTotal = Object.values(whatsappFailures).reduce((a, b) => a + b, 0);
    if (failedTotal) {
      problems.push(
        `${failedTotal} WhatsApp message(s) failed in the last 24 hours` +
          (latestError?.errorMessage ? ` (latest: ${latestError.errorMessage.slice(0, 200)})` : ""),
      );
    }
    if (missedJobs.length) problems.push(`Did not run in the last day: ${missedJobs.join(", ")}`);
    if (exhaustedJobs.length)
      problems.push(`Gave up after ${MAX_ATTEMPTS} attempts: ${exhaustedJobs.join(", ")}`);
    if (lateReports.length)
      problems.push(`Scheduled report(s) not delivered on time: ${lateReports.join(", ")}`);

    if (problems.length) {
      await this.notifications.create({
        targetType: NotificationTargetType.ROLE,
        role: UserRole.ADMIN,
        type: "SYSTEM_HEALTH_ALERT",
        payload: { problems, whatsappFailures, missedJobs, exhaustedJobs, lateReports },
      });
    }

    return { problems, whatsappFailures, missedJobs, exhaustedJobs, lateReports };
  }
}
