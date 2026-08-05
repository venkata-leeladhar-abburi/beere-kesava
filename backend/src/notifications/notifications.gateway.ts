import { OnGatewayConnection } from "@nestjs/websockets";
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { UserRole } from "../generated/prisma/client";

// NOTE: no auth yet, so subscription rooms are self-declared by the client
// (userId/role passed in the "subscribe" event) rather than derived from a
// verified JWT. Once auth lands, derive the room server-side from the socket's
// authenticated user instead of trusting the client-supplied value.
@WebSocketGateway({ cors: { origin: "*" } })
export class NotificationsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    client.emit("connected", { socketId: client.id });
  }

  @SubscribeMessage("subscribe")
  handleSubscribe(client: Socket, payload: { userId?: string; role?: UserRole }) {
    if (payload.userId) {
      void client.join(`user:${payload.userId}`);
    }
    if (payload.role) {
      void client.join(`role:${payload.role}`);
    }
  }

  emitToUser(userId: string, notification: unknown) {
    this.server.to(`user:${userId}`).emit("notification", notification);
  }

  emitToRole(role: UserRole, notification: unknown) {
    this.server.to(`role:${role}`).emit("notification", notification);
  }
}
