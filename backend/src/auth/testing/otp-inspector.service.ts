import { Injectable } from "@nestjs/common";

/**
 * Holds the plaintext OTP most recently issued to each phone number, purely
 * in process memory — never written to the database, never logged.
 *
 * This service is only ever provided by AuthModule when
 * isE2eTestModeEnabled() is true (see the guard there and in
 * test-only-auth.controller.ts). It exists because AuthService.requestOtp
 * bcrypt-hashes the code before persisting it, which is correct for
 * production but leaves no way for an E2E test to discover a valid code to
 * complete a real login. This is the seam that lets Playwright specs log in
 * as a real seeded user through the real /auth/verify-otp endpoint, instead
 * of minting a JWT directly and skipping the auth flow entirely.
 */
@Injectable()
export class OtpInspectorService {
  private readonly lastCodeByPhone = new Map<string, string>();

  record(phone: string, code: string): void {
    this.lastCodeByPhone.set(phone, code);
  }

  /** Returns the most recently issued code for `phone`, if any. */
  peek(phone: string): string | undefined {
    return this.lastCodeByPhone.get(phone);
  }
}
