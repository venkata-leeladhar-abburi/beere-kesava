import { BadRequestException, Body, Controller, Get, Patch, Query, Res } from "@nestjs/common";
import type { Response } from "express";
import { Public } from "../auth/decorators/public.decorator";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import { UserRole } from "../generated/prisma/client";
import { UpdateLabelSettingsDto } from "./dto/update-label-settings.dto";
import { LabelsService } from "./labels.service";

// Label settings are edited only from LabelSettingsPage, which the frontend
// mounts exclusively in the superadmin dashboard. Barcode/QR rendering and
// reading the settings stay open - they are needed wherever labels print,
// including plain <img src> tags (print sheets, physical tag previews) that
// never carry an Authorization header, so both are marked @Public().
@Controller("labels")
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) {}

  @Public()
  @Get("settings")
  getSettings() {
    return this.labelsService.getSettings();
  }

  @RequireRoles(UserRole.SUPERADMIN)
  @Patch("settings")
  updateSettings(@Body() dto: UpdateLabelSettingsDto) {
    return this.labelsService.updateSettings(dto);
  }

  @Public()
  @Get("barcode")
  async getBarcode(
    @Query("code") code: string | undefined,
    @Query("text") text: string | undefined,
    @Res() res: Response,
  ) {
    if (!code) {
      throw new BadRequestException("Query parameter 'code' is required");
    }
    // `text=0` suppresses the human-readable line under the bars. Label tiles
    // print the code themselves at a readable size; on a 50x25mm sticker there
    // is no room to print it twice.
    const includeText = text !== "0" && text !== "false";
    const png = await this.labelsService.generateBarcodePng(code, includeText);
    res.setHeader("Content-Type", "image/png");
    res.send(png);
  }

  @Public()
  @Get("qrcode")
  async getQrCode(
    @Query("code") code: string | undefined,
    @Query("bare") bare: string | undefined,
    @Res() res: Response,
  ) {
    if (!code) {
      throw new BadRequestException("Query parameter 'code' is required");
    }
    // `bare=1` encodes the saree id on its own instead of the /scan?id= link
    // — what a printed tag needs when it falls back to a QR (see
    // labels.service.ts).
    const png = await this.labelsService.generateQrCodePng(code, bare === "1" || bare === "true");
    res.setHeader("Content-Type", "image/png");
    res.send(png);
  }
}
