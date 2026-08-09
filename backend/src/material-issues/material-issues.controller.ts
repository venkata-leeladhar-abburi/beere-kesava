import {
  BadRequestException,
  Body,
  Controller,
  Delete,
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
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import { resolveWeaverScope } from "../auth/weaver-scope";
import { signatureUploadOptions } from "../common/storage/upload.config";
import { UserRole } from "../generated/prisma/client";
import { CreateMaterialIssueDto } from "./dto/create-material-issue.dto";
import { ListMaterialIssuesQueryDto } from "./dto/list-material-issues-query.dto";
import { MaterialIssuesService } from "./material-issues.service";

// Production/operational module — WORKER access by default. A WEAVER may
// additionally read their own issued-material records (self-scoped below)
// so the weaver portal can show what they've received; issuing, signing
// and cancelling stay WORKER-only.
@Controller("material-issues")
@RequireRoles(UserRole.WORKER, UserRole.ADMIN, UserRole.SUPERADMIN)
export class MaterialIssuesController {
  constructor(private readonly materialIssuesService: MaterialIssuesService) {}

  @Post()
  create(@Body() dto: CreateMaterialIssueDto) {
    return this.materialIssuesService.create(dto);
  }

  @Get()
  @RequireRoles(UserRole.WORKER, UserRole.WEAVER)
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: ListMaterialIssuesQueryDto) {
    // A WEAVER token must never see another weaver's issues — ignore any
    // client-supplied weaverId and force it to the caller's own weaver id.
    const scopedQuery =
      user.role === UserRole.WEAVER ? { ...query, weaverId: resolveWeaverScope(user) } : query;
    return this.materialIssuesService.findAll(scopedQuery);
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

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id") id: string) {
    return this.materialIssuesService.remove(id);
  }
}
