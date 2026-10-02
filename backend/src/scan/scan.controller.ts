import { Controller, Get, Param, Query } from "@nestjs/common";
import { ScanService } from "./scan.service";

// NOTE: RBAC guards intentionally not yet applied — see the same note in
// src/users/users.controller.ts.
@Controller("scan")
export class ScanController {
  constructor(private readonly scanService: ScanService) {}

  /**
   * The current code for a scanned/typed one — old codes from tags printed
   * before a supplier short name or invoice number change map to the new
   * ones. Screens that match a scan against sarees already on screen call
   * this first. Declared before ":sareeId" so "resolve" isn't read as an id.
   */
  @Get("resolve")
  async resolve(@Query("code") code = "") {
    return { code: await this.scanService.resolveCode(code) };
  }

  @Get(":sareeId")
  lookup(@Param("sareeId") sareeId: string) {
    return this.scanService.lookup(sareeId);
  }
}
