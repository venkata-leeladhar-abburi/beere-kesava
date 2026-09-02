import { Module } from "@nestjs/common";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { IdGeneratorModule } from "../id-generator/id-generator.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { PrismaModule } from "../prisma/prisma.module";
import { ShopReceiptsController } from "./shop-receipts.controller";
import { ShopReceiptsService } from "./shop-receipts.service";

@Module({
  imports: [PrismaModule, AuditLogModule, IdGeneratorModule, NotificationsModule],
  controllers: [ShopReceiptsController],
  providers: [ShopReceiptsService],
})
export class ShopReceiptsModule {}
