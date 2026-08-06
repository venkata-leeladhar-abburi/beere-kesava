import { Module } from "@nestjs/common";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { RatesController } from "./rates.controller";
import { RatesService } from "./rates.service";

@Module({
  imports: [AuditLogModule],
  controllers: [RatesController],
  providers: [RatesService],
})
export class RatesModule {}
