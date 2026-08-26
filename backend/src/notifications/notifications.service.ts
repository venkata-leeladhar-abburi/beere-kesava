import { Injectable } from "@nestjs/common";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import { ForbiddenScopeError, NotFoundError } from "../common/errors";
import { PaginatedResult } from "../common/pagination";
import { NotificationTargetType, Prisma, UserRole } from "../generated/prisma/client";
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

  /**
   * Scoped to the caller. A non-admin sees exactly two things: notifications
   * addressed to them personally, and notifications broadcast to their role.
   * The query's userId/role filters are ignored for them — previously they
   * were trusted, so changing `?role=ADMIN` in the URL returned another
   * role's feed.
   *
   * ADMIN/SUPERADMIN keep the ability to filter by any userId/role, since
   * the admin console's notifications tab is an operational view over
   * everyone's traffic. That mirrors PermissionsGuard, which already
   * bypasses both roles unconditionally.
   */
  async findAll(
    query: ListNotificationsQueryDto,
    user: AuthenticatedUser,
  ): Promise<PaginatedResult<Prisma.NotificationGetPayload<object>>> {
    const where: Prisma.NotificationWhereInput = {
      ...this.scopeFor(query, user),
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

  private isAdmin(user: AuthenticatedUser): boolean {
    return user.role === UserRole.ADMIN || user.role === UserRole.SUPERADMIN;
  }

  private scopeFor(
    query: ListNotificationsQueryDto,
    user: AuthenticatedUser,
  ): Prisma.NotificationWhereInput {
    if (this.isAdmin(user)) {
      return { userId: query.userId, role: query.role };
    }

    return {
      OR: [
        ...(user.id ? [{ userId: user.id }] : []),
        { role: user.role },
      ],
    };
  }

  async markRead(id: string, user: AuthenticatedUser) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      throw new NotFoundError("Notification", id);
    }

    // Same scope rule as findAll: you may only mark read what you could read.
    const isOwn =
      (!!user.id && notification.userId === user.id) || notification.role === user.role;
    if (!this.isAdmin(user) && !isOwn) {
      throw new ForbiddenScopeError("This notification is addressed to someone else.");
    }

    return this.prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  }
}
