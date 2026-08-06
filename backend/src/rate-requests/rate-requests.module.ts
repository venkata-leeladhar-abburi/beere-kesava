import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { IdGeneratorModule } from "../id-generator/id-generator.module";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { RateRequestsController } from "./rate-requests.controller";
import { RateRequestsService } from "./rate-requests.service";

@Module({
  imports: [PrismaModule, IdGeneratorModule, AuditLogModule],
  controllers: [RateRequestsController],
  providers: [RateRequestsService],
  exports: [RateRequestsService],
})
export class RateRequestsModule {}
