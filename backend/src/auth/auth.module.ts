import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { PermissionsGuard } from "./guards/permissions.guard";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { isE2eTestModeEnabled } from "./testing/e2e-test-mode";
import { OtpInspectorService } from "./testing/otp-inspector.service";
import { TestOnlyAuthController } from "./testing/test-only-auth.controller";

// The fallback secret below is committed source, so it's only ever safe for
// local dev — a production deploy relying on it would let anyone forge a
// valid JWT for any role. Fail fast at boot instead of shipping that silently.
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in production — refusing to start with the dev fallback secret.");
}

// Decided once, at module load, rather than per-request: a route this
// function excludes from `controllers`/`providers` below is never wired into
// Nest's router at all, not merely refused when called. See
// testing/e2e-test-mode.ts for the two conditions this requires.
const e2eTestMode = isE2eTestModeEnabled();

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    // No expiresIn: per product decision, a session lasts until the user
    // explicitly logs out, not on a fixed clock — the frontend's own
    // idle-timeout auto-logout was removed for the same reason.
    JwtModule.register({
      secret: process.env.JWT_SECRET || "beere-kesava-secret-key-2026",
    }),
  ],
  controllers: [AuthController, ...(e2eTestMode ? [TestOnlyAuthController] : [])],
  providers: [
    AuthService,
    JwtStrategy,
    // OtpInspectorService is a real dependency of AuthService (see its
    // constructor) but only actually provided in E2E test mode; everywhere
    // else the `@Optional()` injection there resolves to undefined and every
    // call site no-ops.
    ...(e2eTestMode ? [OtpInspectorService] : []),
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
