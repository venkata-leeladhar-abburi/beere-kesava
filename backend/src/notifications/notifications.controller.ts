import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import { CreateNotificationDto } from "./dto/create-notification.dto";
import { ListNotificationsQueryDto } from "./dto/list-notifications-query.dto";
import { NotificationsService } from "./notifications.service";

/**
 * Every route here is authenticated — JwtAuthGuard and PermissionsGuard are
 * registered globally as APP_GUARDs (auth.module.ts), so there is no
 * unauthenticated path in. What was missing was *scoping*: `findAll` and
 * `markRead` took the target userId/role straight from the client, so any
 * signed-in user could list, and mark read, any other user's or role's
 * notifications by editing a query string. The caller's identity is now
 * passed to the service, which derives the scope itself.
 *
 * `create` stays open to any authenticated user by design — portals raise
 * notifications for other roles as part of normal operation (e.g. a SHOP
 * user recording a sale notifies ADMIN, see ShopHome.tsx).
 */
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListNotificationsQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.findAll(query, user);
  }

  @Patch(":id/read")
  markRead(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markRead(id, user);
  }
}
