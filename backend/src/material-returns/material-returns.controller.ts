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
import { CreateMaterialReturnDto } from "./dto/create-material-return.dto";
import { GetOutstandingQueryDto } from "./dto/get-outstanding-query.dto";
import { ListMaterialReturnsQueryDto } from "./dto/list-material-returns-query.dto";
import { MaterialReturnsService } from "./material-returns.service";

// Recording/approving what a weaver hands back is done at the factory desk
// (ADMIN/SUPERADMIN only, per-method below) — but once a return is approved
// (signed off), the weaver must be able to see it and their updated
// outstanding balance in their own portal, so WEAVER gets read access,
// self-scoped in the service exactly like BatchesController.
@Controller("material-returns")
@RequireRoles(UserRole.WEAVER, UserRole.ADMIN, UserRole.SUPERADMIN)
export class MaterialReturnsController {
  constructor(private readonly materialReturnsService: MaterialReturnsService) {}

  @Post()
  @RequireRoles(UserRole.ADMIN, UserRole.SUPERADMIN)
  create(@Body() dto: CreateMaterialReturnDto) {
    return this.materialReturnsService.create(dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: ListMaterialReturnsQueryDto) {
    const weaverId = resolveWeaverScope(user);
    return this.materialReturnsService.findAll(query, weaverId);
  }

  @Get("outstanding")
  getOutstanding(@CurrentUser() user: AuthenticatedUser, @Query() query: GetOutstandingQueryDto) {
    const weaverId = resolveWeaverScope(user);
    return this.materialReturnsService.getOutstanding(query, weaverId);
  }

  @Get(":id")
  findOne(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    const weaverId = resolveWeaverScope(user);
    return this.materialReturnsService.findOne(id, weaverId);
  }

  @Post(":id/sign")
  @RequireRoles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor("signature", signatureUploadOptions()))
  sign(@Param("id") id: string, @UploadedFile() signature?: Express.Multer.File) {
    if (!signature) {
      throw new BadRequestException("A signature image file is required");
    }
    return this.materialReturnsService.sign(id, signature);
  }

  @Post(":id/cancel")
  @RequireRoles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  cancel(@Param("id") id: string) {
    return this.materialReturnsService.cancel(id);
  }

  @Delete(":id")
  @RequireRoles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id") id: string) {
    return this.materialReturnsService.remove(id);
  }
}
