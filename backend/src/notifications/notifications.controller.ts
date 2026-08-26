import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import { UserRole } from "../generated/prisma/client";
import { CreateNotificationDto } from "./dto/create-notification.dto";
import { ListNotificationsQueryDto } from "./dto/list-notifications-query.dto";
import { NotificationsService } from "./notifications.service";

// Notification fan-out. Creating one is role-gated (see the handler);
// reading and marking-read stay open to every authenticated role because
// the bell UI is present in every portal.
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // Raising a notification is a push to other people, so it is role-gated.
  // WEAVER is excluded deliberately: the weaver portal only ever reads its
  // notification feed. Note the DTO still lets a caller choose its own
  // targetType/role, so a permitted role can address any other role - that is
  // a separate, service-level constraint still to be added.
  @RequireRoles(
    UserRole.SHOP,
    UserRole.WORKER,
    UserRole.ACCOUNTANT,
    UserRole.ADMIN,
    UserRole.SUPERADMIN,
  )
  @Post()
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListNotificationsQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.findAll(query, user);
  }

  // Left open to every authenticated role on purpose: the notification bell
  // appears in the shop, weaver, worker and admin surfaces alike. Ownership,
  // not role, is the right control here - the service scopes the update to
  // notifications actually addressed to the caller.
  @Patch(":id/read")
  markRead(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markRead(id, user);
  }
}
