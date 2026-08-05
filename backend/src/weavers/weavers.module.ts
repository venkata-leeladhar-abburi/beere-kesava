import { Module } from "@nestjs/common";
import { WeaversController } from "./weavers.controller";
import { WeaversService } from "./weavers.service";

@Module({
  controllers: [WeaversController],
  providers: [WeaversService],
  exports: [WeaversService],
})
export class WeaversModule {}
