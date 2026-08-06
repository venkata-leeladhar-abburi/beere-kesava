import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import { UserRole } from "../generated/prisma/client";
import { CreateReturnDto } from "./dto/create-return.dto";
import { CreateSaleDto } from "./dto/create-sale.dto";
import { ListReturnQueryDto } from "./dto/list-return-query.dto";
import { ListSaleQueryDto } from "./dto/list-sale-query.dto";
import { SalesService } from "./sales.service";

// Retail/customer-facing module — SHOP access only.
@Controller("sales")
@RequireRoles(UserRole.SHOP)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  createSale(@Body() dto: CreateSaleDto) {
    return this.salesService.createSale(dto);
  }

  @Get()
  findAllSales(@Query() query: ListSaleQueryDto) {
    return this.salesService.findAllSales(query);
  }

  @Get(":saleRef")
  findOneSale(@Param("saleRef") saleRef: string) {
    return this.salesService.findOneSale(saleRef);
  }

  @Post("returns")
  createReturn(@Body() dto: CreateReturnDto) {
    return this.salesService.createReturn(dto);
  }

  @Get("returns/all")
  findAllReturns(@Query() query: ListReturnQueryDto) {
    return this.salesService.findAllReturns(query);
  }

  @Get("returns/:returnRef")
  findOneReturn(@Param("returnRef") returnRef: string) {
    return this.salesService.findOneReturn(returnRef);
  }
}
