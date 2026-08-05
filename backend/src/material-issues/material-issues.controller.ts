import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { signatureUploadOptions } from "../common/storage/upload.config";
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
  @UseInterceptors(FileInterceptor("signature", signatureUploadOptions()))
  sign(@Param("id") id: string, @UploadedFile() signature?: Express.Multer.File) {
    if (!signature) {
      throw new BadRequestException("A signature image file is required");
    }
    return this.materialIssuesService.sign(id, signature);
  }

  @Post(":id/cancel")
  @HttpCode(HttpStatus.OK)
  cancel(@Param("id") id: string) {
    return this.materialIssuesService.cancel(id);
  }
}
