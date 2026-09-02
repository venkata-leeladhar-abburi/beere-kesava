import { Controller, Post } from "@nestjs/common";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import { UserRole } from "../generated/prisma/client";
import { OpsAlertsService } from "./ops-alerts.service";

// Manual-trigger endpoint for the daily operational scan — ADMIN only,
// mirroring FinanceJobsController's ACCOUNTANT gate on the financial one.
@Controller("ops-jobs")
@RequireRoles(UserRole.ADMIN)
export class OpsJobsController {
  constructor(private readonly opsAlertsService: OpsAlertsService) {}

  @Post("alerts/run")
  runOpsScan() {
    return this.opsAlertsService.runScan();
  }
}
