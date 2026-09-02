import { Module } from "@nestjs/common";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { PurchaseRequestsController } from "./purchase-requests.controller";
import { PurchaseRequestsService } from "./purchase-requests.service";

@Module({
  imports: [AuditLogModule, NotificationsModule],
  controllers: [PurchaseRequestsController],
  providers: [PurchaseRequestsService],
  exports: [PurchaseRequestsService],
})
export class PurchaseRequestsModule {}
