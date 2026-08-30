import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import { UserRole } from "../generated/prisma/client";
import { CreateWeaverDto } from "./dto/create-weaver.dto";
import { ListWeaversQueryDto } from "./dto/list-weavers-query.dto";
import { UpdateWeaverDto } from "./dto/update-weaver.dto";
import { WeaverStatsQueryDto } from "./dto/weaver-stats-query.dto";
import { WeaversService } from "./weavers.service";

// Weaver roster management. Creating and editing a weaver is reachable from
// WeaversPage, which the frontend mounts in both the accountant and admin
// dashboards - hence ACCOUNTANT here, with ADMIN/SUPERADMIN passing via the
// PermissionsGuard bypass regardless.
//
// Deletion is deliberately NOT a @RequireRoles check: PermissionsGuard waves
// ADMIN through before any role list is consulted, so a role decorator cannot
// express "SUPERADMIN only". remove() hard-deletes the weaver *and* its linked
// User row inside a transaction - the same blast radius as users.delete, the
// one permission prisma/seed.ts deliberately withholds from ADMIN. Mirror that
// with a permission key instead.
//
// Reads remain open to any authenticated user. That is pre-existing and
// exposes weaver contact details broadly; tracked separately.
@Controller("weavers")
export class WeaversController {
  constructor(private readonly weaversService: WeaversService) {}

  @RequireRoles(UserRole.ACCOUNTANT, UserRole.ADMIN, UserRole.SUPERADMIN)
  @Post()
  create(@Body() dto: CreateWeaverDto) {
    return this.weaversService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListWeaversQueryDto) {
    return this.weaversService.findAll(query);
  }

  /**
   * Returns the top-10 leaderboard of active weavers ranked by QC pass rate.
   * NOTE: This route MUST be declared before @Get(':id') so NestJS does not
   * attempt to resolve the literal string "leaderboard" as a UUID param.
   */
  @Get("leaderboard")
  getLeaderboard() {
    return this.weaversService.getLeaderboard();
  }

  /**
   * Returns the top-5 weaver leaderboard ranked by production volume (QC
   * records recorded) within the trailing `months` window (default 6).
   * NOTE: This route MUST be declared before @Get(':id') so NestJS does not
   * attempt to resolve the literal string "production-leaderboard" as a UUID param.
   */
  @Get("production-leaderboard")
  getProductionLeaderboard(@Query("months") months?: string) {
    const parsed = months ? Number(months) : undefined;
    return this.weaversService.getProductionLeaderboard(
      parsed && !Number.isNaN(parsed) ? parsed : undefined,
    );
  }

  /**
   * Every weaver's stats in one call, optionally scoped to a date window.
   * NOTE: MUST be declared before @Get(':id') so "stats" isn't parsed as an id.
   */
  @Get("stats")
  getAllStats(@Query() query: WeaverStatsQueryDto) {
    return this.weaversService.getAllWeaverStats(query.range());
  }

  /**
   * Firm-wide monthly output for the trailing `months` window (default 12).
   * NOTE: MUST be declared before @Get(':id').
   */
  @Get("production-series")
  getProductionSeries(@Query("months") months?: string) {
    const parsed = months ? Number(months) : undefined;
    return this.weaversService.getProductionSeries(
      parsed && !Number.isNaN(parsed) ? parsed : undefined,
    );
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.weaversService.findOne(id);
  }

  /** Live performance stats: QC pass rate, active batch rows, material issues. */
  @Get(":id/stats")
  getStats(@Param("id") id: string, @Query() query: WeaverStatsQueryDto) {
    return this.weaversService.getWeaverStats(id, query.range());
  }

  @RequireRoles(UserRole.ACCOUNTANT, UserRole.ADMIN, UserRole.SUPERADMIN)
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateWeaverDto) {
    return this.weaversService.update(id, dto);
  }

  @RequirePermissions("weavers.delete")
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.weaversService.remove(id);
  }
}
