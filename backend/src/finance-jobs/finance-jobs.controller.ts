import { Controller, Post } from "@nestjs/common";
import { OverduePaymentsService } from "./overdue-payments.service";

// NOTE: RBAC guards intentionally not yet applied — see the same note in
// src/users/users.controller.ts. This manual-trigger endpoint should be
// SUPERADMIN/ACCOUNTANT-only once auth lands.
@Controller("finance-jobs")
export class FinanceJobsController {
  constructor(private readonly overduePaymentsService: OverduePaymentsService) {}

  @Post("overdue-payments/run")
  runOverdueScan() {
    return this.overduePaymentsService.runScan();
  }
}
