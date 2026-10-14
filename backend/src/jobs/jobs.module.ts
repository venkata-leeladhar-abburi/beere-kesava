import { Module } from "@nestjs/common";
import { FinanceJobsModule } from "../finance-jobs/finance-jobs.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { OpsJobsModule } from "../ops-jobs/ops-jobs.module";
import { ReportsModule } from "../reports/reports.module";
import { JobRunner } from "./job-runner.service";
import { JobScheduler } from "./job-scheduler.service";
import { JobsController } from "./jobs.controller";
import { WatchdogService } from "./watchdog.service";

@Module({
  imports: [FinanceJobsModule, OpsJobsModule, ReportsModule, NotificationsModule],
  controllers: [JobsController],
  providers: [JobRunner, JobScheduler, WatchdogService],
})
export class JobsModule {}
