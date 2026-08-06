import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { WarpRequestsService, CreateWarpRequestDto } from "./warp-requests.service";
import { WarpRequestStatus } from "../generated/prisma/client";

@Controller("warp-requests")
export class WarpRequestsController {
  constructor(private readonly warpRequestsService: WarpRequestsService) {}

  @Get()
  list(@Query("status") status?: WarpRequestStatus) {
    return this.warpRequestsService.list(status);
  }

  @Post()
  create(@Body() dto: CreateWarpRequestDto) {
    return this.warpRequestsService.create(dto);
  }

  @Patch(":id/approve")
  approve(@Param("id") id: string, @Body("decidedById") decidedById?: string) {
    return this.warpRequestsService.approve(id, decidedById);
  }

  @Patch(":id/reject")
  reject(
    @Param("id") id: string,
    @Body("decidedById") decidedById?: string,
    @Body("notes") notes?: string,
  ) {
    return this.warpRequestsService.reject(id, decidedById, notes);
  }
}
