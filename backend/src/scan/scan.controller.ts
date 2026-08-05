import { Controller, Get, Param } from "@nestjs/common";
import { ScanService } from "./scan.service";

// NOTE: RBAC guards intentionally not yet applied — see the same note in
// src/users/users.controller.ts.
@Controller("scan")
export class ScanController {
  constructor(private readonly scanService: ScanService) {}

  @Get(":sareeId")
  lookup(@Param("sareeId") sareeId: string) {
    return this.scanService.lookup(sareeId);
  }
}
