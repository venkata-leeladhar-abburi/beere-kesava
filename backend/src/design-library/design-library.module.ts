import { Module } from "@nestjs/common";
import { DesignLibraryController } from "./design-library.controller";
import { DesignLibraryService } from "./design-library.service";

@Module({
  controllers: [DesignLibraryController],
  providers: [DesignLibraryService],
  exports: [DesignLibraryService],
})
export class DesignLibraryModule {}
