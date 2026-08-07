import { Body, Controller, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Public } from "./decorators/public.decorator";
import { AuthService } from "./auth.service";
import { RequestOtpDto } from "./dto/request-otp.dto";
import { VerifyOtpDto } from "./dto/verify-otp.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Stricter than the global default: enough for legitimate retry/resend,
  // not enough to spam-trigger paid SMS/WhatsApp sends once real delivery lands.
  @Public()
  @Throttle({ default: { limit: 4, ttl: 60_000 } })
  @Post("request-otp")
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto);
  }

  // Slows brute-forcing the OTP code without breaking a legitimate user who
  // fat-fingers their code a couple of times.
  @Public()
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @Post("verify-otp")
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }
}
