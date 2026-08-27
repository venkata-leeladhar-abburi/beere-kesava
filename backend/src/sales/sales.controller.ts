import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import { UserRole } from "../generated/prisma/client";
import { CreateReturnDto } from "./dto/create-return.dto";
import { CreateSaleDto } from "./dto/create-sale.dto";
import { ListReturnQueryDto } from "./dto/list-return-query.dto";
import { ListSaleQueryDto } from "./dto/list-sale-query.dto";
import { RegisterDispatchedReturnsDto } from "./dto/register-dispatched-returns.dto";
import { RegisterReturnedSareeDto } from "./dto/register-returned-saree.dto";
import { RegisterReturnedSareesDto } from "./dto/register-returned-sarees.dto";
import { SalesService } from "./sales.service";

// Retail/customer-facing module — SHOP, ACCOUNTANT, ADMIN, SUPERADMIN access.
@Controller("sales")
@RequireRoles(UserRole.SHOP, UserRole.ACCOUNTANT, UserRole.ADMIN, UserRole.SUPERADMIN)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  createSale(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateSaleDto) {
    return this.salesService.createSale({ ...dto, actorId: user.id });
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

  // Untracked wholesale return — the piece has no barcode and no prior record,
  // so it is registered from the operator's description. Declared before the
  // ":returnRef" GET routes so "untracked" is never read as a return ref.
  @Post("returns/untracked")
  registerReturnedSaree(@Body() dto: RegisterReturnedSareeDto) {
    return this.salesService.registerReturnedSaree(dto);
  }

  // A whole wholesale consignment in one write — the shop registers every
  // piece a vendor sent back together, and they succeed or fail together.
  @Post("returns/untracked/bulk")
  registerReturnedSarees(@Body() dto: RegisterReturnedSareesDto) {
    return this.salesService.registerReturnedSarees(dto);
  }

  // A wholesale buyer sending back pieces off a consignment we dispatched to
  // them. Declared before the ":returnRef" routes for the same reason
  // "untracked" is.
  @Post("returns/dispatched")
  registerDispatchedReturns(@Body() dto: RegisterDispatchedReturnsDto) {
    return this.salesService.registerDispatchedReturns(dto);
  }

  /** Every returned saree, categorised, for the shop's Inventory screen. */
  @Get("returns/stock")
  listReturnStock() {
    return this.salesService.listReturnStock();
  }

  /** Makes one held return sellable and puts it into shop stock. */
  @Post("returns/:returnRef/restock")
  sendReturnToInventory(
    @Param("returnRef") returnRef: string,
    @Body() body: { actorId?: string },
  ) {
    return this.salesService.sendReturnToInventory(returnRef, body?.actorId);
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
