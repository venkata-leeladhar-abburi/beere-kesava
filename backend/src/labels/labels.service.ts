import { Injectable } from "@nestjs/common";
import * as bwipjs from "bwip-js/node";
import * as QRCode from "qrcode";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateLabelSettingsDto } from "./dto/update-label-settings.dto";

// Fixed id for the single global LabelSettings row — this table is a
// singleton (one shop-wide label/print configuration), not per-user.
const LABEL_SETTINGS_SINGLETON_ID = "singleton";

@Injectable()
export class LabelsService {
  constructor(private readonly prisma: PrismaService) {}

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

  /** Code128 linear barcode PNG — used for printable material-batch / saree labels. */
  async generateBarcodePng(code: string): Promise<Buffer> {
    return bwipjs.toBuffer({
      bcid: "code128",
      text: code,
      scale: 3,
      height: 12,
      includetext: true,
      textxalign: "center",
    });
  }

  /** QR code PNG — used for the mobile-scan lookup flow. */
  async generateQrCodePng(code: string): Promise<Buffer> {
    return QRCode.toBuffer(code, { type: "png", margin: 1, scale: 6 });
  }
}
