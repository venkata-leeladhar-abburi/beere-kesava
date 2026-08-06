import { Controller, Post } from "@nestjs/common";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import { UserRole } from "../generated/prisma/client";
import { OverduePaymentsService } from "./overdue-payments.service";

// Manual-trigger endpoint for a system-wide financial job — ACCOUNTANT/ADMIN only.
@Controller("finance-jobs")
@RequireRoles(UserRole.ACCOUNTANT)
export class FinanceJobsController {
  constructor(private readonly overduePaymentsService: OverduePaymentsService) {}

  @Post("overdue-payments/run")
  runOverdueScan() {
    return this.overduePaymentsService.runScan();
  }
}
