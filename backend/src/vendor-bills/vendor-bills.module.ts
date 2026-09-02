import { Module } from "@nestjs/common";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { VendorBillsController } from "./vendor-bills.controller";
import { VendorBillsService } from "./vendor-bills.service";

@Module({
  imports: [AuditLogModule, NotificationsModule],
  controllers: [VendorBillsController],
  providers: [VendorBillsService],
  exports: [VendorBillsService],
})
export class VendorBillsModule {}
