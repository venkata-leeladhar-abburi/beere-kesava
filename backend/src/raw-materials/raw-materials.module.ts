import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { IdGeneratorModule } from "../id-generator/id-generator.module";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { RawMaterialsController } from "./raw-materials.controller";
import { RawMaterialsService } from "./raw-materials.service";

@Module({
  imports: [PrismaModule, IdGeneratorModule, AuditLogModule],
  controllers: [RawMaterialsController],
  providers: [RawMaterialsService],
  exports: [RawMaterialsService],
})
export class RawMaterialsModule {}
