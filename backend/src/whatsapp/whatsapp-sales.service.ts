import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { WhatsAppMessage, WhatsAppMessageKind } from "../generated/prisma/client";
import { StorageService } from "../common/storage/storage.service";
import { PrismaService } from "../prisma/prisma.service";
import { WhatsAppService } from "./whatsapp.service";

/** Fills {{1}} of bk_admin_sale_alert_ when SHOP_OUTLET_NAME is unset. */
const DEFAULT_OUTLET_NAME = "Main Showroom";

/**
 * "Send to Customer on WhatsApp" on the sale success screen.
 *
 * One counter sale is one bill, but the backend records one SaleRecord per
 * saree (see SalesService.createSale) — so a two-saree basket arrives here as
 * two saleRefs and must still produce exactly ONE message to the customer and
 * ONE per admin. Everything the templates interpolate is re-read from those
 * SaleRecords rather than trusted from the client: the browser supplies only
 * the rasterised PDF and the refs naming which sale it depicts.
 *
 * Two templates, one upload:
 *   bk_retail_bill_       → the customer, their own receipt
 *   bk_admin_sale_alert_  → ADMIN_WHATSAPP_NUMBERS, the owners' live feed
 */
@Injectable()
export class WhatsAppSalesService {
  private readonly logger = new Logger(WhatsAppSalesService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly whatsapp: WhatsAppService,
  ) {}

  /** Numbers on the owners' sale feed. Blank/duplicate entries are dropped. */
  private get adminNumbers(): string[] {
    const raw = this.config.get<string>("ADMIN_WHATSAPP_NUMBERS") ?? "";
    return [...new Set(raw.split(",").map((n) => n.trim()).filter(Boolean))];
  }

  async sendSaleBill(saleRefs: string[], file: Express.Multer.File, sentById?: string) {
    if (saleRefs.length === 0) {
      throw new BadRequestException("At least one saleRef is required");
    }

    const sales = await this.prisma.saleRecord.findMany({
      where: { saleRef: { in: saleRefs } },
      include: {
        customer: true,
        soldBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { date: "asc" },
    });

    if (sales.length === 0) {
      throw new NotFoundException(`No sales found for ${saleRefs.join(", ")}`);
    }

    // Every line on one bill belongs to one customer by construction — the
    // flow picks the customer before scanning any saree. A mismatch means the
    // client batched unrelated sales, and sending one receipt for them would
    // show a customer someone else's purchases.
    const customerIds = new Set(sales.map((s) => s.customerId));
    if (customerIds.size > 1) {
      throw new BadRequestException("All sales on one bill must belong to the same customer");
    }

    const first = sales[0];
    const customer = first.customer;
    // The basket's own reference. A multi-saree bill has several, and the
    // first is the one the bill PDF is named after.
    const billRef = first.saleRef;
    const total = sales.reduce((sum, s) => sum + Number(s.amount), 0);
    const pieces = `${sales.length} saree${sales.length === 1 ? "" : "s"}`;
    const payment = (first.paymentMethod || "other").toUpperCase();
    const staffName = first.soldBy
      ? `${first.soldBy.firstName} ${first.soldBy.lastName}`.trim()
      : "Shop Staff";

    // Uploaded once and shared by both templates — the customer's receipt and
    // the admin alert are the same bill, and rasterising costs a round trip.
    const key = await this.storage.upload(file, "documents");
    const mediaUrl = await this.storage.resolveUrl(key.replace(/^\/uploads\//, ""));
    const media = { url: mediaUrl, filename: `${billRef}.pdf` };

    const customerMessage = await this.sendCustomerCopy({
      customer,
      billRef,
      date: first.date,
      total,
      pieces,
      payment,
      media,
      sentById,
    });

    const adminMessages = await this.sendAdminAlerts({
      customerName: customer?.name ?? null,
      billRef,
      date: first.date,
      total,
      payment,
      staffName,
      media,
      sentById,
    });

    return {
      billRef,
      mediaUrl,
      customer: customerMessage,
      admins: adminMessages,
    };
  }

  private async sendCustomerCopy(args: {
    customer: { name: string; phone: string | null } | null;
    billRef: string;
    date: Date;
    total: number;
    pieces: string;
    payment: string;
    media: { url: string; filename: string };
    sentById?: string;
  }) {
    const phone = args.customer?.phone?.trim();
    // "—" is what the retail flow stores for a walk-in who gave no number
    // (NewSaleFlow's `phone: c.phone ?? "—"`), so it reaches here looking like
    // a value. Skipping is the correct outcome, not an error: the sale is
    // valid, there is simply nobody to send the receipt to.
    if (!phone || !/\d/.test(phone)) {
      this.logger.log(`Bill ${args.billRef}: no customer phone on file, customer copy skipped`);
      return null;
    }

    return this.whatsapp.sendTemplate({
      campaignName: "bk_retail_bill_",
      destination: phone,
      recipientName: args.customer?.name ?? "Customer",
      templateParams: [
        this.param(args.customer?.name, "Customer"),
        args.billRef,
        formatDate(args.date),
        formatAmount(args.total),
        args.pieces,
        args.payment,
      ],
      media: args.media,
      kind: WhatsAppMessageKind.RETAIL_BILL,
      relatedType: "SaleRecord",
      relatedId: args.billRef,
      sentById: args.sentById,
    });
  }

  private async sendAdminAlerts(args: {
    customerName: string | null;
    billRef: string;
    date: Date;
    total: number;
    payment: string;
    staffName: string;
    media: { url: string; filename: string };
    sentById?: string;
  }) {
    const numbers = this.adminNumbers;
    if (numbers.length === 0) {
      this.logger.warn(`ADMIN_WHATSAPP_NUMBERS is unset — no sale alert sent for ${args.billRef}`);
      return [];
    }

    const templateParams = [
      this.param(this.config.get<string>("SHOP_OUTLET_NAME"), DEFAULT_OUTLET_NAME),
      args.billRef,
      formatDateTime(args.date),
      // Retail sales don't require a customer name, and Meta rejects an empty
      // template variable outright.
      this.param(args.customerName, "Walk-in"),
      formatAmount(args.total),
      args.payment,
      this.param(args.staffName, "Shop Staff"),
    ];

    // Sequential, not Promise.all: AiSensy rate-limits, and one admin's bad
    // number must not decide whether the rest are told about the sale. Each
    // send records its own row, so a partial failure is visible afterwards.
    const sent: WhatsAppMessage[] = [];
    for (const destination of numbers) {
      sent.push(
        await this.whatsapp.sendTemplate({
          campaignName: "bk_admin_sale_alert_",
          destination,
          recipientName: "Admin",
          templateParams,
          media: args.media,
          kind: WhatsAppMessageKind.RETAIL_BILL,
          relatedType: "SaleRecord",
          relatedId: args.billRef,
          sentById: args.sentById,
        }),
      );
    }
    return sent;
  }

  /** A template variable that is never blank — Meta rejects empty params. */
  private param(value: string | null | undefined, fallback: string): string {
    return this.whatsapp.sanitiseParam(value?.trim() || fallback);
  }
}

/** "27 Aug 2026" */
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/** "27 Aug 2026, 04:35 PM" */
function formatDateTime(date: Date): string {
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * "18,500" — a bare grouped number. The templates carry the word "Rs" as
 * static text, so a symbol here would render "Rs ₹18,500".
 */
function formatAmount(amount: number): string {
  return amount.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}
