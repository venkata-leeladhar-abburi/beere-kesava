import { Module } from "@nestjs/common";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { SalesController } from "./sales.controller";
import { SalesService } from "./sales.service";

@Module({
  imports: [AuditLogModule, NotificationsModule],
  controllers: [SalesController],
  providers: [SalesService],
})
export class SalesModule {}
