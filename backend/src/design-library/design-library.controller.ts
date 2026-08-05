import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { CreateDesignDto } from "./dto/create-design.dto";
import { DispatchDesignDto } from "./dto/dispatch-design.dto";
import { ListDesignsQueryDto } from "./dto/list-designs-query.dto";
import { UpdateDesignDto } from "./dto/update-design.dto";
import { DesignLibraryService } from "./design-library.service";

// NOTE: RBAC guards intentionally not yet applied — see the same note in
// src/users/users.controller.ts.
@Controller("design-library")
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
