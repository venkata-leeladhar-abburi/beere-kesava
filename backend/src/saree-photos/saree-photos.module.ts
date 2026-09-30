import { Module } from "@nestjs/common";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { SareePhotosController } from "./saree-photos.controller";
import { SareePhotosService } from "./saree-photos.service";

@Module({
  imports: [AuditLogModule],
  controllers: [SareePhotosController],
  providers: [SareePhotosService],
})
export class SareePhotosModule {}
