import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { CreateWeaverDto } from "./dto/create-weaver.dto";
import { ListWeaversQueryDto } from "./dto/list-weavers-query.dto";
import { UpdateWeaverDto } from "./dto/update-weaver.dto";
import { WeaversService } from "./weavers.service";

// NOTE: RBAC guards intentionally not yet applied — see the same note in
// src/users/users.controller.ts. Add guards for the relevant permissions
// (procurement/production admin-level access) once auth exists.
@Controller("weavers")
export class WeaversController {
  constructor(private readonly weaversService: WeaversService) {}

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

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.weaversService.findOne(id);
  }

  /** Live performance stats: QC pass rate, active batch rows, material issues. */
  @Get(":id/stats")
  getStats(@Param("id") id: string) {
    return this.weaversService.getWeaverStats(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateWeaverDto) {
    return this.weaversService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.weaversService.remove(id);
  }
}
