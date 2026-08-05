import { Module } from "@nestjs/common";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { PurchaseOrdersController } from "./purchase-orders.controller";
import { PurchaseOrdersService } from "./purchase-orders.service";

@Module({
  imports: [AuditLogModule],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService],
  exports: [PurchaseOrdersService],
})
export class PurchaseOrdersModule {}
