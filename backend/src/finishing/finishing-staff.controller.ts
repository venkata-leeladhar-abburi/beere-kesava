import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import { UserRole } from "../generated/prisma/client";
import { CreateFinishingStaffDto } from "./dto/create-finishing-staff.dto";
import { ListFinishingStaffQueryDto } from "./dto/list-finishing-staff-query.dto";
import { UpdateFinishingStaffDto } from "./dto/update-finishing-staff.dto";
import { FinishingStaffService } from "./finishing-staff.service";

// Production/operational module — WORKER access only (plus Admins).
@Controller("finishing/staff")
@RequireRoles(UserRole.WORKER, UserRole.ADMIN, UserRole.SUPERADMIN)
export class FinishingStaffController {
  constructor(private readonly finishingStaffService: FinishingStaffService) {}

  @Post()
  create(@Body() dto: CreateFinishingStaffDto) {
    return this.finishingStaffService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListFinishingStaffQueryDto) {
    return this.finishingStaffService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.finishingStaffService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateFinishingStaffDto) {
    return this.finishingStaffService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.finishingStaffService.remove(id);
  }
}
