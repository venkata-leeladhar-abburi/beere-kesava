import { Controller, Get } from "@nestjs/common";
import { AdminOnly } from "../auth/decorators/require-roles.decorator";
import { ApprovalsService } from "./approvals.service";

// Admin/superadmin-only per the architecture doc §1.2.
@Controller("approvals")
@AdminOnly()
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get()
  findPending() {
    return this.approvalsService.findPending();
  }
}
