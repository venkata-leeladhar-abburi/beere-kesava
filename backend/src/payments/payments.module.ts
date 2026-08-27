import { Module } from "@nestjs/common";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { PurchasesModule } from "../purchases/purchases.module";
import { VendorBillsModule } from "../vendor-bills/vendor-bills.module";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";

@Module({
  imports: [AuditLogModule, VendorBillsModule, PurchasesModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
