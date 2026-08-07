import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import { UserRole, RateRequestStatus } from "../generated/prisma/client";
import { RateRequestsService, CreateRateRequestDto } from "./rate-requests.service";

// Weavers submit their own rate requests; accountants review the list.
// Approving/rejecting a rate is a financial sign-off — admin-only, so a
// WEAVER can never approve/reject their own (or anyone's) submission.
@Controller("rate-requests")
@RequireRoles(UserRole.WEAVER, UserRole.ACCOUNTANT)
export class RateRequestsController {
  constructor(private readonly rateRequestsService: RateRequestsService) {}

  @Get()
  list(@Query("status") status?: RateRequestStatus) {
    return this.rateRequestsService.list(status);
  }

  @Post()
  create(@Body() dto: CreateRateRequestDto) {
    return this.rateRequestsService.create(dto);
  }

  @Patch(":id/approve")
  @RequirePermissions("rate_requests.approve")
  approve(@Param("id") id: string, @Body("decidedById") decidedById?: string) {
    return this.rateRequestsService.approve(id, decidedById);
  }

  @Patch(":id/reject")
  @RequirePermissions("rate_requests.reject")
  reject(
    @Param("id") id: string,
    @Body("decidedById") decidedById?: string,
    @Body("reason") reason?: string,
  ) {
    return this.rateRequestsService.reject(id, decidedById, reason);
  }
}
