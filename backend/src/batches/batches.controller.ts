import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { AssignBatchRowDto } from "./dto/assign-batch-row.dto";
import { CreateBatchDto } from "./dto/create-batch.dto";
import { ListBatchesQueryDto } from "./dto/list-batches-query.dto";
import { BatchesService } from "./batches.service";

// NOTE: RBAC guards intentionally not yet applied — see the same note in
// src/users/users.controller.ts.
@Controller("batches")
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Post()
  create(@Body() dto: CreateBatchDto) {
    return this.batchesService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListBatchesQueryDto) {
    return this.batchesService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.batchesService.findOne(id);
  }

  @Patch(":id/rows/:serial")
  assignRow(
    @Param("id") id: string,
    @Param("serial", ParseIntPipe) serial: number,
    @Body() dto: AssignBatchRowDto,
  ) {
    return this.batchesService.assignRow(id, serial, dto);
  }

  @Post(":id/finalize")
  @HttpCode(HttpStatus.OK)
  finalize(@Param("id") id: string) {
    return this.batchesService.finalize(id);
  }
}
