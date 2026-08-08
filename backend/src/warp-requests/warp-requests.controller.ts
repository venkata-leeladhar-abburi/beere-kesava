import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import { requireWeaverId, resolveWeaverScope } from "../auth/weaver-scope";
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
    const weaverId = resolveWeaverScope(user);
    return this.warpRequestsService.list(status, weaverId);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateWarpRequestDto) {
    // Force the weaverId to the caller's own id when the caller is a WEAVER,
    // so a WEAVER token can never submit a request on behalf of another weaver.
    if (user.role === UserRole.WEAVER) {
      return this.warpRequestsService.create({ ...dto, weaverId: requireWeaverId(user) });
    }
    return this.warpRequestsService.create(dto);
  }

  @Patch(":id/approve")
  @RequirePermissions("warp_requests.approve")
  approve(@Param("id") id: string, @Body("decidedById") decidedById?: string) {
    return this.warpRequestsService.approve(id, decidedById);
  }

  @Patch(":id/reject")
  @RequirePermissions("warp_requests.reject")
  reject(
    @Param("id") id: string,
    @Body("decidedById") decidedById?: string,
    @Body("notes") notes?: string,
  ) {
    return this.warpRequestsService.reject(id, decidedById, notes);
  }
}
