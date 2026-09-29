import { Module } from "@nestjs/common";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { SupplierDebitNotesController } from "./supplier-debit-notes.controller";
import { SupplierDebitNotesService } from "./supplier-debit-notes.service";
import { SupplierReturnsController } from "./supplier-returns.controller";
import { SupplierReturnsService } from "./supplier-returns.service";

@Module({
  imports: [AuditLogModule, NotificationsModule],
  controllers: [SupplierReturnsController, SupplierDebitNotesController],
  providers: [SupplierReturnsService, SupplierDebitNotesService],
  exports: [SupplierReturnsService, SupplierDebitNotesService],
})
export class SupplierReturnsModule {}
