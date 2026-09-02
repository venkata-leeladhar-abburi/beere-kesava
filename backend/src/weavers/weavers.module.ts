import { Module } from "@nestjs/common";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { WeaversController } from "./weavers.controller";
import { WeaversService } from "./weavers.service";

@Module({
  imports: [AuditLogModule, NotificationsModule],
  controllers: [WeaversController],
  providers: [WeaversService],
  exports: [WeaversService],
})
export class WeaversModule {}
