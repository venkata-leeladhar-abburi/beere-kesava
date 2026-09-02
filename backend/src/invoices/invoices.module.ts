import { Module } from "@nestjs/common";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { InvoicesController } from "./invoices.controller";
import { InvoicesService } from "./invoices.service";

@Module({
  imports: [AuditLogModule, NotificationsModule],
  controllers: [InvoicesController],
  providers: [InvoicesService],
})
export class InvoicesModule {}
