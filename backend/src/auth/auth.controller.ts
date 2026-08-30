import { Body, Controller, Headers, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { CurrentUser } from "./decorators/current-user.decorator";
import { Public } from "./decorators/public.decorator";
import type { AuthenticatedUser } from "./strategies/jwt.strategy";
import { AuthService } from "./auth.service";
import { RequestOtpDto } from "./dto/request-otp.dto";
import { VerifyOtpDto } from "./dto/verify-otp.dto";

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
  verifyOtp(@Body() dto: VerifyOtpDto, @Headers("user-agent") userAgent?: string) {
    return this.authService.verifyOtp(dto, userAgent);
  }

  // Not @Public(): a logout has to name the session it is closing, which
  // means it needs the token. Sessions have no expiry (see auth.module.ts),
  // so this is the only thing that ever ends one in the login history.
  @Post("logout")
  logout(@CurrentUser() user: AuthenticatedUser, @Headers("user-agent") userAgent?: string) {
    return this.authService.logout(user.id, userAgent);
  }
}
