import { Body, Controller, Get, Post } from "@nestjs/common";
import { RawMaterialsService, CreateGrnDto } from "./raw-materials.service";

@Controller("materials")
export class RawMaterialsController {
  constructor(private readonly rawMaterialsService: RawMaterialsService) {}

  @Get("stock")
  listStock() {
    return this.rawMaterialsService.listStock();
  }

  @Get("grn")
  listGrns() {
    return this.rawMaterialsService.listGrns();
  }

  @Post("grn")
  createGrn(@Body() dto: CreateGrnDto) {
    return this.rawMaterialsService.createGrn(dto);
  }
}
