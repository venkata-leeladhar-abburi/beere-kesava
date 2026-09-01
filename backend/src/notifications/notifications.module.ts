import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { JWT_SECRET } from "../auth/jwt-secret";
import { NotificationsController } from "./notifications.controller";
import { NotificationsGateway } from "./notifications.gateway";
import { NotificationsService } from "./notifications.service";

@Module({
  imports: [
    // Same secret as AuthModule's JwtModule: the gateway verifies the very
    // tokens AuthService signs. Shared via ./auth/jwt-secret so the two can
    // never drift apart, and so the production guard there runs regardless of
    // which module Nest loads first.
    JwtModule.register({
      secret: JWT_SECRET,
    }),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway],
  exports: [NotificationsService],
})
export class NotificationsModule {}
