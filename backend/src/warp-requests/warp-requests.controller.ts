import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { AdminOnly, RequireRoles } from "../auth/decorators/require-roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import { WarpRequestsService, CreateWarpRequestDto } from "./warp-requests.service";
import { UserRole, WarpRequestStatus } from "../generated/prisma/client";

// Weavers submit their own warp requests (self-service portal) and
// production staff manage/list them. Approving/rejecting is an admin-level
// sign-off, so a WEAVER can never approve/reject their own submission.
@Controller("warp-requests")
@RequireRoles(UserRole.WORKER, UserRole.WEAVER)
export class WarpRequestsController {
  constructor(private readonly warpRequestsService: WarpRequestsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query("status") status?: WarpRequestStatus) {
    // A WEAVER token only ever sees their own requests — never trust a
    // client-supplied filter for that, there isn't one to begin with here,
    // so we force it at the service layer via weaverId.
    const weaverId = user.role === UserRole.WEAVER ? user.id : undefined;
    return this.warpRequestsService.list(status, weaverId);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateWarpRequestDto) {
    // Force the weaverId to the caller's own id when the caller is a WEAVER,
    // so a WEAVER token can never submit a request on behalf of another weaver.
    if (user.role === UserRole.WEAVER) {
      return this.warpRequestsService.create({ ...dto, weaverId: user.id ?? dto.weaverId });
    }
    return this.warpRequestsService.create(dto);
  }

  @Patch(":id/approve")
  @AdminOnly()
  approve(@Param("id") id: string, @Body("decidedById") decidedById?: string) {
    return this.warpRequestsService.approve(id, decidedById);
  }

  @Patch(":id/reject")
  @AdminOnly()
  reject(
    @Param("id") id: string,
    @Body("decidedById") decidedById?: string,
    @Body("notes") notes?: string,
  ) {
    return this.warpRequestsService.reject(id, decidedById, notes);
  }
}
