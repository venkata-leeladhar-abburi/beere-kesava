import { Injectable, Logger } from "@nestjs/common";
import { JobRunStatus, NotificationTargetType, Prisma, UserRole } from "../generated/prisma/client";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import type { JobName } from "./job-schedule";

/** A failed slot is retried on later ticks up to this many attempts in all. */
export const MAX_ATTEMPTS = 3;
/** A RUNNING row older than this is a run that died with the process. */
const STALE_RUNNING_MS = 30 * 60_000;

export type JobOutcome =
  | { job: JobName; slot: string; outcome: "skipped" }
  | { job: JobName; slot: string; outcome: "succeeded"; summary: unknown }
  | { job: JobName; slot: string; outcome: "failed"; error: string };

/**
 * Runs a job at most once per slot, however many triggers race for it, and
 * records the result in JobRun. A failure is recorded, raised to admins as a
 * notification, and retried on later ticks until MAX_ATTEMPTS.
 */
@Injectable()
export class JobRunner {
  private readonly logger = new Logger(JobRunner.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async run(
    job: JobName,
    slot: string,
    trigger: string,
    fn: () => Promise<unknown>,
  ): Promise<JobOutcome> {
    const run = await this.claim(job, slot, trigger);
    if (!run) return { job, slot, outcome: "skipped" };

    try {
      const summary = await fn();
      await this.prisma.jobRun.update({
        where: { id: run.id },
        data: {
          status: JobRunStatus.SUCCEEDED,
          finishedAt: new Date(),
          summary: (summary ?? null) as Prisma.InputJsonValue,
        },
      });
      this.logger.log(`${job} [${slot}] succeeded via ${trigger}`);
      return { job, slot, outcome: "succeeded", summary };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `${job} [${slot}] failed (attempt ${run.attempts}/${MAX_ATTEMPTS}): ${error}`,
      );
      await this.prisma.jobRun
        .update({
          where: { id: run.id },
          data: {
            status: JobRunStatus.FAILED,
            finishedAt: new Date(),
            error: error.slice(0, 2000),
          },
        })
        .catch(() => undefined);
      await this.notifications
        .create({
          targetType: NotificationTargetType.ROLE,
          role: UserRole.ADMIN,
          type: "SYSTEM_JOB_FAILED",
          payload: {
            job,
            slot,
            attempt: run.attempts,
            maxAttempts: MAX_ATTEMPTS,
            willRetry: run.attempts < MAX_ATTEMPTS,
            error: error.slice(0, 500),
          },
        })
        .catch(() => undefined);
      return { job, slot, outcome: "failed", error };
    }
  }

  /**
   * Inserting the (job, slot) row is the claim; the unique index makes it
   * atomic. When the row already exists, it is taken over only if that run
   * failed (and has attempts left) or has been RUNNING long enough to be dead.
   * Postgres re-checks the WHERE after waiting on the row lock, so two
   * concurrent takeovers cannot both win.
   */
  private async claim(
    job: JobName,
    slot: string,
    trigger: string,
  ): Promise<{ id: string; attempts: number } | null> {
    try {
      return await this.prisma.jobRun.create({
        data: { job, slot, trigger },
        select: { id: true, attempts: true },
      });
    } catch (err) {
      if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002")) throw err;
    }

    const { count } = await this.prisma.jobRun.updateMany({
      where: {
        job,
        slot,
        attempts: { lt: MAX_ATTEMPTS },
        OR: [
          { status: JobRunStatus.FAILED },
          {
            status: JobRunStatus.RUNNING,
            startedAt: { lt: new Date(Date.now() - STALE_RUNNING_MS) },
          },
        ],
      },
      data: {
        status: JobRunStatus.RUNNING,
        trigger,
        attempts: { increment: 1 },
        startedAt: new Date(),
        finishedAt: null,
        error: null,
      },
    });
    if (count === 0) return null;
    return this.prisma.jobRun.findUnique({
      where: { job_slot: { job, slot } },
      select: { id: true, attempts: true },
    });
  }
}
