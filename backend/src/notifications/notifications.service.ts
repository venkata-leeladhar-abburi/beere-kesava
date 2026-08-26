import { Injectable, NotFoundException } from "@nestjs/common";
import { PaginatedResult } from "../common/pagination";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
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

    const [items, total] = await Promise.all([
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

  /**
   * Marks a notification read on behalf of `user`.
   *
   * The lookup is scoped to notifications actually addressed to the caller -
   * either directly (targetType USER, matching userId) or via their role
   * (targetType ROLE, matching role). Without that scope this was a plain
   * IDOR: any authenticated user could mark any other user's notification
   * read simply by guessing an id.
   *
   * A notification that exists but belongs to someone else returns 404 rather
   * than 403, so the response cannot be used to probe which ids exist.
   */
  async markRead(id: string, user: AuthenticatedUser) {
    // `userId: undefined` would make Prisma drop the condition entirely and
    // match every USER-targeted row, so the personal branch is only added
    // when there actually is an id to match on. AuthenticatedUser.id is
    // optional - PermissionsGuard guards against the same thing with `?? ""`.
    const addressedToCaller: Prisma.NotificationWhereInput[] = [
      { targetType: NotificationTargetType.ROLE, role: user.role },
    ];
    if (user.id) {
      addressedToCaller.push({ targetType: NotificationTargetType.USER, userId: user.id });
    }

    const notification = await this.prisma.notification.findFirst({
      where: { id, OR: addressedToCaller },
    });
    if (!notification) {
      throw new NotFoundException(`Notification ${id} not found`);
    }
    return this.prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  }
}
