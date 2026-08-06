import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import { UserRole } from "../generated/prisma/client";
import { CreateQcRecordDto } from "./dto/create-qc-record.dto";
import { ListQcQueryDto } from "./dto/list-qc-query.dto";
import { QcService } from "./qc.service";

// Production/operational module — WORKER access only (financial/admin roles
// go through ADMIN's bypass).
@Controller("qc")
@RequireRoles(UserRole.WORKER)
export class QcController {
  constructor(private readonly qcService: QcService) {}

  @Post()
  create(@Body() dto: CreateQcRecordDto) {
    return this.qcService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListQcQueryDto) {
    return this.qcService.findAll(query);
  }

  @Get("ready-for-finishing")
  findReadyForFinishing() {
    return this.qcService.findReadyForFinishing();
  }

  @Get(":sareeId")
  findOne(@Param("sareeId") sareeId: string) {
    return this.qcService.findOne(sareeId);
  }
}
