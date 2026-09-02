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
  async getBarcode(@Query("code") code: string | undefined, @Res() res: Response) {
    if (!code) {
      throw new BadRequestException("Query parameter 'code' is required");
    }
    const png = await this.labelsService.generateBarcodePng(code);
    res.setHeader("Content-Type", "image/png");
    res.send(png);
  }

  @Public()
  @Get("qrcode")
  async getQrCode(@Query("code") code: string | undefined, @Res() res: Response) {
    if (!code) {
      throw new BadRequestException("Query parameter 'code' is required");
    }
    const png = await this.labelsService.generateQrCodePng(code);
    res.setHeader("Content-Type", "image/png");
    res.send(png);
  }
}
