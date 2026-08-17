import { Module } from "@nestjs/common";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { SupplierReturnsController } from "./supplier-returns.controller";
import { SupplierReturnsService } from "./supplier-returns.service";

@Module({
  imports: [AuditLogModule],
  controllers: [SupplierReturnsController],
  providers: [SupplierReturnsService],
  exports: [SupplierReturnsService],
})
export class SupplierReturnsModule {}
