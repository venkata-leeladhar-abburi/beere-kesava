import { Module } from "@nestjs/common";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { VendorsController } from "./vendors.controller";
import { VendorsService } from "./vendors.service";

@Module({
  imports: [AuditLogModule],
  controllers: [VendorsController],
  providers: [VendorsService],
  exports: [VendorsService],
})
export class VendorsModule {}
