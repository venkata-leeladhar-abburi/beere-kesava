import { Global, Module } from "@nestjs/common";
import { SareeCodesService } from "./saree-codes.service";

/** Global, like IdGeneratorModule: suppliers, purchases and every place that
 *  takes a scanned saree code need it. */
@Global()
@Module({
  providers: [SareeCodesService],
  exports: [SareeCodesService],
})
export class SareeCodesModule {}
