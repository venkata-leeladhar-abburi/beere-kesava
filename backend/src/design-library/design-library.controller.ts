import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import { UserRole } from "../generated/prisma/client";
import { CreateDesignDto } from "./dto/create-design.dto";
import { DispatchDesignDto } from "./dto/dispatch-design.dto";
import { ListDesignsQueryDto } from "./dto/list-designs-query.dto";
import { UpdateDesignDto } from "./dto/update-design.dto";
import { DesignLibraryService } from "./design-library.service";

// Production/operational module — WORKER access only.
@Controller("design-library")
@RequireRoles(UserRole.WORKER)
export class DesignLibraryController {
  constructor(private readonly designLibraryService: DesignLibraryService) {}

  @Post()
  create(@Body() dto: CreateDesignDto) {
    return this.designLibraryService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListDesignsQueryDto) {
    return this.designLibraryService.findAll(query);
  }

  @Get(":code")
  findOne(@Param("code") code: string) {
    return this.designLibraryService.findOne(code);
  }

  @Patch(":code")
  update(@Param("code") code: string, @Body() dto: UpdateDesignDto) {
    return this.designLibraryService.update(code, dto);
  }

  @Post(":code/dispatch")
  dispatch(@Param("code") code: string, @Body() dto: DispatchDesignDto) {
    return this.designLibraryService.dispatch(code, dto);
  }
}
