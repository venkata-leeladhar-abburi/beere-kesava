import { BadRequestException, Body, Controller, Get, Patch, Query, Res } from "@nestjs/common";
import type { Response } from "express";
import { UpdateLabelSettingsDto } from "./dto/update-label-settings.dto";
import { LabelsService } from "./labels.service";

// NOTE: RBAC guards intentionally not yet applied — see the same note in
// src/users/users.controller.ts.
@Controller("labels")
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) {}

  @Get("settings")
  getSettings() {
    return this.labelsService.getSettings();
  }

  @Patch("settings")
  updateSettings(@Body() dto: UpdateLabelSettingsDto) {
    return this.labelsService.updateSettings(dto);
  }

  @Get("barcode")
  async getBarcode(@Query("code") code: string | undefined, @Res() res: Response) {
    if (!code) {
      throw new BadRequestException("Query parameter 'code' is required");
    }
    const png = await this.labelsService.generateBarcodePng(code);
    res.setHeader("Content-Type", "image/png");
    res.send(png);
  }

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
