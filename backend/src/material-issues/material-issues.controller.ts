import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from "@nestjs/common";
import { CreateMaterialIssueDto } from "./dto/create-material-issue.dto";
import { ListMaterialIssuesQueryDto } from "./dto/list-material-issues-query.dto";
import { MaterialIssuesService } from "./material-issues.service";

// NOTE: RBAC guards intentionally not yet applied — see the same note in
// src/users/users.controller.ts. Create should require
// "production.material_issue.create" once auth exists.
@Controller("material-issues")
export class MaterialIssuesController {
  constructor(private readonly materialIssuesService: MaterialIssuesService) {}

  @Post()
  create(@Body() dto: CreateMaterialIssueDto) {
    return this.materialIssuesService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListMaterialIssuesQueryDto) {
    return this.materialIssuesService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.materialIssuesService.findOne(id);
  }

  @Post(":id/sign")
  @HttpCode(HttpStatus.OK)
  sign(@Param("id") id: string) {
    return this.materialIssuesService.sign(id);
  }

  @Post(":id/cancel")
  @HttpCode(HttpStatus.OK)
  cancel(@Param("id") id: string) {
    return this.materialIssuesService.cancel(id);
  }
}
