import { Controller, Get, NotFoundException, Query } from "@nestjs/common";
import { Public } from "../decorators/public.decorator";
import { OtpInspectorService } from "./otp-inspector.service";

/**
 * Only ever registered by AuthModule when isE2eTestModeEnabled() is true —
 * see the guard there. In every other environment this class is never
 * instantiated and the route does not exist.
 *
 * Playwright's login helper calls this after POST /auth/request-otp to
 * retrieve the code it needs for POST /auth/verify-otp, since the real code
 * is bcrypt-hashed in the database and normally reaches the user only via
 * WhatsApp.
 */
@Public()
@Controller("auth/testing")
export class TestOnlyAuthController {
  constructor(private readonly otpInspector: OtpInspectorService) {}

  @Get("otp")
  getOtp(@Query("phone") phone: string) {
    const code = this.otpInspector.peek(phone);
    if (!code) {
      throw new NotFoundException(`No OTP has been issued to "${phone}" in this process.`);
    }
    return { phone, code };
  }
}
