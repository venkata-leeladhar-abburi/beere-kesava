import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { IdGeneratorModule } from "../id-generator/id-generator.module";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { WarpRequestsController } from "./warp-requests.controller";
import { WarpRequestsService } from "./warp-requests.service";

@Module({
  imports: [PrismaModule, IdGeneratorModule, AuditLogModule, NotificationsModule],
  controllers: [WarpRequestsController],
  providers: [WarpRequestsService],
  exports: [WarpRequestsService],
})
export class WarpRequestsModule {}
