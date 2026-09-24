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
   * One role notification per `groupKey`, built up across several calls.
   *
   * The first call creates it; each later call with the same key hands the
   * current payload to `merge` and saves the result on the same row, marks
   * it unread again and re-broadcasts it, so a live feed replaces the entry
   * rather than adding a second one. Used for a counter bill, which is
   * recorded one saree per request but is one event to the people reading
   * the feed. Callers send the parts of a group one after another, so two
   * calls for the same key never race.
   */
  async notifyRoleGrouped(
    role: UserRole,
    type: string,
    groupKey: string,
    merge: (existing: Record<string, unknown> | null) => Record<string, unknown>,
  ) {
    const existing = await this.prisma.notification.findFirst({
      where: {
        targetType: NotificationTargetType.ROLE,
        role,
        type,
        payload: { path: ["groupKey"], equals: groupKey },
      },
    });
    if (!existing) {
      return this.notifyRole(role, type, { ...merge(null), groupKey });
    }

    const updated = await this.prisma.notification.update({
      where: { id: existing.id },
      data: {
        payload: { ...merge(existing.payload as Record<string, unknown> | null), groupKey },
        readAt: null,
      },
    });
    this.gateway.emitToRole(role, updated);
    return updated;
  }

  /** Broadcast to every holder of a role. Thin wrapper over create() so call sites read as one line. */
  async notifyRole(role: UserRole, type: string, payload?: Record<string, unknown>) {
    return this.create({ targetType: NotificationTargetType.ROLE, role, type, payload });
  }

  /** Push to one person. */
  async notifyUser(userId: string, type: string, payload?: Record<string, unknown>) {
    return this.create({ targetType: NotificationTargetType.USER, userId, type, payload });
  }

  /**
   * Push to the portal account linked to a weaver. Weavers are a domain
   * record, not a login — only those with a User row carrying
   * `linkedWeaverId` can receive anything, so this is a no-op (not an error)
   * for a weaver who has never been given portal access.
   */
  async notifyWeaver(weaverId: string, type: string, payload?: Record<string, unknown>) {
    const linkedUser = await this.prisma.user.findUnique({
      where: { linkedWeaverId: weaverId },
      select: { id: true },
    });
    if (!linkedUser) return null;
    return this.notifyUser(linkedUser.id, type, payload);
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
