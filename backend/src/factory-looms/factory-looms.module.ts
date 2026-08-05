import { Module } from "@nestjs/common";
import { FactoryLoomsController } from "./factory-looms.controller";
import { FactoryLoomsService } from "./factory-looms.service";

@Module({
  controllers: [FactoryLoomsController],
  providers: [FactoryLoomsService],
  exports: [FactoryLoomsService],
})
export class FactoryLoomsModule {}
