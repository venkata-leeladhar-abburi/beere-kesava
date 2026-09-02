import { Module } from "@nestjs/common";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { SuppliersController } from "./suppliers.controller";
import { SuppliersService } from "./suppliers.service";

@Module({
  imports: [AuditLogModule, NotificationsModule],
  controllers: [SuppliersController],
  providers: [SuppliersService],
  exports: [SuppliersService],
})
export class SuppliersModule {}
