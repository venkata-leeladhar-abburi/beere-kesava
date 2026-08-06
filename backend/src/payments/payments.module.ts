import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { WEAVER_PAYMENTS_IMPORT_QUEUE, WeaverPaymentsImportProcessor } from "./weaver-payments-import.processor";

@Module({
  imports: [BullModule.registerQueue({ name: WEAVER_PAYMENTS_IMPORT_QUEUE }), AuditLogModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, WeaverPaymentsImportProcessor],
})
export class PaymentsModule {}
