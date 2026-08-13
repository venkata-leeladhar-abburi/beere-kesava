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
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import { signatureUploadOptions } from "../common/storage/upload.config";
import { UserRole } from "../generated/prisma/client";
import { CreateMaterialReturnDto } from "./dto/create-material-return.dto";
import { GetOutstandingQueryDto } from "./dto/get-outstanding-query.dto";
import { ListMaterialReturnsQueryDto } from "./dto/list-material-returns-query.dto";
import { MaterialReturnsService } from "./material-returns.service";

// Admin/Superadmin-only — recording what a weaver hands back is done at the
// factory desk, unlike material-issues which a WORKER can also create.
@Controller("material-returns")
@RequireRoles(UserRole.ADMIN, UserRole.SUPERADMIN)
export class MaterialReturnsController {
  constructor(private readonly materialReturnsService: MaterialReturnsService) {}

  @Post()
  create(@Body() dto: CreateMaterialReturnDto) {
    return this.materialReturnsService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListMaterialReturnsQueryDto) {
    return this.materialReturnsService.findAll(query);
  }

  @Get("outstanding")
  getOutstanding(@Query() query: GetOutstandingQueryDto) {
    return this.materialReturnsService.getOutstanding(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.materialReturnsService.findOne(id);
  }

  @Post(":id/sign")
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor("signature", signatureUploadOptions()))
  sign(@Param("id") id: string, @UploadedFile() signature?: Express.Multer.File) {
    if (!signature) {
      throw new BadRequestException("A signature image file is required");
    }
    return this.materialReturnsService.sign(id, signature);
  }

  @Post(":id/cancel")
  @HttpCode(HttpStatus.OK)
  cancel(@Param("id") id: string) {
    return this.materialReturnsService.cancel(id);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id") id: string) {
    return this.materialReturnsService.remove(id);
  }
}
