import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { FinanceJobsController } from "./finance-jobs.controller";
import { OverduePaymentsService } from "./overdue-payments.service";

@Module({
  imports: [NotificationsModule],
  controllers: [FinanceJobsController],
  providers: [OverduePaymentsService],
})
export class FinanceJobsModule {}
