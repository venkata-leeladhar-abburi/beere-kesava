import { Module } from "@nestjs/common";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { DispatchController } from "./dispatch.controller";
import { DispatchService } from "./dispatch.service";

@Module({
  imports: [AuditLogModule, NotificationsModule],
  controllers: [DispatchController],
  providers: [DispatchService],
})
export class DispatchModule {}
