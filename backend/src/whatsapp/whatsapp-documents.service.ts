import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { WhatsAppMessageKind } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../common/storage/storage.service";
import { WhatsAppService } from "./whatsapp.service";

/**
 * "Share with Vendor" on the PO document modal. Resolves the vendor's phone
 * from the PO's vendor relation (never trusts a phone number handed up from
 * the client), stores the freshly-rasterised PDF the frontend just built
 * (see exportPdf.ts) in R2, and sends it through the `bk_document_share_`
 * AiSensy template — see guidelines/WHATSAPP_AISENSY_INTEGRATION.md Part 5.
 */
@Injectable()
export class WhatsAppDocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly whatsapp: WhatsAppService,
  ) {}

  async sendPurchaseOrder(poId: string, file: Express.Multer.File, sentById?: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: { vendor: true },
    });
    if (!po) throw new NotFoundException("Purchase order not found");

    // WhatsApp-first (a vendor may run a different WhatsApp number than
    // their voice line), falling back to the plain phone field.
    const destination = po.vendor.whatsapp || po.vendor.phone;
    if (!destination) {
      throw new BadRequestException(
        `${po.vendor.name} has no phone or WhatsApp number on file — add one on the vendor's profile first.`,
      );
    }

    const key = await this.storage.upload(file, "documents");
    const mediaUrl = await this.storage.resolveUrl(key.replace(/^\/uploads\//, ""));

    return this.whatsapp.sendTemplate({
      campaignName: "bk_document_share_",
      destination,
      recipientName: po.vendor.contactName || po.vendor.name,
      templateParams: [
        this.whatsapp.sanitiseParam(po.vendor.contactName || po.vendor.name),
        "Purchase Order",
        po.poNumber,
        new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        "Beere Kesava Silks",
      ],
      media: { url: mediaUrl, filename: `${po.poNumber}.pdf` },
      kind: WhatsAppMessageKind.DOCUMENT,
      relatedType: "PurchaseOrder",
      relatedId: po.id,
      sentById,
    });
  }
}
