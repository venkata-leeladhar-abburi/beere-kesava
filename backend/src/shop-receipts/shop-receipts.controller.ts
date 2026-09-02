import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import { UserRole } from "../generated/prisma/client";
import { CreateShopReceiptDto } from "./dto/create-shop-receipt.dto";
import { ListShopReceiptsQueryDto } from "./dto/list-shop-receipts-query.dto";
import { ShopReceiptsService } from "./shop-receipts.service";

// Receiving is the shop counter's job; admins and superadmins are in the list
// because they work inside the shop portal (AdminViewingBanner) and because
// the receipt history is an owner-facing record.
@Controller("shop-receipts")
@RequireRoles(UserRole.SHOP, UserRole.ADMIN, UserRole.SUPERADMIN)
export class ShopReceiptsController {
  constructor(private readonly shopReceiptsService: ShopReceiptsService) {}

  /** Consignments waiting to be received at the counter. */
  @Get("pending")
  findPending() {
    return this.shopReceiptsService.findPendingDispatches();
  }

  @Get()
  findAll(@Query() query: ListShopReceiptsQueryDto) {
    return this.shopReceiptsService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.shopReceiptsService.findOne(id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateShopReceiptDto) {
    return this.shopReceiptsService.create(dto, user);
  }
}
