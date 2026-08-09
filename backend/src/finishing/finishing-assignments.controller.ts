import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from "@nestjs/common";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import { UserRole } from "../generated/prisma/client";
import { CreateFinishingAssignmentDto } from "./dto/create-finishing-assignment.dto";
import { ListFinishingAssignmentsQueryDto } from "./dto/list-finishing-assignments-query.dto";
import { ReceiveFinishingReturnDto } from "./dto/receive-finishing-return.dto";
import { FinishingAssignmentsService } from "./finishing-assignments.service";

// Production/operational module — WORKER access only (plus Admins).
@Controller("finishing/assignments")
@RequireRoles(UserRole.WORKER, UserRole.ADMIN, UserRole.SUPERADMIN)
export class FinishingAssignmentsController {
  constructor(private readonly finishingAssignmentsService: FinishingAssignmentsService) {}

  @Post()
  create(@Body() dto: CreateFinishingAssignmentDto) {
    return this.finishingAssignmentsService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListFinishingAssignmentsQueryDto) {
    return this.finishingAssignmentsService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.finishingAssignmentsService.findOne(id);
  }

  @Post(":id/receive")
  @HttpCode(HttpStatus.OK)
  receiveReturn(@Param("id") id: string, @Body() dto: ReceiveFinishingReturnDto) {
    return this.finishingAssignmentsService.receiveReturn(id, dto);
  }
}
