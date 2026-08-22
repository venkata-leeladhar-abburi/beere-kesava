import { Module } from "@nestjs/common";
import { FirmActivityService } from "./firm-activity.service";
import { FirmsController } from "./firms.controller";
import { FirmsService } from "./firms.service";

@Module({
  controllers: [FirmsController],
  providers: [FirmsService, FirmActivityService],
})
export class FirmsModule {}
