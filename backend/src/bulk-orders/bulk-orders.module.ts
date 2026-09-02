import { Module } from "@nestjs/common";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { BulkOrdersController } from "./bulk-orders.controller";
import { BulkOrdersService } from "./bulk-orders.service";

@Module({
  imports: [AuditLogModule, NotificationsModule],
  controllers: [BulkOrdersController],
  providers: [BulkOrdersService],
  exports: [BulkOrdersService],
})
export class BulkOrdersModule {}
