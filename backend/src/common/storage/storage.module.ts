import { Global, Module } from "@nestjs/common";
import { StorageService } from "./storage.service";

// Global: uploads happen in several unrelated feature modules (uploads,
// material-issues, material-returns) and none of them owns the storage
// concern, so exporting it once beats importing it in each.
@Global()
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
