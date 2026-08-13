import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import { resolveWeaverScope } from "../auth/weaver-scope";
import { UserRole } from "../generated/prisma/client";
import { CreateQcRecordDto } from "./dto/create-qc-record.dto";
import { ListQcQueryDto } from "./dto/list-qc-query.dto";
import { QcService } from "./qc.service";

// Production/operational module — WORKER has full read/write; WEAVER can
// only read their own records (self-scoped in the service, same pattern as
// BatchesController) so their portal can show real QC pass rate/earnings.
@Controller("qc")
@RequireRoles(UserRole.WORKER, UserRole.WEAVER, UserRole.ADMIN, UserRole.SUPERADMIN)
export class QcController {
  constructor(private readonly qcService: QcService) {}

  @Post()
  @RequireRoles(UserRole.WORKER, UserRole.ADMIN, UserRole.SUPERADMIN)
  create(@Body() dto: CreateQcRecordDto) {
    return this.qcService.create(dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: ListQcQueryDto) {
    const weaverId = resolveWeaverScope(user);
    return this.qcService.findAll(query, weaverId);
  }

  // Read-only, also open to SHOP — the shop-staff portal's Finished
  // Goods & Dispatch page reuses the same inventory stats as the admin
  // portal (Total in Inventory / Pending Finishing / Ready for Dispatch),
  // which needs this figure to match rather than always reading 0.
  @Get("ready-for-finishing")
  @RequireRoles(UserRole.WORKER, UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SHOP)
  findReadyForFinishing() {
    return this.qcService.findReadyForFinishing();
  }

  @Get(":sareeId")
  findOne(@CurrentUser() user: AuthenticatedUser, @Param("sareeId") sareeId: string) {
    const weaverId = resolveWeaverScope(user);
    return this.qcService.findOne(sareeId, weaverId);
  }
}
