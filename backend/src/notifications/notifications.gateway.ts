import { Logger } from "@nestjs/common";
import { OnGatewayConnection } from "@nestjs/websockets";
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { JwtService } from "@nestjs/jwt";
import { Server, Socket } from "socket.io";
import { UserRole } from "../generated/prisma/client";
import type { AuthenticatedUser, JwtPayload } from "../auth/strategies/jwt.strategy";
import { readCookie, resolveSession, SESSION_COOKIE } from "../auth/session";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Room membership is derived from the socket's own JWT, never from
 * client-supplied userId/role — mirrors the scoping NotificationsService
 * applies to the REST endpoints (see notifications.service.ts). Before this,
 * the "subscribe" event trusted whatever userId/role the client sent, so any
 * signed-in socket could join `user:<anyone>` or `role:<any-role>` and
 * receive that person's/role's live notification stream — the same leak
 * S0.1 closed for the REST list/markRead endpoints, just left open here.
 *
 * The token's session is resolved exactly as for REST (auth/session.ts), so
 * a signed-out, revoked or deactivated session cannot open a socket either.
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

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    const user = await this.authenticate(client);
    if (!user) {
      client.emit("auth_error", { message: "Authentication required." });
      client.disconnect(true);
      return;
    }

    // Admin/superadmin mirror PermissionsGuard's unconditional bypass — the
    // admin console's notifications tab is an operational view over
    // everyone's traffic, same reasoning as NotificationsService.scopeFor.
    const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.SUPERADMIN;
    if (user.id) {
      void client.join(`user:${user.id}`);
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

  private async authenticate(client: Socket): Promise<AuthenticatedUser | null> {
    const explicit =
      (client.handshake.auth?.token as string | undefined) ??
      (client.handshake.query?.token as string | undefined) ??
      this.extractBearerToken(client.handshake.headers.authorization);
    const cookie = readCookie(client.handshake.headers.cookie, SESSION_COOKIE);

    // A browser attaches the cookie to a WebSocket handshake from any page,
    // and WebSockets are not covered by CORS, so a cookie-only handshake must
    // come from one of our own origins.
    if (!explicit && cookie && !this.isAllowedOrigin(client.handshake.headers.origin)) {
      this.logger.warn(`Rejected socket ${client.id}: cookie from origin ${client.handshake.headers.origin}`);
      return null;
    }

    const token = explicit ?? cookie;
    if (!token) return null;

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      return await resolveSession(this.prisma, payload);
    } catch (err) {
      this.logger.warn(`Rejected socket ${client.id}: ${(err as Error).message}`);
      return null;
    }
  }

  /** Mirrors main.ts's CORS rule: the CORS_ORIGIN list, or any origin outside production. */
  private isAllowedOrigin(origin: string | undefined): boolean {
    const allowed = process.env.CORS_ORIGIN;
    if (!allowed) return process.env.NODE_ENV !== "production";
    return !!origin && allowed.split(",").map((o) => o.trim()).includes(origin);
  }

  private extractBearerToken(header?: string): string | undefined {
    if (!header?.startsWith("Bearer ")) return undefined;
    return header.slice("Bearer ".length);
  }
}
