import { Injectable } from "@nestjs/common";
import * as bwipjs from "bwip-js/node";
import * as QRCode from "qrcode";

@Injectable()
export class LabelsService {
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
