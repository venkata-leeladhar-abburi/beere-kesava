import { Module } from "@nestjs/common";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { SuppliersController } from "./suppliers.controller";
import { SuppliersService } from "./suppliers.service";

@Module({
  imports: [AuditLogModule],
  controllers: [SuppliersController],
  providers: [SuppliersService],
  exports: [SuppliersService],
})
export class SuppliersModule {}
