import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { PermissionsGuard } from "./guards/permissions.guard";
import { JwtStrategy } from "./strategies/jwt.strategy";

// The fallback secret below is committed source, so it's only ever safe for
// local dev — a production deploy relying on it would let anyone forge a
// valid JWT for any role. Fail fast at boot instead of shipping that silently.
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in production — refusing to start with the dev fallback secret.");
}

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || "beere-kesava-secret-key-2026",
      signOptions: { expiresIn: "30d" },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    // Registered globally: every route requires a valid JWT unless marked @Public().
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Registered globally too; it's a no-op unless a route carries
    // @RequirePermissions(...) or @RequireRoles(...). @RequirePermissions
    // does a real DB lookup against Permission/RolePermission/
    // UserPermissionOverride (via the global PrismaModule).
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
  exports: [AuthService],
})
export class AuthModule {}
