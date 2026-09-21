import { Module } from "@nestjs/common";
import { GeofenceController } from "./geofence.controller";
import { GeofenceService } from "./geofence.service";

@Module({
  controllers: [GeofenceController],
  providers: [GeofenceService],
  // AuthModule consumes this for the checks on request-otp, verify-otp and
  // switch-role.
  exports: [GeofenceService],
})
export class GeofenceModule {}
