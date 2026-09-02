import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as bwipjs from "bwip-js/node";
import * as QRCode from "qrcode";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateLabelSettingsDto } from "./dto/update-label-settings.dto";

// Fixed id for the single global LabelSettings row — this table is a
// singleton (one shop-wide label/print configuration), not per-user.
const LABEL_SETTINGS_SINGLETON_ID = "singleton";

@Injectable()
export class LabelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /** Get-or-create the singleton label settings row, seeding defaults on first read. */
  async getSettings() {
    const existing = await this.prisma.labelSettings.findUnique({
      where: { id: LABEL_SETTINGS_SINGLETON_ID },
    });
    if (existing) {
      return existing;
    }
    return this.prisma.labelSettings.create({
      data: { id: LABEL_SETTINGS_SINGLETON_ID },
    });
  }

  /** Partially update the singleton label settings row, creating it first if needed. */
  async updateSettings(dto: UpdateLabelSettingsDto) {
    await this.getSettings();
    return this.prisma.labelSettings.update({
      where: { id: LABEL_SETTINGS_SINGLETON_ID },
      data: dto,
    });
  }

  /**
   * Code128 linear barcode PNG — used for printable material-batch / saree
   * labels. scale 4 (was 3) widens each bar module — a phone camera scanning
   * a small printed tag a few inches away needs thicker bars to resolve
   * reliably; 3 was thin enough to make real-world scans miss constantly.
   */
  async generateBarcodePng(code: string): Promise<Buffer> {
    return bwipjs.toBuffer({
      bcid: "code128",
      text: code,
      scale: 4,
      height: 14,
      includetext: true,
      textxalign: "center",
    });
  }

  /**
   * QR code PNG for the mobile-scan lookup flow — encodes a full /scan?id=
   * link (not the bare code), so a generic camera app (Google Lens, the
   * phone's own camera) recognises it as a link and offers to open it,
   * landing straight on that saree's MobileScanView instead of just
   * decoding inert text the way the Code128 barcode does.
   */
  async generateQrCodePng(code: string): Promise<Buffer> {
    const frontendUrl = this.configService.get<string>("FRONTEND_URL") ?? "http://localhost:5175";
    const scanUrl = `${frontendUrl.replace(/\/$/, "")}/scan?id=${encodeURIComponent(code)}`;
    return QRCode.toBuffer(scanUrl, { type: "png", margin: 1, scale: 6 });
  }
}
