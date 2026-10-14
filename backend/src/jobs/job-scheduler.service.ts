import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { OverduePaymentsService } from "../finance-jobs/overdue-payments.service";
import { OpsAlertsService } from "../ops-jobs/ops-alerts.service";
import { ReportSchedulerService } from "../reports/report-scheduler.service";
import { JobOutcome, JobRunner } from "./job-runner.service";
import { dueSlot, JOB_ORDER, JobName } from "./job-schedule";
import { WatchdogReport, WatchdogService } from "./watchdog.service";

export interface TickResult {
  /** False when a job failed this tick or the watchdog found a problem. */
  ok: boolean;
  outcomes: JobOutcome[];
}

/**
 * Runs whatever is due. Called by the server's own 15-minute timer and by
 * POST /jobs/tick from GitHub Actions; JobRunner makes sure the two never run
 * the same slot twice. See job-schedule.ts for why both exist.
 */
@Injectable()
export class JobScheduler {
  private readonly logger = new Logger(JobScheduler.name);
  private readonly handlers: Record<JobName, () => Promise<unknown>>;

  constructor(
    private readonly runner: JobRunner,
    overdue: OverduePaymentsService,
    ops: OpsAlertsService,
    reports: ReportSchedulerService,
    watchdog: WatchdogService,
  ) {
    this.handlers = {
      "overdue-payments": () => overdue.runScan(),
      "ops-alerts": () => ops.runScan(),
      "scheduled-reports": () => reports.checkDueSchedules(),
      watchdog: () => watchdog.run(),
    };
  }

  @Cron("0 */15 * * * *")
  async timerTick(): Promise<void> {
    try {
      await this.tick("timer");
    } catch (err) {
      this.logger.error(`Timer tick failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async tick(trigger: string, now = new Date()): Promise<TickResult> {
    const outcomes: JobOutcome[] = [];
    for (const job of JOB_ORDER) {
      const slot = dueSlot(job, now);
      if (!slot) continue;
      outcomes.push(await this.runner.run(job, slot, trigger, this.handlers[job]));
    }
    const watchdogFound = outcomes.some(
      (o) =>
        o.job === "watchdog" &&
        o.outcome === "succeeded" &&
        (o.summary as WatchdogReport).problems.length > 0,
    );
    return { ok: !watchdogFound && !outcomes.some((o) => o.outcome === "failed"), outcomes };
  }
}
