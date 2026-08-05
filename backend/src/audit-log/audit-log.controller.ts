import { Controller, Get, Query } from "@nestjs/common";
import { AuditLogService } from "./audit-log.service";
import { ListAuditLogQueryDto } from "./dto/list-audit-log-query.dto";

// NOTE: RBAC guards intentionally not yet applied — see the same note in
// src/users/users.controller.ts. This should be SUPERADMIN-only once auth lands.
//
// NOTE: there is no write endpoint here on purpose — AuditLog rows are only
// ever produced by the login/logout flow itself (AuditLogService.record()),
// which doesn't exist yet because JWT/OTP auth is still deferred project-wide.
// This module is read-side-ready for when that lands.
@Controller("audit-log")
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  findAll(@Query() query: ListAuditLogQueryDto) {
    return this.auditLogService.findAll(query);
  }
}
