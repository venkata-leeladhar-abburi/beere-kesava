import { Module } from "@nestjs/common";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { WeaversController } from "./weavers.controller";
import { WeaversService } from "./weavers.service";

@Module({
  imports: [AuditLogModule],
  controllers: [WeaversController],
  providers: [WeaversService],
  exports: [WeaversService],
})
export class WeaversModule {}
