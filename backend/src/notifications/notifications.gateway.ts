import { Logger } from "@nestjs/common";
import { OnGatewayConnection } from "@nestjs/websockets";
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { JwtService } from "@nestjs/jwt";
import { Server, Socket } from "socket.io";
import { UserRole } from "../generated/prisma/client";
import type { JwtPayload } from "../auth/strategies/jwt.strategy";

/**
 * Room membership is derived from the socket's own JWT, never from
 * client-supplied userId/role — mirrors the scoping NotificationsService
 * applies to the REST endpoints (see notifications.service.ts). Before this,
 * the "subscribe" event trusted whatever userId/role the client sent, so any
 * signed-in socket could join `user:<anyone>` or `role:<any-role>` and
 * receive that person's/role's live notification stream — the same leak
 * S0.1 closed for the REST list/markRead endpoints, just left open here.
 *
 * A client that fails to authenticate (missing/expired/invalid token) is
 * disconnected immediately rather than left connected-but-unsubscribed —
 * silently dropping their notifications would be worse than a clear
 * reconnect-with-a-fresh-token failure.
 */
@WebSocketGateway({ cors: { origin: "*" } })
export class NotificationsGateway implements OnGatewayConnection {
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: Socket) {
    const user = this.authenticate(client);
    if (!user) {
      client.emit("auth_error", { message: "Authentication required." });
      client.disconnect(true);
      return;
    }

    // Admin/superadmin mirror PermissionsGuard's unconditional bypass — the
    // admin console's notifications tab is an operational view over
    // everyone's traffic, same reasoning as NotificationsService.scopeFor.
    const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.SUPERADMIN;
    if (user.sub) {
      void client.join(`user:${user.sub}`);
    }
    void client.join(`role:${user.role}`);
    if (isAdmin) {
      Object.values(UserRole).forEach((role) => void client.join(`role:${role}`));
    }

    client.emit("connected", { socketId: client.id });
  }

  /**
   * Kept as a no-op subscribe handler so existing clients that still emit
   * "subscribe" on connect don't error — room membership is already set in
   * handleConnection from the verified token, so there is nothing left to do.
   */
  @SubscribeMessage("subscribe")
  handleSubscribe(): void {
    // Intentionally empty — see class doc.
  }

  emitToUser(userId: string, notification: unknown) {
    this.server.to(`user:${userId}`).emit("notification", notification);
  }

  emitToRole(role: UserRole, notification: unknown) {
    this.server.to(`role:${role}`).emit("notification", notification);
  }

  private authenticate(client: Socket): JwtPayload | null {
    const token =
      (client.handshake.auth?.token as string | undefined) ??
      (client.handshake.query?.token as string | undefined) ??
      this.extractBearerToken(client.handshake.headers.authorization);

    if (!token) return null;

    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch (err) {
      this.logger.warn(`Rejected socket ${client.id}: ${(err as Error).message}`);
      return null;
    }
  }

  private extractBearerToken(header?: string): string | undefined {
    if (!header?.startsWith("Bearer ")) return undefined;
    return header.slice("Bearer ".length);
  }
}
