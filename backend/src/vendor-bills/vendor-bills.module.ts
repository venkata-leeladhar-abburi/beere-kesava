import { Module } from "@nestjs/common";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { VendorBillsController } from "./vendor-bills.controller";
import { VendorBillsService } from "./vendor-bills.service";

@Module({
  imports: [AuditLogModule],
  controllers: [VendorBillsController],
  providers: [VendorBillsService],
  exports: [VendorBillsService],
})
export class VendorBillsModule {}
