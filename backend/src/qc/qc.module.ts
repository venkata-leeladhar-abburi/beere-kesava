import { Module } from "@nestjs/common";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { QcController } from "./qc.controller";
import { QcService } from "./qc.service";

@Module({
  imports: [AuditLogModule, NotificationsModule],
  controllers: [QcController],
  providers: [QcService],
  exports: [QcService],
})
export class QcModule {}
