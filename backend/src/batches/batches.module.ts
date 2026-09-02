import { Module } from "@nestjs/common";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { MaterialReturnsModule } from "../material-returns/material-returns.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { BatchesController } from "./batches.controller";
import { BatchesService } from "./batches.service";

@Module({
  imports: [AuditLogModule, MaterialReturnsModule, NotificationsModule],
  controllers: [BatchesController],
  providers: [BatchesService],
  exports: [BatchesService],
})
export class BatchesModule {}
