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
import { WhatsAppSalesService } from "./whatsapp-sales.service";

@Controller("whatsapp")
export class WhatsAppController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappDocs: WhatsAppDocumentsService,
    private readonly whatsappSales: WhatsAppSalesService,
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

  // "Send to Customer on WhatsApp" on the sale success screen. `saleRefs` is
  // a JSON array because one counter bill is several SaleRecords — one per
  // saree — and they must produce a single message, not one per piece.
  // Guarded to the same roles as POST /sales itself — whoever may raise the
  // sale may send its bill, and nobody else.
  @Post("send-sale-bill")
  @HttpCode(HttpStatus.OK)
  @RequireRoles(UserRole.SHOP, UserRole.ACCOUNTANT, UserRole.ADMIN, UserRole.SUPERADMIN)
  @UseInterceptors(FileInterceptor("file", documentUploadOptions()))
  sendSaleBill(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body("saleRefs") saleRefs: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!file) throw new BadRequestException("A PDF file is required");
    if (!saleRefs) throw new BadRequestException("saleRefs is required");

    let parsed: unknown;
    try {
      parsed = JSON.parse(saleRefs);
    } catch {
      throw new BadRequestException("saleRefs must be a JSON array of sale references");
    }
    if (!Array.isArray(parsed) || parsed.some((ref) => typeof ref !== "string")) {
      throw new BadRequestException("saleRefs must be a JSON array of sale references");
    }

    return this.whatsappSales.sendSaleBill(parsed as string[], file, user.id);
  }
}
