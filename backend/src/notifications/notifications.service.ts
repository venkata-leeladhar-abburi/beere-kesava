import { Injectable, NotFoundException } from "@nestjs/common";
import { PaginatedResult } from "../common/pagination";
import { NotificationTargetType, Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateNotificationDto } from "./dto/create-notification.dto";
import { ListNotificationsQueryDto } from "./dto/list-notifications-query.dto";
import { NotificationsGateway } from "./notifications.gateway";

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
  ) {}

  async create(dto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        targetType: dto.targetType,
        userId: dto.userId,
        role: dto.role,
        type: dto.type,
        payload: dto.payload as Prisma.InputJsonValue | undefined,
      },
    });

    if (notification.targetType === NotificationTargetType.USER && notification.userId) {
      this.gateway.emitToUser(notification.userId, notification);
    } else if (notification.targetType === NotificationTargetType.ROLE && notification.role) {
      this.gateway.emitToRole(notification.role, notification);
    }

    return notification;
  }

  async findAll(
    query: ListNotificationsQueryDto,
  ): Promise<PaginatedResult<Prisma.NotificationGetPayload<object>>> {
    const where: Prisma.NotificationWhereInput = {
      userId: query.userId,
      role: query.role,
      readAt: query.unreadOnly ? null : undefined,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async markRead(id: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      throw new NotFoundException(`Notification ${id} not found`);
    }
    return this.prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  }
}
