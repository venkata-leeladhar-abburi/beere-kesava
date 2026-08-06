import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { RateRequestsService, CreateRateRequestDto } from "./rate-requests.service";
import { RateRequestStatus } from "../generated/prisma/client";

@Controller("rate-requests")
export class RateRequestsController {
  constructor(private readonly rateRequestsService: RateRequestsService) {}

  @Get()
  list(@Query("status") status?: RateRequestStatus) {
    return this.rateRequestsService.list(status);
  }

  @Post()
  create(@Body() dto: CreateRateRequestDto) {
    return this.rateRequestsService.create(dto);
  }

  @Patch(":id/approve")
  approve(@Param("id") id: string, @Body("decidedById") decidedById?: string) {
    return this.rateRequestsService.approve(id, decidedById);
  }

  @Patch(":id/reject")
  reject(
    @Param("id") id: string,
    @Body("decidedById") decidedById?: string,
    @Body("reason") reason?: string,
  ) {
    return this.rateRequestsService.reject(id, decidedById, reason);
  }
}
