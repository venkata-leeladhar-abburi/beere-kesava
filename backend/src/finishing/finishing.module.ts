import { Module } from "@nestjs/common";
import { FinishingAssignmentsController } from "./finishing-assignments.controller";
import { FinishingAssignmentsService } from "./finishing-assignments.service";
import { FinishingStaffController } from "./finishing-staff.controller";
import { FinishingStaffService } from "./finishing-staff.service";

@Module({
  controllers: [FinishingStaffController, FinishingAssignmentsController],
  providers: [FinishingStaffService, FinishingAssignmentsService],
  exports: [FinishingStaffService, FinishingAssignmentsService],
})
export class FinishingModule {}
