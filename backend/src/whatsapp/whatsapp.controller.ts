import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import { UserRole } from "../generated/prisma/client";
import { documentUploadOptions } from "../common/storage/upload.config";
import { PrismaService } from "../prisma/prisma.service";
import { WhatsAppDocumentsService } from "./whatsapp-documents.service";

@Controller("whatsapp")
export class WhatsAppController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappDocs: WhatsAppDocumentsService,
  ) {}

  // Lets the frontend poll delivery status for a message it just triggered,
  // e.g. after sending a document or bill: GET /whatsapp/messages?relatedId=...
  @Get("messages")
  findAll(@Query("relatedId") relatedId?: string, @Query("relatedType") relatedType?: string) {
    return this.prisma.whatsAppMessage.findMany({
      where: { relatedId, relatedType },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  // PODocumentModal's "Share with Vendor" button: the frontend rasterises
  // the same document tree it uses for Download (see exportPdf.ts) and posts
  // the PDF here as multipart form data, alongside the PO id.
  @Post("send-po-document")
  @HttpCode(HttpStatus.OK)
  @RequireRoles(UserRole.ACCOUNTANT)
  @UseInterceptors(FileInterceptor("file", documentUploadOptions()))
  sendPoDocument(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body("poId") poId: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!file) throw new BadRequestException("A PDF file is required");
    if (!poId) throw new BadRequestException("poId is required");
    return this.whatsappDocs.sendPurchaseOrder(poId, file, user.id);
  }
}
