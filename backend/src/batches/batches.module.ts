import { Module } from "@nestjs/common";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { BatchesController } from "./batches.controller";
import { BatchesService } from "./batches.service";

@Module({
  imports: [AuditLogModule],
  controllers: [BatchesController],
  providers: [BatchesService],
  exports: [BatchesService],
})
export class BatchesModule {}
