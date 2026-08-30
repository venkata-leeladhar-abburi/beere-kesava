import { Module } from "@nestjs/common";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { MaterialReturnsController } from "./material-returns.controller";
import { MaterialReturnsService } from "./material-returns.service";

@Module({
  imports: [AuditLogModule, NotificationsModule],
  controllers: [MaterialReturnsController],
  providers: [MaterialReturnsService],
  exports: [MaterialReturnsService],
})
export class MaterialReturnsModule {}
