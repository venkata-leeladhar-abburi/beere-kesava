import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { CreateNotificationDto } from "./dto/create-notification.dto";
import { ListNotificationsQueryDto } from "./dto/list-notifications-query.dto";
import { NotificationsService } from "./notifications.service";

// NOTE: RBAC guards intentionally not yet applied — see the same note in
// src/users/users.controller.ts.
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListNotificationsQueryDto) {
    return this.notificationsService.findAll(query);
  }

  @Patch(":id/read")
  markRead(@Param("id") id: string) {
    return this.notificationsService.markRead(id);
  }
}
