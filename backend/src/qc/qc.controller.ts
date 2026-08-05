import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { CreateQcRecordDto } from "./dto/create-qc-record.dto";
import { ListQcQueryDto } from "./dto/list-qc-query.dto";
import { QcService } from "./qc.service";

// NOTE: RBAC guards intentionally not yet applied — see the same note in
// src/users/users.controller.ts. Create should require "production.qc.create"
// once auth exists.
@Controller("qc")
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
