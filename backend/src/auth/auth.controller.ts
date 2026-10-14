import { Body, Controller, Headers, Post, Res } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Response } from "express";
import { CurrentUser } from "./decorators/current-user.decorator";
import { Public } from "./decorators/public.decorator";
import type { AuthenticatedUser } from "./strategies/jwt.strategy";
import { AuthService } from "./auth.service";
import { RequestOtpDto } from "./dto/request-otp.dto";
import { SwitchRoleDto } from "./dto/switch-role.dto";
import { VerifyOtpDto } from "./dto/verify-otp.dto";
import { AUTH_MODE_HEADER, SESSION_COOKIE, sessionCookieOptions } from "./session";

/**
 * Cookie mode (`X-Auth-Mode: cookie`): the token goes into an httpOnly cookie
 * and is left out of the body, so page script never holds it. Without the
 * header the token is returned in the body as before, for bearer-mode
 * clients, scripts and the integration tests.
 */
function deliver<T extends { token: string }>(result: T, mode: string | undefined, res: Response) {
  if (mode !== "cookie") return result;
  res.cookie(SESSION_COOKIE, result.token, sessionCookieOptions());
  const { token: _token, ...rest } = result;
  return rest;
}
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // These two are the realistic brute-force target (no account lockout, no
  // CAPTCHA) — a tighter per-IP limit than the app-wide default (see
  // ThrottlerModule.forRoot in app.module.ts), layered on top of AuthService's
  // own per-phone 60s cooldown + 5-per-hour cap rather than replacing it.
  // Deliberately not razor-tight: Playwright's e2e suite runs up to 4
  // parallel workers against the same two seeded phone numbers from one
  // machine (see frontend/playwright.config.ts, frontend/e2e/fixtures/auth.ts)
  // and that's legitimate traffic this must not 429.
  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post("request-otp")
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto);
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post("verify-otp")
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
    @Headers("user-agent") userAgent?: string,
    @Headers(AUTH_MODE_HEADER) mode?: string,
  ) {
    return deliver(await this.authService.verifyOtp(dto, userAgent), mode, res);
  }

  // Not @Public(): swaps the session onto another portal assigned to the
  // same person. AuthService re-checks the assignment against the database.
  @Post("switch-role")
  async switchRole(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SwitchRoleDto,
    @Res({ passthrough: true }) res: Response,
    @Headers(AUTH_MODE_HEADER) mode?: string,
  ) {
    const result = await this.authService.switchRole(user, dto.role, {
      latitude: dto.latitude,
      longitude: dto.longitude,
      accuracyMeters: dto.accuracyMeters,
    });
    return deliver(result, mode, res);
  }

  // Not @Public(): a logout has to name the session it is closing, which
  // means it needs the token. Sessions have no expiry (see auth.module.ts),
  // so this, or an admin revoking it, is the only thing that ends one.
  @Post("logout")
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
    @Headers("user-agent") userAgent?: string,
  ) {
    const result = await this.authService.logout(user, userAgent);
    // Cleared whether or not this client used cookie mode: harmless if absent.
    const { maxAge: _maxAge, ...cookie } = sessionCookieOptions();
    res.clearCookie(SESSION_COOKIE, cookie);
    return result;
  }
}
