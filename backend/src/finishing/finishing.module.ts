import { Module } from "@nestjs/common";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { FinishingAssignmentsController } from "./finishing-assignments.controller";
import { FinishingAssignmentsService } from "./finishing-assignments.service";
import { FinishingStaffController } from "./finishing-staff.controller";
import { FinishingStaffService } from "./finishing-staff.service";

@Module({
  imports: [AuditLogModule, NotificationsModule],
  controllers: [FinishingStaffController, FinishingAssignmentsController],
  providers: [FinishingStaffService, FinishingAssignmentsService],
  exports: [FinishingStaffService, FinishingAssignmentsService],
})
export class FinishingModule {}
