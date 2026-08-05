import { Module } from "@nestjs/common";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { InvoicesController } from "./invoices.controller";
import { InvoicesService } from "./invoices.service";

@Module({
  imports: [AuditLogModule],
  controllers: [InvoicesController],
  providers: [InvoicesService],
})
export class InvoicesModule {}
