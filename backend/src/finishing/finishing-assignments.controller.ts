import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from "@nestjs/common";
import { CreateFinishingAssignmentDto } from "./dto/create-finishing-assignment.dto";
import { ListFinishingAssignmentsQueryDto } from "./dto/list-finishing-assignments-query.dto";
import { ReceiveFinishingReturnDto } from "./dto/receive-finishing-return.dto";
import { FinishingAssignmentsService } from "./finishing-assignments.service";

// NOTE: RBAC guards intentionally not yet applied — see the same note in
// src/users/users.controller.ts. Create/receive should require
// "production.finishing.assign" once auth exists.
@Controller("finishing/assignments")
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
