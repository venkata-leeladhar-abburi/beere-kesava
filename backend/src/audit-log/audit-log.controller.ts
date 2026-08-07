import { Controller, Get, Query } from "@nestjs/common";
import { AdminOnly } from "../auth/decorators/require-roles.decorator";
import { AuditLogService } from "./audit-log.service";
import { ListActionLogQueryDto } from "./dto/list-action-log-query.dto";
import { ListAuditLogQueryDto } from "./dto/list-audit-log-query.dto";

// Admin/superadmin-only.
//
// NOTE: there is no write endpoint here on purpose — AuditLog rows are only
// ever produced by other modules via AuditLogService.record()/recordAction().
@Controller("audit-log")
@AdminOnly()
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  findAll(@Query() query: ListAuditLogQueryDto) {
    return this.auditLogService.findAll(query);
  }

  // Generic "action feed" — writes come from weavers/invoices/purchase-orders
  // (and, incrementally, other modules) via AuditLogService.recordAction().
  @Get("actions")
  findAllActions(@Query() query: ListActionLogQueryDto) {
    return this.auditLogService.findAllActions(query);
  }
}
