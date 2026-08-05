import { Controller, Get } from "@nestjs/common";
import { ApprovalsService } from "./approvals.service";

// NOTE: RBAC guards intentionally not yet applied — see the same note in
// src/users/users.controller.ts. This route is superadmin-only per the
// architecture doc §1.2 once auth exists.
@Controller("approvals")
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get()
  findPending() {
    return this.approvalsService.findPending();
  }
}
