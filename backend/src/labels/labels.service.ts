import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as bwipjs from "bwip-js/node";
import * as QRCode from "qrcode";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateLabelSettingsDto } from "./dto/update-label-settings.dto";

// Fixed id for the single global LabelSettings row — this table is a
// singleton (one shop-wide label/print configuration), not per-user.
const LABEL_SETTINGS_SINGLETON_ID = "singleton";

// The stock the roll printer is actually loaded with. Rows seeded before this
// was known still carry the old A4-era default, which made every label print
// oversized and run off the sticker; they are migrated forward on first read
// (a superadmin who has deliberately chosen any other size is left alone).
const LEGACY_LABEL_SIZE = "100mm × 50mm (Default)";
const DEFAULT_LABEL_SIZE = "50mm × 25mm (Default)";

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
      if (existing.labelSize !== LEGACY_LABEL_SIZE) {
        return existing;
      }
      return this.prisma.labelSettings.update({
        where: { id: LABEL_SETTINGS_SINGLETON_ID },
        data: { labelSize: DEFAULT_LABEL_SIZE },
      });
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
   * labels.
   *
   * `paddingwidth: 10` is the part that makes a printed tag actually scan.
   * Code128 requires a blank quiet zone of at least 10 narrow modules on
   * each side of the symbol, and bwip-js adds NONE by default: the PNG began
   * and ended on a bar. On the label tile that image is stretched to the full
   * sticker width, so the first and last bars ran straight into the tile's
   * border and the decoder had nothing to lock onto. Baking the quiet zone
   * into the image means it scales with the bars however the tile sizes them.
   *
   * `scale: 6` (was 4) is 6 device pixels per narrow module, so the browser
   * is downsampling a generous source rather than interpolating a thin one
   * into the printer's dot grid — blurred, grey-edged bars are exactly what a
   * 203dpi thermal head turns into an unreadable smudge.
   *
   * `height: 8` (mm) rather than 14: the tile gives the bars roughly 7mm, and
   * a source that is already about that tall keeps the stretch honest.
   */
  async generateBarcodePng(code: string, includeText = true): Promise<Buffer> {
    return bwipjs.toBuffer({
      bcid: "code128",
      text: code,
      scale: 6,
      height: 8,
      paddingwidth: 10,
      includetext: includeText,
      textxalign: "center",
    });
  }

  /**
   * QR code PNG for the mobile-scan lookup flow — encodes a full /scan?id=
   * link (not the bare code), so a generic camera app (Google Lens, the
   * phone's own camera) recognises it as a link and offers to open it,
   * landing straight on that saree's MobileScanView instead of just
   * decoding inert text the way the Code128 barcode does.
   *
   * Printed labels do NOT come through here — they draw <ScannableCode>,
   * which renders SVG (sharp at any printer DPI, where this raster would be
   * resampled) and encodes the bare id at error-correction level L, which the
   * app's own reader detects far more reliably than this one's level M.
   */
  async generateQrCodePng(code: string): Promise<Buffer> {
    const frontendUrl = this.configService.get<string>("FRONTEND_URL") ?? "http://localhost:5175";
    const scanUrl = `${frontendUrl.replace(/\/$/, "")}/scan?id=${encodeURIComponent(code)}`;
    return QRCode.toBuffer(scanUrl, { type: "png", margin: 1, scale: 6 });
  }
}
