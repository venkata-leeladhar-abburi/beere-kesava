import { Module } from "@nestjs/common";
import { InventoryModule } from "../inventory/inventory.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { OpsAlertsService } from "./ops-alerts.service";
import { OpsJobsController } from "./ops-jobs.controller";

@Module({
  imports: [NotificationsModule, InventoryModule],
  controllers: [OpsJobsController],
  providers: [OpsAlertsService],
})
export class OpsJobsModule {}
