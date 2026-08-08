import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import { resolveWeaverScope } from "../auth/weaver-scope";
import { UserRole } from "../generated/prisma/client";
import { ActorOnlyDto } from "./dto/actor-only.dto";
import { AssignBatchRowDto } from "./dto/assign-batch-row.dto";
import { CreateBatchDto } from "./dto/create-batch.dto";
import { ListBatchesQueryDto } from "./dto/list-batches-query.dto";
import { BatchesService } from "./batches.service";

// Production module — WORKER has full read/write; WEAVER can only read
// batches that include rows assigned to them (self-scoped in the service).
@Controller("batches")
@RequireRoles(UserRole.WORKER, UserRole.WEAVER)
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Post()
  @RequireRoles(UserRole.WORKER)
  create(@Body() dto: CreateBatchDto) {
    return this.batchesService.create(dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: ListBatchesQueryDto) {
    const weaverId = resolveWeaverScope(user);
    return this.batchesService.findAll(query, weaverId);
  }

  @Get(":id")
  findOne(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    const weaverId = resolveWeaverScope(user);
    return this.batchesService.findOne(id, weaverId);
  }

  @Patch(":id/rows/:serial")
  @RequireRoles(UserRole.WORKER)
  assignRow(
    @Param("id") id: string,
    @Param("serial", ParseIntPipe) serial: number,
    @Body() dto: AssignBatchRowDto,
  ) {
    return this.batchesService.assignRow(id, serial, dto);
  }

  @Post(":id/finalize")
  @HttpCode(HttpStatus.OK)
  @RequireRoles(UserRole.WORKER)
  finalize(@Param("id") id: string, @Query() dto: ActorOnlyDto) {
    return this.batchesService.finalize(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireRoles(UserRole.WORKER)
  remove(@Param("id") id: string, @Query() dto: ActorOnlyDto) {
    return this.batchesService.remove(id, dto);
  }
}
